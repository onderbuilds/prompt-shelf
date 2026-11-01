const test = require('node:test');
const assert = require('node:assert/strict');
const IO = require('../../prompt-manager/lib/io.js');
const { createStore, memoryArea } = require('../../prompt-manager/lib/store.js');

const mk = () => createStore(memoryArea());

test('export -> import (replace) round-trip keeps everything', async () => {
  const a = mk();
  await a.upsertPrompt({ title: 'One', body: 'Hello {{name|you}}\nline2', folder: 'F', tags: ['t1', 't2'] });
  await a.upsertPrompt({ title: 'İki', body: 'ğüşiöç 🚀', folder: '', tags: [] });
  await a.addFolder('Empty folder');
  const json = await a.exportJSON();
  const parsed = JSON.parse(json);
  assert.equal(parsed.app, IO.APP_ID);
  assert.equal(parsed.schemaVersion, 2);
  const b = mk();
  await b.importJSON(json, 'replace');
  const da = await a.load(); const db = await b.load();
  assert.deepEqual(db.prompts, da.prompts);
  assert.deepEqual(db.folders, da.folders);
});

test('parseImport rejects bad input without throwing', () => {
  assert.match(IO.parseImport('not json').error, /not valid JSON/);
  assert.match(IO.parseImport('{"foo":1}').error, /expected/);
  assert.match(IO.parseImport('[]').error, /no prompts/);
  assert.match(IO.parseImport('[{"title":""}]').error, /no valid prompts/);
  assert.match(IO.parseImport(JSON.stringify({ schemaVersion: 5, prompts: [] })).error, /schema v5/);
  assert.match(IO.parseImport('x'.repeat(IO.MAX_IMPORT_BYTES + 1)).error, /5 MB/);
  assert.equal(IO.parseImport(null).ok, false);
});

test('parseImport accepts bare arrays + BOM, reports invalid rows', () => {
  const r = IO.parseImport('\uFEFF' + JSON.stringify([{ title: 'ok', body: 'b' }, { title: 'x' }, 'str', { title: 'y', body: 'z', createdAt: 'nope' }]));
  assert.equal(r.ok, true);
  assert.equal(r.prompts.length, 1);
  assert.deepEqual(r.invalid.map((x) => x.index), [1, 2, 3]);
});

test('duplicate ids inside one file get new ids', () => {
  const r = IO.parseImport(JSON.stringify([{ id: 'same', title: 'a', body: '1' }, { id: 'same', title: 'b', body: '2' }]));
  assert.equal(r.prompts.length, 2);
  assert.notEqual(r.prompts[0].id, r.prompts[1].id);
});

test('merge: adds new, skips identical, keeps both on conflict (no data loss)', async () => {
  const s = mk();
  const p1 = await s.upsertPrompt({ title: 'Mine', body: 'original' });
  const p2 = await s.upsertPrompt({ title: 'Same', body: 'same', tags: ['b', 'a'] });
  const file = JSON.stringify({ schemaVersion: 1, prompts: [
    { ...p1, body: 'edited elsewhere' },
    { ...p2, tags: ['a', 'b'] },
    { title: 'Brand new', body: 'n' },
  ] });
  const r = await s.importJSON(file, 'merge');
  assert.deepEqual(r.stats, { added: 1, skipped: 1, conflicts: 1 });
  assert.equal(r.backupId, undefined);
  const d = await s.load();
  assert.equal(d.prompts.length, 4);
  assert.equal(d.prompts.find((p) => p.id === p1.id).body, 'original');
  assert.ok(d.prompts.some((p) => p.body === 'edited elsewhere' && p.id !== p1.id));

  const r2 = await s.importJSON(await s.exportJSON(), 'merge');
  assert.equal(r2.stats.added + r2.stats.conflicts, 0);
});

test('replace makes an automatic backup first and it restores', async () => {
  const s = mk();
  await s.upsertPrompt({ title: 'Precious', body: 'do not lose' });
  const r = await s.importJSON(JSON.stringify([{ title: 'Other', body: 'x' }]), 'replace');
  assert.ok(r.backupId);
  assert.equal(r.stats.removed, 1);
  let d = await s.load();
  assert.deepEqual(d.prompts.map((p) => p.title), ['Other']);
  const backups = await s.listBackups();
  assert.equal(backups[0].reason, 'before-replace');
  await s.restoreBackup(r.backupId);
  d = await s.load();
  assert.deepEqual(d.prompts.map((p) => p.title), ['Precious']);
});

test('failed import changes nothing', async () => {
  const s = mk();
  await s.upsertPrompt({ title: 'A', body: 'x' });
  await assert.rejects(s.importJSON('{broken', 'replace'), /not valid JSON/);
  assert.equal((await s.load()).prompts.length, 1);
  assert.equal((await s.listBackups()).length, 0);
});

test('import of v0 export from other tools (name/text fields)', async () => {
  const s = mk();
  const r = await s.importJSON(JSON.stringify({ prompts: [{ name: 'Legacy', text: 'body', folder: 'Old' }] }), 'merge');
  assert.equal(r.stats.added, 1);
  const d = await s.load();
  assert.equal(d.prompts[0].title, 'Legacy');
  assert.deepEqual(d.folders, ['Old']);
});
