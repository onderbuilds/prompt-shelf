(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const deps = isNode
    ? Object.assign({}, require('./schema.js'), require('./io.js'), require('./search.js'))
    : root.PM;
  const mod = factory(deps);
  if (isNode) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  const DATA_KEY = 'pm_data';
  const BACKUP_KEY = 'pm_backups';
  const HISTORY_KEY = 'pm_history';
  const DEVICE_KEY = 'pm_device';
  const MAX_BACKUPS = 10;
  const HISTORY_LIMITS = Object.freeze({ minVersions: 1, maxVersions: 500 });

  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  const snap = (p) => ({ title: p.title, body: p.body, folder: p.folder || '', tags: (p.tags || []).slice() });

  function trimHistory(list, settings, now) {
    const raw = Number(settings.historyMaxVersions);
    const maxV = Math.min(HISTORY_LIMITS.maxVersions, Math.max(HISTORY_LIMITS.minVersions, Number.isFinite(raw) ? Math.floor(raw) : 50));
    const days = Math.max(0, Number(settings.historyMaxDays) || 0);
    let out = list.slice(-maxV);
    if (days > 0 && out.length > 1) {
      const cutoff = now - days * 864e5;
      const newest = out[out.length - 1];
      out = out.filter((e) => e === newest || Date.parse(e.at) >= cutoff);
    }
    return out;
  }

  function createStore(area, opts) {
    const o = opts || {};
    const clock = o.now || (() => Date.now());
    const iso = () => new Date(clock()).toISOString();
    let queue = Promise.resolve();
    let deviceIdCache = o.deviceId || null;

    const LOCK = 'pm_store_' + (o.lockName || 'default');
    const locks = (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') ? navigator.locks : null;
    const withLock = (fn) => (locks ? locks.request(LOCK, () => fn()) : fn());
    const serial = (fn) => { const run = queue.then(() => withLock(fn), () => withLock(fn)); queue = run.catch(() => {}); return run; };

    async function getDeviceId() {
      if (deviceIdCache) return deviceIdCache;
      const r = await area.get([DEVICE_KEY]);
      if (r && typeof r[DEVICE_KEY] === 'string') { deviceIdCache = r[DEVICE_KEY]; return deviceIdCache; }
      deviceIdCache = 'dev-' + D.uid().replace(/-/g, '').slice(0, 12);
      await area.set({ [DEVICE_KEY]: deviceIdCache });
      return deviceIdCache;
    }

    async function readRaw() { const r = await area.get([DATA_KEY]); return r ? r[DATA_KEY] : undefined; }

    async function load() {
      const raw = await readRaw();
      const { data, migrated, invalid } = D.migrate(raw);
      if (raw !== undefined && (migrated || invalid.length)) {

        await pushBackup(raw, migrated ? 'before-migration' : 'invalid-records');
        await area.set({ [DATA_KEY]: data });
      }
      return data;
    }

    async function readHistory() {
      const r = await area.get([HISTORY_KEY]);
      const h = r && r[HISTORY_KEY];
      return h && typeof h === 'object' && !Array.isArray(h) ? h : {};
    }

    async function listBackups() {
      const r = await area.get([BACKUP_KEY]);
      return (r && Array.isArray(r[BACKUP_KEY])) ? r[BACKUP_KEY] : [];
    }

    async function pushBackup(data, reason) {
      const list = await listBackups();
      const entry = { id: D.uid(), createdAt: iso(), reason: reason || 'manual', data: clone(data) };
      const next = [entry].concat(list).slice(0, MAX_BACKUPS);
      await area.set({ [BACKUP_KEY]: next });
      return entry;
    }

    function mutate(fn) {
      return serial(async () => {
        for (let attempt = 0; ; attempt += 1) {
          const data = await load();
          const before = JSON.stringify((await area.get([DATA_KEY]))[DATA_KEY]);
          const device = await getDeviceId();
          const pending = [];
          const tx = {
            device,
            now: iso(),
            version(prev, reason) { pending.push({ id: prev.id, entry: { at: iso(), reason, deviceId: prev.deviceId || device, rev: prev.rev || 1, ...snap(prev) } }); },
            tombstone(p) {
              data.tombstones = D.cleanTombstones((data.tombstones || []).filter((t) => t.id !== p.id).concat([{ id: p.id, deletedAt: iso(), rev: p.rev || 1, deviceId: device, hash: D.contentHash(p) }]), clock());
            },
          };
          const result = await fn(data, tx);
          const write = { [DATA_KEY]: data };
          if (pending.length) {
            const hist = await readHistory();
            for (const { id, entry } of pending) {
              const list = hist[id] || [];
              const v = (list.length ? list[list.length - 1].v : 0) + 1;
              hist[id] = trimHistory(list.concat([{ v, ...entry }]), data.settings, clock());
            }
            write[HISTORY_KEY] = hist;
          }
          const now = JSON.stringify((await area.get([DATA_KEY]))[DATA_KEY]);
          if (now !== before) {
            if (attempt < 3) continue;
            throw new Error('Storage is busy (concurrent write). Nothing was changed; please retry.');
          }
          await area.set(write);
          return result === undefined ? data : result;
        }
      });
    }

    function applyEdit(data, tx, idx, patch, reason) {
      const prev = data.prompts[idx];
      const next = D.normalizePrompt({ ...prev, ...patch, id: prev.id, createdAt: prev.createdAt, updatedAt: prev.updatedAt });
      if (D.sameContent(prev, next)) { data.prompts[idx] = { ...next, updatedAt: prev.updatedAt }; return data.prompts[idx]; }
      tx.version(prev, reason || 'edit');
      next.rev = (prev.rev || 1) + 1;
      next.deviceId = tx.device;
      next.updatedAt = tx.now;
      data.prompts[idx] = next;
      return next;
    }

    function upsertPrompt(input, options) {
      const reason = (options && options.reason) || 'edit';
      return mutate((data, tx) => {
        const errs = D.validatePrompt(input);
        if (errs.length) throw new Error('Invalid prompt: ' + errs.join(', '));
        const idx = input.id ? data.prompts.findIndex((p) => p.id === input.id) : -1;
        if (idx >= 0) {
          const next = applyEdit(data, tx, idx, input, reason);
          data.folders = D.collectFolders(data.prompts, data.folders);
          return next;
        }
        if (data.prompts.length >= D.LIMITS.prompts) throw new Error('Prompt limit reached');
        const created = D.normalizePrompt({ ...input, id: undefined, rev: 1, createdAt: tx.now, updatedAt: tx.now, deviceId: tx.device, packId: null, packTplId: null, packHash: null, conflictOf: null });
        data.prompts.push(created);
        data.folders = D.collectFolders(data.prompts, data.folders);
        return created;
      });
    }

    function deletePrompt(id) {
      return mutate((data, tx) => {
        const p = data.prompts.find((x) => x.id === id);
        if (!p) return false;
        tx.version(p, 'deleted');
        tx.tombstone(p);
        data.prompts = data.prompts.filter((x) => x.id !== id);
        return true;
      });
    }

    function addFolder(name) {
      return mutate((data) => {
        const f = D.cleanFolder(name);
        if (!f) throw new Error('Folder name required');
        data.folders = D.collectFolders(data.prompts, data.folders.concat([f]));
        return f;
      });
    }

    function renameFolder(from, to) {
      return mutate((data, tx) => {
        const t = D.cleanFolder(to);
        if (!t) throw new Error('Folder name required');
        data.prompts.forEach((p, i) => { if (p.folder === from) applyEdit(data, tx, i, { folder: t }, 'folder-rename'); });
        data.folders = D.collectFolders(data.prompts, data.folders.filter((f) => f !== from).concat([t]));
        return t;
      });
    }

    function deleteFolder(name) {
      return mutate((data, tx) => {
        let moved = 0;
        data.prompts.forEach((p, i) => { if (p.folder === name) { applyEdit(data, tx, i, { folder: '' }, 'folder-delete'); moved += 1; } });
        data.folders = D.collectFolders(data.prompts, data.folders.filter((f) => f !== name));
        return moved;
      });
    }

    function setSettings(patch) {
      return mutate((data) => {
        const next = { ...data.settings, ...patch };
        if (patch && patch.sync) next.sync = { ...data.settings.sync, ...patch.sync };
        data.settings = next;
        return data.settings;
      });
    }

    async function exportJSON() { return D.exportJSON(await load()); }
    function markExported() { return setSettings({ lastExportAt: iso() }); }

    function tombstoneRemoved(prev, next, tx) {
      const keep = new Set(next.prompts.map((p) => p.id));
      for (const p of prev.prompts) if (!keep.has(p.id)) { tx.version(p, 'deleted'); tx.tombstone(p); }
    }

    function importJSON(text, mode) {
      const parsed = D.parseImport(text);
      if (!parsed.ok) { const e = new Error(parsed.error); e.invalid = parsed.invalid; return Promise.reject(e); }
      return mutate(async (data, tx) => {
        let res;
        let backupId;
        if (mode === 'replace') {
          backupId = (await pushBackup(data, 'before-replace')).id;
          res = D.replaceImport(data, parsed);
          tombstoneRemoved(data, res.data, tx);
        } else {
          res = D.mergeImport(data, parsed);
        }
        const live = new Set(res.data.prompts.map((p) => p.id));
        Object.assign(data, res.data, { tombstones: (data.tombstones || []).filter((t) => !live.has(t.id)) });
        return { stats: res.stats, invalid: parsed.invalid, backupId };
      });
    }

    function createBackupOf(data, reason) { return serial(async () => pushBackup(data, reason)); }

    function createBackup(reason) {
      return serial(async () => pushBackup(await load(), reason || 'manual'));
    }

    function restoreBackup(id) {
      return mutate(async (data, tx) => {
        const list = await listBackups();
        const b = list.find((x) => x.id === id);
        if (!b) throw new Error('Backup not found');
        await pushBackup(data, 'before-restore');
        const restored = D.migrate(b.data).data;
        tombstoneRemoved(data, restored, tx);
        const live = new Set(restored.prompts.map((p) => p.id));
        const tombs = (data.tombstones || []).filter((t) => !live.has(t.id));
        Object.assign(data, restored, { tombstones: tombs, settings: data.settings, packs: data.packs });
        return data;
      });
    }

    async function listHistory(id) { return (await readHistory())[id] || []; }

    function restoreVersion(id, v) {
      return mutate(async (data, tx) => {
        const list = (await readHistory())[id] || [];
        const entry = list.find((e) => e.v === v);
        if (!entry) throw new Error('Version not found');
        const idx = data.prompts.findIndex((p) => p.id === id);
        if (idx < 0) {

          const revived = D.normalizePrompt({ id, ...snap(entry), rev: (entry.rev || 1) + 1, deviceId: tx.device, createdAt: tx.now, updatedAt: tx.now });
          data.prompts.push(revived);
          data.tombstones = (data.tombstones || []).filter((t) => t.id !== id);
          data.folders = D.collectFolders(data.prompts, data.folders);
          return revived;
        }
        const next = applyEdit(data, tx, idx, snap(entry), 'before-restore-v' + v);
        data.folders = D.collectFolders(data.prompts, data.folders);
        return next;
      });
    }

    function applyHistoryPolicy() {
      return serial(async () => {
        const data = await load();
        const hist = await readHistory();
        let removed = 0;
        for (const id of Object.keys(hist)) {
          const t = trimHistory(hist[id], data.settings, clock());
          removed += hist[id].length - t.length;
          if (t.length) hist[id] = t; else delete hist[id];
        }
        await area.set({ [HISTORY_KEY]: hist });
        return removed;
      });
    }

    function listConflicts(data) {
      return data.prompts.filter((p) => p.conflictOf).map((copy) => ({ copy, main: data.prompts.find((p) => p.id === copy.conflictOf) || null }));
    }

    function resolveConflict(copyId, choice) {
      return mutate((data, tx) => {
        const ci = data.prompts.findIndex((p) => p.id === copyId);
        if (ci < 0) throw new Error('Conflict not found');
        const copy = data.prompts[ci];
        const mi = data.prompts.findIndex((p) => p.id === copy.conflictOf);
        if (choice === 'both' || mi < 0) {
          data.prompts[ci] = { ...copy, conflictOf: null, rev: (copy.rev || 1) + 1, updatedAt: tx.now, deviceId: tx.device };
          return data.prompts[ci];
        }
        if (choice === 'copy') applyEdit(data, tx, mi, snap(copy), 'conflict-resolved');
        else if (choice !== 'main') throw new Error('bad choice');
        tx.version(copy, 'conflict-discarded');
        tx.tombstone(copy);
        data.prompts = data.prompts.filter((p) => p.id !== copyId);
        return data.prompts.find((p) => p.id === copy.conflictOf);
      });
    }

    function installPack(pack, lang, build) {
      return mutate((data, tx) => {
        const prompts = build(pack, lang, tx.now, tx.device);
        const have = new Set(data.prompts.map((p) => p.id));
        let added = 0; let skipped = 0;
        for (const p of prompts) {
          if (have.has(p.id)) { skipped += 1; continue; }
          data.prompts.push(p); added += 1;
        }
        const ids = new Set(prompts.map((p) => p.id));
        data.tombstones = (data.tombstones || []).filter((t) => !ids.has(t.id));
        data.packs = { ...(data.packs || {}), [pack.id]: { installed: true, lang, at: tx.now } };
        data.folders = D.collectFolders(data.prompts, data.folders);
        return { added, skipped };
      });
    }

    function uninstallPack(packId) {
      return mutate((data, tx) => {
        let removed = 0; let kept = 0;
        data.prompts = data.prompts.filter((p) => {
          if (p.packId !== packId) return true;
          if (D.isPristinePack(p)) { removed += 1; return false; }
          kept += 1; return true;
        });
        data.prompts = data.prompts.map((p) => (p.packId === packId ? { ...p, packId: null, packTplId: null, packHash: null } : p));
        data.packs = { ...(data.packs || {}), [packId]: { installed: false, lang: (data.packs && data.packs[packId] && data.packs[packId].lang) || 'en', at: tx.now } };
        data.folders = D.collectFolders(data.prompts, []);
        return { removed, kept };
      });
    }

    function applySync(fn) {
      return mutate(async (data, tx) => {
        const r = await fn(clone(data), tx.device);
        if (!r) return null;
        if (r.deleted && r.deleted.length) await pushBackup(data, 'before-sync-delete');
        for (const p of r.overwritten || []) tx.version(p, 'sync');
        for (const p of r.deleted || []) tx.version(p, 'sync-deleted');
        for (const k of Object.keys(data)) delete data[k];
        Object.assign(data, r.data);
        return r;
      });
    }

    async function search(opts) { const data = await load(); return D.searchPrompts(data.prompts, opts); }

    return {
      load, getDeviceId, upsertPrompt, deletePrompt, addFolder, renameFolder, deleteFolder, setSettings,
      exportJSON, markExported, importJSON, createBackup, createBackupOf, listBackups, restoreBackup, search,
      listHistory, restoreVersion, applyHistoryPolicy, listConflicts, resolveConflict,
      installPack, uninstallPack, applySync,
    };
  }

  function memoryArea(initial) {
    const m = new Map(Object.entries(initial || {}));
    return {
      async get(keys) {
        const out = {};
        const list = keys == null ? [...m.keys()] : [].concat(keys);
        for (const k of list) if (m.has(k)) out[k] = clone(m.get(k));
        return out;
      },
      async set(obj) { for (const [k, v] of Object.entries(obj)) m.set(k, clone(v)); },
      async remove(keys) { for (const k of [].concat(keys)) m.delete(k); },
      dump() { return Object.fromEntries(m); },
    };
  }

  return { DATA_KEY, BACKUP_KEY, HISTORY_KEY, DEVICE_KEY, MAX_BACKUPS, HISTORY_LIMITS, trimHistory, createStore, memoryArea };
});
