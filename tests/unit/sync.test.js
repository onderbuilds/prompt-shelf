const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../prompt-manager/lib/schema.js');
const Y = require('../../prompt-manager/lib/sync.js');
const P = require('../../prompt-manager/lib/packs.js');
const { createStore, memoryArea } = require('../../prompt-manager/lib/store.js');
const { createDriveAppDataAdapter } = require('../../prompt-manager/lib/sync-drive.js');
const { fakeSyncArea, QUOTAS, itemBytes } = require('./helpers/fake-sync-area.js');

function world(quotas) {
  let t = Date.parse('2026-11-01T10:00:00Z');
  const clock = () => t;
  const cloud = fakeSyncArea(clock, quotas);
  const devices = {};
  function device(name) {
    const local = memoryArea();
    const store = createStore(local, { deviceId: 'dev-' + name, now: clock });
    const engine = Y.createSyncEngine({ store, adapter: Y.createChromeSyncAdapter(cloud), localArea: local, registry: P.listPacks(), build: P.buildPackPrompts, now: clock });
    devices[name] = { name, local, store, engine };
    return devices[name];
  }
  return { cloud, device, devices, tick: (ms) => { t += ms; }, clock };
}
async function enable(d) { await d.store.setSettings({ sync: { enabled: true } }); }
const titles = async (d) => (await d.store.load()).prompts.map((p) => p.title).sort();
const live = async (d) => (await d.store.load()).prompts;
async function roundTrip(w, ...ds) { for (const d of ds) { w.tick(11000); await d.engine.syncNow(); } }

test('codec: compress+chunk round trip, every item within Chrome per-item quota', async () => {
  const big = { prompts: Array.from({ length: 120 }, (_, i) => ({ id: 'p' + i, title: 'Prompt ' + i, body: ('lorem ipsum ' + i + ' ').repeat(40) + Array.from({ length: 60 }, () => Math.random().toString(36).slice(2)).join(' ') })), tombstones: [], packs: {}, folders: [] };
  const enc = await Y.encodePayload(big, { gen: 'g1' });
  assert.ok(enc.chunks > 1, 'expected multiple chunks');
  for (const [k, v] of Object.entries(enc.items)) assert.ok(itemBytes(k, v) <= QUOTAS.perItem, k + ' too big');
  const dec = await Y.decodeItems(enc.items);
  assert.equal(dec.status, 'ok');
  assert.deepEqual(dec.payload, JSON.parse(Y.stableStringify(big)));
  assert.ok(enc.meta.rawBytes > enc.bytes * 1.5, 'compression should help (raw ' + enc.meta.rawBytes + ' vs ' + enc.bytes + ')');
});

test('codec: missing chunk = incomplete, tampered chunk = incomplete, unknown format = corrupt', async () => {
  const enc = await Y.encodePayload({ prompts: [{ id: 'a', body: 'x'.repeat(20000) + Math.random() }], tombstones: [], packs: {}, folders: [] }, { gen: 'g' });
  const items = { ...enc.items };
  const chunkKey = Object.keys(items).find((k) => k !== Y.META_KEY);
  delete items[chunkKey];
  assert.equal((await Y.decodeItems(items)).status, 'incomplete');
  assert.equal((await Y.decodeItems({ ...enc.items, [chunkKey]: 'AAAA' })).status, 'incomplete');
  assert.equal((await Y.decodeItems({ [Y.META_KEY]: { ...enc.meta, fmt: 99 } })).status, 'corrupt');
  assert.equal((await Y.decodeItems({})).status, 'empty');
});

test('two devices: create on A appears on B; sync is idempotent (no extra writes)', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  await A.store.upsertPrompt({ title: 'From A', body: 'hello', folder: 'F', tags: ['x'] });
  await roundTrip(w, A, B);
  assert.deepEqual(await titles(B), ['From A']);
  const opsBefore = w.cloud.ops.length;
  await roundTrip(w, A, B, A, B);
  assert.equal(w.cloud.ops.length, opsBefore, 'no writes when nothing changed');
  assert.equal((await A.engine.getState()).status, 'ok');
});

