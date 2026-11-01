const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../../prompt-manager/lib/diff.js');
const { createStore, memoryArea, trimHistory, HISTORY_KEY } = require('../../prompt-manager/lib/store.js');

let t = Date.parse('2026-01-01T00:00:00Z');
const clock = () => t;
const mk = () => { const area = memoryArea(); return { area, store: createStore(area, { now: clock, deviceId: 'dev-T' }) }; };

test('every content edit saves the previous version; identical saves do not', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'one' });
  await store.upsertPrompt({ id: p.id, title: 'A', body: 'two' });
  await store.upsertPrompt({ id: p.id, title: 'A', body: 'two' });
  await store.upsertPrompt({ id: p.id, title: 'A2', body: 'three', tags: ['x'] });
  const h = await store.listHistory(p.id);
  assert.deepEqual(h.map((e) => [e.v, e.body, e.reason]), [[1, 'one', 'edit'], [2, 'two', 'edit']]);
  const cur = (await store.load()).prompts[0];
  assert.equal(cur.rev, 3);
  assert.equal(cur.deviceId, 'dev-T');
});

test('restore creates a new version and never destroys history', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'v1' });
  await store.upsertPrompt({ id: p.id, title: 'A', body: 'v2' });
  await store.upsertPrompt({ id: p.id, title: 'A', body: 'v3' });
  await store.restoreVersion(p.id, 1);
  const cur = (await store.load()).prompts[0];
  assert.equal(cur.body, 'v1');
  const h = await store.listHistory(p.id);
  assert.deepEqual(h.map((e) => e.body), ['v1', 'v2', 'v3']);
  assert.match(h[2].reason, /before-restore-v1/);
  await store.restoreVersion(p.id, 3);
  assert.equal((await store.load()).prompts[0].body, 'v3');
  assert.equal((await store.listHistory(p.id)).length, 4);
  await assert.rejects(store.restoreVersion(p.id, 99), /not found/);
});

test('deleted prompts keep their history and can be restored from it', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'Gone', body: 'precious' });
  await store.deletePrompt(p.id);
  const h = await store.listHistory(p.id);
  assert.equal(h.at(-1).reason, 'deleted');
  await store.restoreVersion(p.id, h.at(-1).v);
  const d = await store.load();
  assert.equal(d.prompts[0].body, 'precious');
  assert.equal(d.tombstones.length, 0, 'restore removes the tombstone');
});

test('retention: max versions per prompt (configurable) and max age, newest always kept', async () => {
  const { store, area } = mk();
  await store.setSettings({ historyMaxVersions: 5, historyMaxDays: 0 });
  const p = await store.upsertPrompt({ title: 'A', body: '0' });
  for (let i = 1; i <= 12; i += 1) await store.upsertPrompt({ id: p.id, title: 'A', body: String(i) });
  let h = await store.listHistory(p.id);
  assert.deepEqual(h.map((e) => e.body), ['7', '8', '9', '10', '11']);
  assert.deepEqual(h.map((e) => e.v), [8, 9, 10, 11, 12], 'version numbers keep counting');
  await store.setSettings({ historyMaxDays: 30 });
  t += 40 * 864e5;
  const removed = await store.applyHistoryPolicy();
  assert.equal(removed, 4);
  h = (await area.get([HISTORY_KEY]))[HISTORY_KEY][p.id];
  assert.equal(h.length, 1, 'newest kept even if old');
  const list = [{ v: 1, at: '2020-01-01T00:00:00Z' }, { v: 2, at: '2026-01-01T00:00:00Z' }];
  assert.equal(trimHistory(list, { historyMaxVersions: 0, historyMaxDays: 0 }, Date.now()).length, 1, 'min 1 version');
  assert.equal(trimHistory(list, { historyMaxVersions: 9999, historyMaxDays: 0 }, Date.now()).length, 2);
});

test('folder rename/delete are versioned edits (no silent loss of folder info)', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'x', folder: 'Old' });
  await store.renameFolder('Old', 'New');
  await store.deleteFolder('New');
  const h = await store.listHistory(p.id);
  assert.deepEqual(h.map((e) => [e.folder, e.reason]), [['Old', 'folder-rename'], ['New', 'folder-delete']]);
});

test('diff: lines and words, lossless reconstruction', () => {
  const a = 'Write a blog post\nabout cats\nin a friendly tone';
  const b = 'Write a short blog post\nabout cats\nin a formal tone\nwith a summary';
  const lines = D.diffLines(a, b);
  assert.equal(D.applySide(lines, 'a', '\n'), a);
  assert.equal(D.applySide(lines, 'b', '\n'), b);
  const rich = D.diffRich(a, b);
  assert.deepEqual(rich.map((x) => x.op), ['mod', 'eq', 'mod', 'add']);
  const w = rich[2].words;
  assert.deepEqual(w.filter((x) => x.op !== 'eq').map((x) => x.op + ':' + x.text), ['del:friendly', 'add:formal']);
  const words = D.diffWords('çay ve şeker', 'çay ve bal');
  assert.equal(D.applySide(words, 'a', ''), 'çay ve şeker');
  assert.equal(D.applySide(words, 'b', ''), 'çay ve bal');
  assert.deepEqual(D.diffStats(a, b), { added: 3, removed: 2, same: 1 });
});

test('diff: identical, empty, and very large inputs (coarse fallback, still lossless)', () => {
  assert.deepEqual(D.diffLines('same', 'same'), [{ op: 'eq', text: 'same' }]);
  assert.deepEqual(D.diffLines('', 'x').map((x) => x.op), ['del', 'add']);
  const big1 = Array.from({ length: 3000 }, (_, i) => 'line ' + i).join('\n');
  const big2 = Array.from({ length: 3000 }, (_, i) => (i % 2 ? 'LINE ' : 'line ') + i).join('\n');
  const t0 = Date.now();
  const ops = D.diffLines(big1, big2);
  assert.ok(Date.now() - t0 < 3000, 'fast enough');
  assert.equal(D.applySide(ops, 'a', '\n'), big1);
  assert.equal(D.applySide(ops, 'b', '\n'), big2);
});
