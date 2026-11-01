const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../prompt-manager/lib/schema.js');
const { createStore, memoryArea, DATA_KEY, BACKUP_KEY, MAX_BACKUPS } = require('../../prompt-manager/lib/store.js');
const { searchPrompts, listTags, fold } = require('../../prompt-manager/lib/search.js');

const mk = (init) => { const area = memoryArea(init); return { area, store: createStore(area) }; };

test('empty storage loads default data without writing', async () => {
  const { area, store } = mk();
  const d = await store.load();
  assert.equal(d.schemaVersion, S.SCHEMA_VERSION);
  assert.deepEqual(d.prompts, []);
  assert.equal(area.dump()[DATA_KEY], undefined);
});

test('create prompt fills full schema', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: '  Hello ', body: 'B', folder: ' Work ', tags: 'a, b, A, #c' });
  assert.match(p.id, /.+/);
  assert.equal(p.title, 'Hello');
  assert.equal(p.folder, 'Work');
  assert.deepEqual(p.tags, ['a', 'b', 'c']);
  assert.equal(p.version, S.PROMPT_VERSION);
  assert.ok(Date.parse(p.createdAt) && p.createdAt === p.updatedAt);
  const d = await store.load();
  assert.deepEqual(d.folders, ['Work']);
});

test('update keeps id + createdAt, bumps updatedAt', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'x' });
  await new Promise((r) => setTimeout(r, 5));
  const q = await store.upsertPrompt({ id: p.id, title: 'A2', body: 'y', createdAt: '2000-01-01T00:00:00.000Z' });
  assert.equal(q.id, p.id);
  assert.equal(q.createdAt, p.createdAt);
  assert.ok(q.updatedAt > p.updatedAt);
  assert.equal((await store.load()).prompts.length, 1);
});

test('invalid prompts are rejected and nothing is written', async () => {
  const { store } = mk();
  await assert.rejects(store.upsertPrompt({ title: '', body: 'x' }), /title missing/);
  await assert.rejects(store.upsertPrompt({ title: 'a', body: 5 }), /body/);
  await assert.rejects(store.upsertPrompt({ title: 'x'.repeat(201), body: '' }), /title longer/);
  assert.equal((await store.load()).prompts.length, 0);
});

test('concurrent writes are serialized (no lost updates)', async () => {
  const { store } = mk();
  await Promise.all(Array.from({ length: 25 }, (_, i) => store.upsertPrompt({ title: 'p' + i, body: String(i) })));
  assert.equal((await store.load()).prompts.length, 25);
});

test('delete prompt', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'x' });
  assert.equal(await store.deletePrompt(p.id), true);
  assert.equal(await store.deletePrompt('nope'), false);
  assert.equal((await store.load()).prompts.length, 0);
});

test('folders: add, rename, delete never deletes prompts', async () => {
  const { store } = mk();
  await store.addFolder('Empty');
  await store.upsertPrompt({ title: 'A', body: 'x', folder: 'Work' });
  await store.renameFolder('Work', 'Job');
  let d = await store.load();
  assert.deepEqual(d.folders, ['Empty', 'Job']);
  assert.equal(d.prompts[0].folder, 'Job');
  assert.equal(await store.deleteFolder('Job'), 1);
  d = await store.load();
  assert.equal(d.prompts.length, 1);
  assert.equal(d.prompts[0].folder, '');
  assert.deepEqual(d.folders, ['Empty']);
  await assert.rejects(store.addFolder('  '), /required/);
});

test('migration v0 (bare array, other field names) with backup of the original', async () => {
  const legacy = [{ name: 'Old', text: 'legacy body', tags: ['x'] }, { title: 'T', prompt: 'P' }, { title: '', body: 'bad' }];
  const { area, store } = mk({ [DATA_KEY]: legacy });
  const d = await store.load();
  assert.equal(d.schemaVersion, S.SCHEMA_VERSION);
  assert.deepEqual(d.prompts.map((p) => [p.title, p.body]), [['Old', 'legacy body'], ['T', 'P']]);
  const backups = area.dump()[BACKUP_KEY];
  assert.equal(backups.length, 1);
  assert.equal(backups[0].reason, 'before-migration');
  assert.deepEqual(backups[0].data, legacy);
  await store.load();
  assert.equal(area.dump()[BACKUP_KEY].length, 1, 'no second backup once migrated');
});

test('newer schema is refused (never silently dropped)', async () => {
  const { store } = mk({ [DATA_KEY]: { schemaVersion: 99, prompts: [] } });
  await assert.rejects(store.load(), /schema v99/);
});

