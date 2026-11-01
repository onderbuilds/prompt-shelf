const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../../prompt-manager/lib/packs.js');
const T = require('../../prompt-manager/lib/template.js');
const S = require('../../prompt-manager/lib/schema.js');
const { createStore, memoryArea } = require('../../prompt-manager/lib/store.js');

test('4 packs, 15-20 templates each, unique ids, EN + TR, every template has variables', () => {
  const packs = P.listPacks();
  assert.deepEqual(packs.map((p) => p.id), ['code', 'marketing', 'crypto', 'writing']);
  for (const p of packs) {
    assert.ok(p.templates.length >= 15 && p.templates.length <= 20, p.id + ' has ' + p.templates.length);
    assert.equal(new Set(p.templates.map((t) => t.id)).size, p.templates.length, 'unique ids in ' + p.id);
    assert.ok(p.name.en && p.name.tr && p.description.en && p.description.tr);
    for (const t of p.templates) for (const L of ['en', 'tr']) {
      assert.ok(t[L].title.length > 5 && t[L].body.length > 80, p.id + '.' + t.id + '.' + L);
      assert.ok(T.parseVariables(t[L].body).length > 0, 'no variables in ' + p.id + '.' + t.id + '.' + L);
      assert.equal(S.validatePrompt({ title: t[L].title, body: t[L].body }).length, 0);
    }
  }
});

test('crypto pack: research-only, disclaimers present, no signals/predictions wording', () => {
  const c = P.getPack('crypto');
  const bad = /\b(buy now|sell now|price target|to the moon|guaranteed (profit|returns)|entry point|take[- ]profit|stop[- ]loss level|100x gem)\b/i;
  let withDisclaimer = 0;
  for (const t of c.templates) for (const L of ['en', 'tr']) {
    const b = t[L].body;

    const stripped = b.replace(/Do not give[^.]*\.|Al\/sat\/tut önerisi[^.]*\./g, '').replace(/"[^"]*"/g, '');
    assert.doesNotMatch(stripped, bad, c.id + '.' + t.id + '.' + L);
    if (/not financial advice|yatırım tavsiyesi değildir/.test(b)) withDisclaimer += 1;
  }
  assert.ok(withDisclaimer >= 2 * (c.templates.length - 1), 'disclaimers: ' + withDisclaimer);
});

test('install adds pack prompts without touching user prompts; reinstall is idempotent', async () => {
  const s = createStore(memoryArea());
  const mine = await s.upsertPrompt({ title: 'Code review (bugs, security, readability)', body: 'my own version', folder: 'Code' });
  const r1 = await s.installPack(P.getPack('code'), 'en', P.buildPackPrompts);
  assert.equal(r1.added, P.getPack('code').templates.length);
  const r2 = await s.installPack(P.getPack('code'), 'en', P.buildPackPrompts);
  assert.deepEqual(r2, { added: 0, skipped: P.getPack('code').templates.length });
  const d = await s.load();
  assert.equal(d.prompts.find((p) => p.id === mine.id).body, 'my own version');
  assert.ok(d.prompts.filter((p) => p.packId === 'code').every((p) => S.isPristinePack(p)));
  assert.deepEqual(P.packStatus(d, 'code'), { installed: true, lang: 'en', count: 16, edited: 0 });
});

test('uninstall removes only untouched pack prompts; edited ones are kept as normal prompts', async () => {
  const s = createStore(memoryArea());
  await s.installPack(P.getPack('writing'), 'tr', P.buildPackPrompts);
  let d = await s.load();
  const one = d.prompts.find((p) => p.id === 'pack.writing.outline');
  assert.equal(one.folder, 'İçerik yazımı');
  assert.match(one.title, /Makale/);
  await s.upsertPrompt({ ...one, body: one.body + '\nEk kural.' });
  assert.equal(P.packStatus(await s.load(), 'writing').edited, 1);
  const r = await s.uninstallPack('writing');
  assert.deepEqual(r, { removed: P.getPack('writing').templates.length - 1, kept: 1 });
  d = await s.load();
  assert.equal(d.prompts.length, 1);
  assert.equal(d.prompts[0].packId, null);
  assert.equal(d.packs.writing.installed, false);

  await s.installPack(P.getPack('writing'), 'tr', P.buildPackPrompts);
  d = await s.load();
  assert.ok(d.prompts.find((p) => p.id === 'pack.writing.outline').body.endsWith('Ek kural.'));
});