test('concurrent edits of DIFFERENT fields merge without conflict', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  const p = await A.store.upsertPrompt({ title: 'T', body: 'body v1', folder: '', tags: [] });
  await roundTrip(w, A, B);
  await A.store.upsertPrompt({ id: p.id, title: 'T (renamed on A)', body: 'body v1' });
  await B.store.upsertPrompt({ id: p.id, title: 'T', body: 'body v2 from B' });
  await roundTrip(w, A, B, A);
  for (const d of [A, B]) {
    const ps = await live(d);
    assert.equal(ps.length, 1, d.name + ' has ' + ps.length);
    assert.equal(ps[0].title, 'T (renamed on A)');
    assert.equal(ps[0].body, 'body v2 from B');
  }
});

test('concurrent edits of the SAME field -> conflicted copy, both devices converge, nothing lost', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  const p = await A.store.upsertPrompt({ title: 'Shared', body: 'original' });
  await roundTrip(w, A, B);
  await A.store.upsertPrompt({ id: p.id, title: 'Shared', body: 'A wrote this' });
  w.tick(1000);
  await B.store.upsertPrompt({ id: p.id, title: 'Shared', body: 'B wrote this' });
  await roundTrip(w, A, B, A, B);
  const a = await live(A); const b = await live(B);
  const key = (ps) => ps.map((x) => x.id + '|' + x.body + '|' + (x.conflictOf || '')).sort();
  assert.deepEqual(key(a), key(b), 'devices diverged');
  assert.equal(a.length, 2);
  assert.deepEqual(a.map((x) => x.body).sort(), ['A wrote this', 'B wrote this']);
  const main = a.find((x) => x.id === p.id); const copy = a.find((x) => x.conflictOf === p.id);
  assert.equal(main.body, 'B wrote this', 'newer edit keeps the original id');
  assert.equal(copy.body, 'A wrote this');

  assert.ok((await A.store.listHistory(p.id)).some((h) => h.body === 'A wrote this' && h.reason === 'sync'));

  await A.store.resolveConflict(copy.id, 'copy');
  await roundTrip(w, A, B);
  for (const d of [A, B]) {
    const ps = await live(d);
    assert.equal(ps.length, 1);
    assert.equal(ps[0].body, 'A wrote this');
  }
  assert.ok((await B.store.listHistory(p.id)).some((h) => h.body === 'B wrote this'), 'B keeps its old text in history');
});

test('delete on A propagates to B with a backup + history on B', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  const p = await A.store.upsertPrompt({ title: 'To delete', body: 'bye' });
  await A.store.upsertPrompt({ title: 'Keep', body: 'stay' });
  await roundTrip(w, A, B);
  await A.store.deletePrompt(p.id);
  await roundTrip(w, A, B);
  assert.deepEqual(await titles(B), ['Keep']);
  const backups = await B.store.listBackups();
  assert.equal(backups[0].reason, 'before-sync-delete');
  assert.ok(backups[0].data.prompts.some((x) => x.id === p.id));
  assert.equal((await B.store.listHistory(p.id)).at(-1).reason, 'sync-deleted');
});

test('delete on A while B edits the same prompt -> edit wins (resurrected), no loss', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  const p = await A.store.upsertPrompt({ title: 'Contested', body: 'v1' });
  await roundTrip(w, A, B);
  await A.store.deletePrompt(p.id);
  await B.store.upsertPrompt({ id: p.id, title: 'Contested', body: 'v2 edited on B' });
  await roundTrip(w, A, B, A, B);
  for (const d of [A, B]) {
    const ps = await live(d);
    assert.equal(ps.length, 1, d.name);
    assert.equal(ps[0].body, 'v2 edited on B');
  }
  assert.equal((await A.store.load()).tombstones.length, 0);
});