test('backups rotate at MAX_BACKUPS and restore is reversible', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'Keep', body: 'x' });
  const b = await store.createBackup('manual');
  await store.deletePrompt(p.id);
  await store.restoreBackup(b.id);
  const d = await store.load();
  assert.equal(d.prompts[0].title, 'Keep');
  const list = await store.listBackups();
  assert.equal(list[0].reason, 'before-restore');
  assert.equal(list[0].data.prompts.length, 0);
  for (let i = 0; i < 15; i += 1) await store.createBackup('m' + i);
  assert.equal((await store.listBackups()).length, MAX_BACKUPS);
  await assert.rejects(store.restoreBackup('missing'), /not found/);
});

test('settings patch', async () => {
  const { store } = mk();
  await store.setSettings({ floatingButton: false });
  const d = await store.load();
  assert.equal(d.settings.floatingButton, false);
  assert.equal(d.settings.backupReminderDays, 7);
});

test('search: title/body/tags/folder, tokens AND, #tag, Turkish folding, ranking', () => {
  const ps = [
    { id: '1', title: 'Email follow-up', body: 'polite', folder: 'Work', tags: ['email'], updatedAt: '2026-01-01' },
    { id: '2', title: 'Code review', body: 'find bugs in email parser', folder: '', tags: ['code'], updatedAt: '2026-02-01' },
    { id: '3', title: 'İstanbul gezi planı', body: 'şehir', folder: 'Kişisel', tags: ['seyahat'], updatedAt: '2026-03-01' },
  ];
  assert.deepEqual(searchPrompts(ps, { query: 'email' }).map((p) => p.id), ['1', '2']);
  assert.deepEqual(searchPrompts(ps, { query: 'email bugs' }).map((p) => p.id), ['2']);
  assert.deepEqual(searchPrompts(ps, { query: '#code' }).map((p) => p.id), ['2']);
  assert.deepEqual(searchPrompts(ps, { query: 'istanbul sehir' }).map((p) => p.id), ['3']);
  assert.deepEqual(searchPrompts(ps, { query: 'ISTANBUL' }).map((p) => p.id), ['3']);
  assert.deepEqual(searchPrompts(ps, { folder: 'Work' }).map((p) => p.id), ['1']);
  assert.deepEqual(searchPrompts(ps, { folder: '__none__' }).map((p) => p.id), ['2']);
  assert.deepEqual(searchPrompts(ps, { tag: 'SEYAHAT' }).map((p) => p.id), ['3']);
  assert.deepEqual(searchPrompts(ps, {}).map((p) => p.id), ['3', '2', '1']);
  assert.deepEqual(searchPrompts(ps, { query: 'nothing-matches' }), []);
  assert.deepEqual(listTags(ps).map((x) => x.tag), ['code', 'email', 'seyahat']);
  assert.equal(fold('IĞDIR Çay'), 'igdir cay');
});

test('v1 -> v2 migration keeps every prompt, adds rev/tombstones/packs, backs up the v1 data', async () => {
  const v1 = { schemaVersion: 1, prompts: [{ id: 'a', title: 'Old', body: 'x', folder: 'F', tags: ['t'], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z', version: 1 }], folders: ['F'], settings: { floatingButton: false } };
  const { area, store } = mk({ [DATA_KEY]: v1 });
  const d = await store.load();
  assert.equal(d.schemaVersion, 2);
  assert.equal(d.prompts[0].rev, 1);
  assert.equal(d.prompts[0].updatedAt, '2026-01-02T00:00:00.000Z');
  assert.deepEqual(d.tombstones, []);
  assert.deepEqual(d.packs, {});
  assert.equal(d.settings.floatingButton, false, 'user settings preserved');
  assert.equal(d.settings.sync.enabled, false, 'sync off by default');
  assert.deepEqual(area.dump()[BACKUP_KEY][0].data, v1);
});

test('two pages writing the same storage concurrently do not lose updates (optimistic retry)', async () => {
  const area = memoryArea();
  const pageA = createStore(area); const pageB = createStore(area);
  await Promise.all([
    ...Array.from({ length: 10 }, (_, i) => pageA.upsertPrompt({ title: 'A' + i, body: 'a' })),
    ...Array.from({ length: 10 }, (_, i) => pageB.upsertPrompt({ title: 'B' + i, body: 'b' })),
  ]);
  assert.equal((await pageA.load()).prompts.length, 20);
});

test('delete writes a tombstone with content hash; replace-import tombstones removed prompts', async () => {
  const { store } = mk();
  const p = await store.upsertPrompt({ title: 'A', body: 'x' });
  await store.upsertPrompt({ title: 'B', body: 'y' });
  await store.deletePrompt(p.id);
  let d = await store.load();
  assert.equal(d.tombstones.length, 1);
  assert.equal(d.tombstones[0].hash, S.contentHash(p));
  await store.importJSON(JSON.stringify([{ title: 'C', body: 'z' }]), 'replace');
  d = await store.load();
  assert.equal(d.tombstones.length, 2);
});
