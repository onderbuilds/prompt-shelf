(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const deps = isNode ? require('./schema.js') : root.PM;
  const mod = factory(deps);
  if (isNode) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  const CHROME_SYNC_QUOTA = Object.freeze({ bytes: 102400, perItem: 8192, maxItems: 512, perHour: 1800, perMinute: 120 });
  const CHUNK_CHARS = 7800;
  const PAYLOAD_BUDGET = 90 * 1024;
  const WARN_RATIO = 0.75;
  const META_KEY = 'pms_meta';
  const PREFIX = 'pms_';
  const FORMAT = 1;
  const LIMITER = Object.freeze({ minIntervalMs: 10000, maxPerHour: 60 });
  const BACKOFF = Object.freeze({ firstMs: 60000, maxMs: 3600000 });
  const STATE_KEY = 'pm_sync_state';
  const BASE_KEY = 'pm_sync_base';

  function stableStringify(x) {
    if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function bytesToB64(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64ToBytes(b64) {
    const s = atob(b64);
    const u8 = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i += 1) u8[i] = s.charCodeAt(i);
    return u8;
  }
  async function pipe(u8, stream) {
    const out = new Response(new Blob([u8]).stream().pipeThrough(stream));
    return new Uint8Array(await out.arrayBuffer());
  }
  async function compress(str) { return bytesToB64(await pipe(new TextEncoder().encode(str), new CompressionStream('deflate-raw'))); }
  async function decompress(b64) { return new TextDecoder().decode(await pipe(b64ToBytes(b64), new DecompressionStream('deflate-raw'))); }

  const itemBytes = (key, value) => new TextEncoder().encode(key).length + new TextEncoder().encode(JSON.stringify(value)).length;

  async function encodePayload(payload, info) {
    const json = stableStringify(payload);
    const packed = await compress(json);
    const gen = (info && info.gen) || Math.random().toString(36).slice(2, 8);
    const items = {};
    let n = 0;
    for (let i = 0; i < packed.length; i += CHUNK_CHARS) { items[PREFIX + gen + '_' + n] = packed.slice(i, i + CHUNK_CHARS); n += 1; }
    const meta = {
      fmt: FORMAT, gen, n,
      hash: await sha256(packed),
      dataHash: await sha256(json),
      rawBytes: json.length,
      deviceId: (info && info.deviceId) || '',
      writtenAt: (info && info.writtenAt) || new Date().toISOString(),
    };
    items[META_KEY] = meta;
    let bytes = 0;
    for (const [k, v] of Object.entries(items)) bytes += itemBytes(k, v);
    return { items, meta, bytes, chunks: n };
  }

  async function decodeItems(all) {
    const meta = all && all[META_KEY];
    if (!meta) return { status: 'empty', payload: null, meta: null };
    if (meta.fmt !== FORMAT) return { status: 'corrupt', reason: 'unknown format ' + meta.fmt, meta };
    let packed = '';
    for (let i = 0; i < meta.n; i += 1) {
      const c = all[PREFIX + meta.gen + '_' + i];
      if (typeof c !== 'string') return { status: 'incomplete', reason: 'missing chunk ' + i, meta };
      packed += c;
    }
    if (await sha256(packed) !== meta.hash) return { status: 'incomplete', reason: 'hash mismatch', meta };
    try {
      const payload = JSON.parse(await decompress(packed));
      return { status: 'ok', payload, meta };
    } catch (e) {
      return { status: 'corrupt', reason: 'decode failed: ' + e.message, meta };
    }
  }

  const SYNC_FIELDS = ['id', 'title', 'body', 'folder', 'tags', 'createdAt', 'updatedAt', 'rev', 'deviceId', 'packId', 'packTplId', 'packHash', 'conflictOf'];
  function syncRecord(p) { const o = {}; for (const k of SYNC_FIELDS) o[k] = p[k] === undefined ? null : p[k]; return o; }
  const snap = (p) => ({ title: p.title, body: p.body, folder: p.folder || '', tags: (p.tags || []).slice(), rev: p.rev || 1 });

  function buildPayload(data) {
    return {
      prompts: data.prompts.filter((p) => !S.isPristinePack(p)).map(syncRecord).sort((a, b) => (a.id < b.id ? -1 : 1)),
      tombstones: S.cleanTombstones(data.tombstones).sort((a, b) => (a.id < b.id ? -1 : 1)),
      packs: S.cleanPacks(data.packs),
      folders: [...(data.folders || [])].sort(),
    };
  }

  function baseFromPayload(payload) {
    const b = {};
    for (const p of payload.prompts) b[p.id] = snap(p);
    return b;
  }

  function newer(a, b) {
    if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
    if ((a.deviceId || '') !== (b.deviceId || '')) return (a.deviceId || '') > (b.deviceId || '') ? a : b;
    return S.contentHash(a) > S.contentHash(b) ? a : b;
  }

  function merge3(l, r, b) {
    if (S.sameContent(l, r)) {
      const pick = (l.rev || 1) !== (r.rev || 1) ? ((l.rev || 1) > (r.rev || 1) ? l : r) : newer(l, r);
      return { main: { ...pick, conflictOf: l.conflictOf || r.conflictOf || null } };
    }
    if (b) {
      const merged = {};
      let conflict = false;
      for (const f of S.CONTENT_FIELDS) {
        if (S.fieldEqual(f, l[f], r[f])) merged[f] = l[f];
        else if (S.fieldEqual(f, l[f], b[f])) merged[f] = r[f];
        else if (S.fieldEqual(f, r[f], b[f])) merged[f] = l[f];
        else { conflict = true; break; }
      }
      if (!conflict) {
        if (S.sameContent(merged, l)) return { main: l };
        if (S.sameContent(merged, r)) return { main: r };
        const n = newer(l, r);
        return {
          main: {
            ...n, ...merged,
            rev: Math.max(l.rev || 1, r.rev || 1) + 1,
            createdAt: l.createdAt < r.createdAt ? l.createdAt : r.createdAt,
            deviceId: (l.deviceId || '') > (r.deviceId || '') ? l.deviceId : r.deviceId,
          },
          fieldMerge: true,
        };
      }
    }

    const win = newer(l, r);
    const lose = win === l ? r : l;
    const copy = { ...lose, id: l.id + '~c' + S.contentHash(lose), conflictOf: l.id, packId: null, packTplId: null, packHash: null };
    return { main: win, copy };
  }

  function mergeSync(input) {
    const { local, remote } = input;
    const base = input.base || {};
    const stats = { added: 0, updated: 0, deleted: 0, conflicts: 0, resurrected: 0, fieldMerges: 0 };
    if (!remote) return { data: local, overwritten: [], deleted: [], stats, changed: false };

    const L = new Map(local.prompts.map((p) => [p.id, p]));
    const R = new Map((remote.prompts || []).map((p) => [p.id, S.normalizePrompt(p)]));
    const T = new Map(S.cleanTombstones([...(local.tombstones || []), ...(remote.tombstones || [])]).map((t) => [t.id, t]));
    const ids = [...L.keys(), ...[...R.keys()].filter((id) => !L.has(id)).sort()];
    const idSet = new Set(ids);
    const out = new Map();
    const copies = [];
    const overwritten = []; const deleted = [];

    for (const id of ids) {
      const l = L.get(id); const r = R.get(id);
      const b = base[id] || (l && S.isPristinePack(l) ? snap(l) : null);
      let main; let copy = null;
      if (l && r) {
        const m = merge3(l, r, b);
        main = m.main; copy = m.copy || null;
        if (copy) stats.conflicts += 1;
        if (m.fieldMerge) stats.fieldMerges += 1;
      } else main = l || r;

      const t = T.get(id);
      if (t && main) {
        const deletable = (t.hash && t.hash === S.contentHash(main)) || (b && S.sameContent(main, b));
        if (deletable && !copy) main = null;
        else { T.delete(id); stats.resurrected += 1; }
      }
      if (main) out.set(id, main);
      if (copy && !idSet.has(copy.id)) copies.push(copy);

      if (l && !main) { deleted.push(l); stats.deleted += 1; }
      else if (l && main && !S.sameContent(l, main)) { overwritten.push(l); stats.updated += 1; }
      else if (!l && main) stats.added += 1;
    }
    for (const c of copies) if (!out.has(c.id)) { out.set(c.id, c); if (!L.has(c.id)) stats.added += 1; }

    const packs = { ...S.cleanPacks(local.packs) };
    for (const [k, v] of Object.entries(S.cleanPacks(remote.packs))) if (!packs[k] || v.at > packs[k].at) packs[k] = v;
    const prompts = [...out.values()];
    const data = {
      ...local,
      prompts,
      tombstones: [...T.values()].sort((a, b) => (a.id < b.id ? -1 : 1)),
      packs,
      folders: S.collectFolders(prompts, [...(local.folders || []), ...(remote.folders || [])]),
    };
    const norm = (d) => stableStringify({ p: d.prompts, t: [...(d.tombstones || [])].sort((a, b) => (a.id < b.id ? -1 : 1)), k: S.cleanPacks(d.packs), f: [...(d.folders || [])].sort() });
    const changed = norm(data) !== norm(local);
    return { data, overwritten, deleted, stats, changed };
  }

  function reconcilePacks(data, registry, build, nowISO, device) {
    let changed = false;
    const tomb = new Set((data.tombstones || []).map((t) => t.id));
    for (const [packId, st] of Object.entries(data.packs || {})) {
      const pack = (registry || []).find((p) => p.id === packId);
      if (!pack) continue;
      if (st.installed) {
        const have = new Set(data.prompts.map((p) => p.id));
        for (const p of build(pack, st.lang, nowISO, device)) {
          if (!have.has(p.id) && !tomb.has(p.id)) { data.prompts.push(p); changed = true; }
        }
      } else {
        const before = data.prompts.length;
        data.prompts = data.prompts.filter((p) => !(p.packId === packId && S.isPristinePack(p)));
        if (data.prompts.length !== before) changed = true;

        data.prompts = data.prompts.map((p) => { if (p.packId !== packId) return p; changed = true; return { ...p, packId: null, packTplId: null, packHash: null }; });
      }
    }
    if (changed) data.folders = S.collectFolders(data.prompts, data.folders);
    return changed;
  }

  function createChromeSyncAdapter(area) {
    const getAll = async () => (await area.get(null)) || {};
    async function bytesInUse() {
      if (typeof area.getBytesInUse === 'function') return area.getBytesInUse(null);
      let n = 0;
      for (const [k, v] of Object.entries(await getAll())) n += itemBytes(k, v);
      return n;
    }
    return {
      id: 'chrome-sync',
      label: 'Chrome sync (chrome.storage.sync)',
      budget: PAYLOAD_BUDGET,
      async available() { return !!area; },
      async read() { return decodeItems(await getAll()); },
      async write(enc) {
        if (enc.bytes > PAYLOAD_BUDGET) { const e = new Error('PAYLOAD_TOO_LARGE'); e.code = 'over-quota'; throw e; }
        const all = await getAll();
        const stale = Object.keys(all).filter((k) => k.startsWith(PREFIX) && k !== META_KEY && !(k in enc.items));

        if ((await bytesInUse()) + enc.bytes > CHROME_SYNC_QUOTA.bytes * 0.97 && stale.length) { await area.remove(stale); stale.length = 0; }
        await area.set(enc.items);
        if (stale.length) await area.remove(stale);
      },
      async usage() { return { bytesInUse: await bytesInUse(), quotaBytes: CHROME_SYNC_QUOTA.bytes }; },
      onRemoteChange(cb) {
        if (!area.onChanged) return () => {};
        const fn = (changes) => { if (Object.keys(changes).some((k) => k.startsWith(PREFIX))) cb(); };
        area.onChanged.addListener(fn);
        return () => area.onChanged.removeListener(fn);
      },
    };
  }

  function isRateOrQuotaError(e) {
    return /MAX_WRITE_OPERATIONS|QUOTA_BYTES|MAX_ITEMS|quota/i.test(String(e && e.message));
  }

  function createSyncEngine(opts) {
    const { store, adapter, localArea } = opts;
    const now = opts.now || (() => Date.now());
    let running = null;

    async function getState() { const r = await localArea.get([STATE_KEY]); return (r && r[STATE_KEY]) || {}; }
    async function setState(patch) { const s = { ...(await getState()), ...patch, updatedAt: new Date(now()).toISOString() }; await localArea.set({ [STATE_KEY]: s }); return s; }
    async function getBase() { const r = await localArea.get([BASE_KEY]); return (r && r[BASE_KEY]) || {}; }
    async function setBase(b) { await localArea.set({ [BASE_KEY]: b }); }

    function partialBase(oldBase, data, remotePayload) {
      const R = new Map(((remotePayload && remotePayload.prompts) || []).map((p) => [p.id, p]));
      const b = {};
      for (const p of data.prompts) {
        const r = R.get(p.id);
        if (r && S.sameContent(p, r)) b[p.id] = snap(p);
        else if (oldBase[p.id]) b[p.id] = oldBase[p.id];
      }
      return b;
    }

    function limiterCheck(st) {
      const t = now();
      const writes = (st.writes || []).filter((x) => t - x < 3600000);
      const last = writes.length ? writes[writes.length - 1] : 0;
      if (t - last < LIMITER.minIntervalMs) return { ok: false, retryAt: last + LIMITER.minIntervalMs, writes };
      if (writes.length >= LIMITER.maxPerHour) return { ok: false, retryAt: writes[0] + 3600000, writes };
      return { ok: true, writes };
    }

    async function run(options) {
      const force = !!(options && options.force);
      const data0 = await store.load();
      if (!data0.settings.sync || !data0.settings.sync.enabled) return setState({ status: 'disabled' });
      if (!(await adapter.available())) return setState({ status: 'unavailable', message: adapter.id + ' is not configured' });
      let st = await getState();
      if (!force && st.backoffUntil && now() < st.backoffUntil) return st;

      let remote;
      try { remote = await adapter.read(); } catch (e) { return fail(st, e); }
      if (remote.status === 'incomplete') {
        const c = (st.incompleteCount || 0) + 1;
        return setState({ status: c >= 3 ? 'remote-corrupt' : 'waiting-remote', message: remote.reason, incompleteCount: c });
      }
      if (remote.status === 'corrupt') return setState({ status: 'remote-corrupt', message: remote.reason });

      const base = await getBase();
      let merge = null;
      await store.applySync((data, device) => {
        const m = mergeSync({ local: data, remote: remote.payload, base });
        const packChanged = reconcilePacks(m.data, opts.registry, opts.build, new Date(now()).toISOString(), device);
        merge = m;
        return (m.changed || packChanged) ? m : null;
      });
      const data = await store.load();
      const device = await store.getDeviceId();
      const payload = buildPayload(data);
      const enc = await encodePayload(payload, { deviceId: device, writtenAt: new Date(now()).toISOString() });
      const usage = await adapter.usage().catch(() => null);
      const common = { lastSyncAt: new Date(now()).toISOString(), bytes: enc.bytes, budget: adapter.budget, usage, stats: merge ? merge.stats : null, incompleteCount: 0, deviceId: device };

      if (remote.meta && remote.meta.dataHash === enc.meta.dataHash) {
        await setBase(baseFromPayload(payload));
        return setState({ ...common, status: enc.bytes > adapter.budget * WARN_RATIO ? 'ok-near-quota' : 'ok', message: '' });
      }
      if (enc.bytes > adapter.budget) {
        await setBase(partialBase(base, data, remote.payload));
        return setState({ ...common, status: 'over-quota', message: 'Sync data ' + enc.bytes + ' B > budget ' + adapter.budget + ' B. Local data is kept; this device is not uploading.' });
      }
      st = await getState();
      const lim = limiterCheck(st);
      if (!lim.ok && !force) {
        await setBase(partialBase(base, data, remote.payload));
        return setState({ ...common, status: 'pending', message: 'write deferred (rate limit)', retryAt: lim.retryAt, writes: lim.writes });
      }
      try {
        await adapter.write(enc);
      } catch (e) {
        await setBase(partialBase(base, data, remote.payload));
        return fail(await setState(common), e);
      }
      await setBase(baseFromPayload(payload));
      return setState({ ...common, status: enc.bytes > adapter.budget * WARN_RATIO ? 'ok-near-quota' : 'ok', message: '', lastPushAt: new Date(now()).toISOString(), writes: lim.writes.concat([now()]), backoffMs: 0, backoffUntil: 0 });
    }

    async function fail(st, e) {
      if (isRateOrQuotaError(e)) {
        const ms = Math.min(BACKOFF.maxMs, Math.max(BACKOFF.firstMs, (st.backoffMs || 0) * 2));
        return setState({ status: 'backoff', message: String(e.message), backoffMs: ms, backoffUntil: now() + ms });
      }
      return setState({ status: 'error', message: String(e && e.message) });
    }

    function syncNow(options) {
      const p = (running || Promise.resolve()).then(() => run(options), () => run(options));
      running = p.catch(() => {});
      return p;
    }

    async function resetRemote() {
      const remote = await adapter.read().catch(() => null);
      if (remote && remote.status === 'ok' && remote.payload) {
        const asData = S.migrate({ schemaVersion: S.SCHEMA_VERSION, prompts: remote.payload.prompts, folders: remote.payload.folders, tombstones: remote.payload.tombstones }).data;
        await store.createBackupOf(asData, 'cloud-copy-before-reset');
      }
      const data = await store.load();
      const payload = buildPayload(data);
      const enc = await encodePayload(payload, { deviceId: await store.getDeviceId(), writtenAt: new Date(now()).toISOString() });
      if (enc.bytes > adapter.budget) return setState({ status: 'over-quota', bytes: enc.bytes, budget: adapter.budget });
      await adapter.write(enc);
      await setBase(baseFromPayload(payload));
      return setState({ status: 'ok', message: 'cloud copy replaced', lastPushAt: new Date(now()).toISOString(), lastSyncAt: new Date(now()).toISOString(), bytes: enc.bytes, budget: adapter.budget, incompleteCount: 0 });
    }

    return { syncNow, resetRemote, getState, getBase };
  }

  return {
    CHROME_SYNC_QUOTA, CHUNK_CHARS, PAYLOAD_BUDGET, WARN_RATIO, META_KEY, LIMITER, BACKOFF, STATE_KEY, BASE_KEY,
    stableStringify, sha256, compress, decompress, encodePayload, decodeItems, itemBytes,
    buildPayload, baseFromPayload, mergeSync, merge3, reconcilePacks, createChromeSyncAdapter, createSyncEngine, isRateOrQuotaError,
  };
});