test('absence never deletes: a remote payload without a local prompt (and no tombstone) keeps it', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  await B.store.upsertPrompt({ title: 'Only on B', body: 'b' });
  await A.store.upsertPrompt({ title: 'Only on A', body: 'a' });
  await roundTrip(w, A, B, A);
  assert.deepEqual(await titles(A), ['Only on A', 'Only on B']);
  assert.deepEqual(await titles(B), ['Only on A', 'Only on B']);
});

test('quota overflow: no upload, local stays intact, warning state; recovers when data shrinks', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);

  const rnd = (n) => Array.from({ length: n }, () => Math.random().toString(36).slice(2)).join(' ');
  const ids = [];
  for (let i = 0; i < 12; i += 1) ids.push((await A.store.upsertPrompt({ title: 'Big ' + i, body: rnd(1200) })).id);
  w.tick(11000);
  const st = await A.engine.syncNow();
  assert.equal(st.status, 'over-quota');
  assert.ok(st.bytes > Y.PAYLOAD_BUDGET);
  assert.equal(w.cloud.raw.size, 0, 'nothing written to the cloud');
  assert.equal((await live(A)).length, 12, 'local untouched');

  await B.store.upsertPrompt({ title: 'Small from B', body: 'b' });
  await roundTrip(w, B, A);
  assert.ok((await titles(A)).includes('Small from B'));
  for (const id of ids.slice(2)) await A.store.deletePrompt(id);
  await roundTrip(w, A, B);
  assert.equal((await A.engine.getState()).status, 'ok');
  assert.deepEqual(await titles(B), ['Big 0', 'Big 1', 'Small from B']);
});

test('rate limit / Chrome write-quota error -> exponential backoff, then success', async () => {
  const w = world(); const A = w.device('A');
  await enable(A);
  await A.store.upsertPrompt({ title: 'x', body: 'y' });
  w.cloud.failOnce(new Error('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded'));
  let st = await A.engine.syncNow();
  assert.equal(st.status, 'backoff');
  assert.equal(st.backoffMs, Y.BACKOFF.firstMs);
  w.tick(1000);
  st = await A.engine.syncNow();
  assert.equal(st.status, 'backoff', 'still waiting');
  w.cloud.failOnce(new Error('MAX_WRITE_OPERATIONS_PER_HOUR quota exceeded'));
  w.tick(Y.BACKOFF.firstMs);
  st = await A.engine.syncNow();
  assert.equal(st.backoffMs, Y.BACKOFF.firstMs * 2, 'doubles');
  w.tick(st.backoffMs + 1);
  st = await A.engine.syncNow();
  assert.equal(st.status, 'ok');
  assert.equal(st.backoffMs, 0);
});

test('self-imposed limiter defers rapid writes (never hits Chrome per-minute limit)', async () => {
  const w = world(); const A = w.device('A');
  await enable(A);
  for (let i = 0; i < 30; i += 1) {
    await A.store.upsertPrompt({ title: 'p' + i, body: String(i) });
    w.tick(1000);
    await A.engine.syncNow();
  }
  const t = w.clock();
  const lastMinute = w.cloud.ops.filter((x) => t - x < 60000).length;
  assert.ok(lastMinute <= 2 * Math.ceil(60000 / Y.LIMITER.minIntervalMs), 'ops in last minute: ' + lastMinute);
  assert.ok(lastMinute < QUOTAS.perMinute);
  w.tick(Y.LIMITER.minIntervalMs);
  assert.equal((await A.engine.syncNow()).status, 'ok');
});

test('incomplete remote (partial propagation) -> wait, do not overwrite; corrupt after 3 tries; reset backs up cloud copy', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  await B.store.upsertPrompt({ title: 'B data', body: 'important' });
  await roundTrip(w, B);
  const chunk = [...w.cloud.raw.keys()].find((k) => k !== Y.META_KEY);
  const saved = w.cloud.raw.get(chunk);
  w.cloud.raw.delete(chunk);
  await A.store.upsertPrompt({ title: 'A data', body: 'a' });
  w.tick(11000);
  assert.equal((await A.engine.syncNow()).status, 'waiting-remote');
  assert.ok(!w.cloud.raw.has(chunk));
  w.tick(11000); await A.engine.syncNow(); w.tick(11000);
  assert.equal((await A.engine.syncNow()).status, 'remote-corrupt');
  w.cloud.raw.set(chunk, saved);
  w.tick(11000);
  assert.equal((await A.engine.syncNow()).status, 'ok');
  assert.deepEqual(await titles(A), ['A data', 'B data']);
  const st = await A.engine.resetRemote();
  assert.equal(st.status, 'ok');
  assert.equal((await A.store.listBackups())[0].reason, 'cloud-copy-before-reset');
});

test('packs: unedited pack prompts are not uploaded, install state syncs, edited pack prompt syncs, uninstall propagates', async () => {
  const w = world(); const A = w.device('A'); const B = w.device('B');
  await enable(A); await enable(B);
  await A.store.installPack(P.getPack('code'), 'en', P.buildPackPrompts);
  await roundTrip(w, A);
  const remote = await Y.decodeItems(await w.cloud.get(null));
  assert.equal(remote.payload.prompts.length, 0, 'pristine pack prompts not in payload');
  assert.equal(remote.payload.packs.code.installed, true);
  await roundTrip(w, B);
  assert.equal((await live(B)).filter((p) => p.packId === 'code').length, P.getPack('code').templates.length);
  const edited = (await live(B)).find((p) => p.id === 'pack.code.review');
  await B.store.upsertPrompt({ ...edited, body: edited.body + '\nAlso check logging.' });
  await roundTrip(w, B, A);
  assert.ok((await live(A)).find((p) => p.id === 'pack.code.review').body.endsWith('Also check logging.'));
  await A.store.uninstallPack('code');
  await roundTrip(w, A, B);
  const left = (await live(B)).filter((p) => p.id.startsWith('pack.code.'));
  assert.deepEqual(left.map((p) => p.id), ['pack.code.review'], 'only the edited prompt remains');
  assert.equal(left[0].packId, null);
});

test('sync never runs when disabled (default) and Drive adapter is a no-network stub', async () => {
  const w = world(); const A = w.device('A');
  await A.store.upsertPrompt({ title: 'x', body: 'y' });
  assert.equal((await A.engine.syncNow()).status, 'disabled');
  assert.equal(w.cloud.ops.length, 0);
  const d = createDriveAppDataAdapter();
  assert.equal(await d.available(), false);
  await assert.rejects(d.read(), /not configured/);
  await assert.rejects(d.write({}), /not configured/);
  const local = memoryArea(); const store = createStore(local);
  await store.setSettings({ sync: { enabled: true, adapter: 'google-drive' } });
  const eng = Y.createSyncEngine({ store, adapter: d, localArea: local, registry: [], build: () => [], now: Date.now });
  assert.equal((await eng.syncNow()).status, 'unavailable');
});

test('merge3 is symmetric: both devices pick the same winner and copy id', () => {
  const base = { title: 't', body: 'b', folder: '', tags: [] };
  const l = S.normalizePrompt({ id: 'x', title: 't', body: 'L', updatedAt: '2026-01-02T00:00:00Z', deviceId: 'dev-A', rev: 2 });
  const r = S.normalizePrompt({ id: 'x', title: 't', body: 'R', updatedAt: '2026-01-02T00:00:00Z', deviceId: 'dev-B', rev: 2 });
  const m1 = Y.merge3(l, r, base); const m2 = Y.merge3(r, l, base);
  assert.equal(m1.main.body, m2.main.body);
  assert.equal(m1.copy.id, m2.copy.id);
  assert.equal(m1.copy.conflictOf, 'x');

  assert.ok(Y.merge3(l, r, null).copy);
});
