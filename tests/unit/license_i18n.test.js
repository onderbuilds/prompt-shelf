const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../../prompt-manager/lib/license.js');
const ROOT = path.join(__dirname, '../../prompt-manager');

test('license is disabled by default, makes no request, unlocks everything', async () => {
  assert.equal(L.LICENSE_FEATURE_ENABLED, false);
  let calls = 0;
  const c = L.createLicenseClient({ fetchImpl: async () => { calls += 1; } });
  assert.equal(c.enabled, false);
  assert.deepEqual(await c.activate('ABCD-1234-EFGH'), { ok: false, reason: 'disabled' });
  assert.equal((await c.validate({ key: 'x' })).reason, 'disabled');
  assert.equal(await c.isPro(), true);
  assert.equal(await c.canUse('folders', { folderCount: 999 }), true);
  assert.equal(calls, 0);
});

test('license (enabled in test only) calls Lemon Squeezy activate/validate correctly', async () => {
  const reqs = [];
  const store = new Map();
  const area = { get: async (k) => ({ [k[0]]: store.get(k[0]) }), set: async (o) => { for (const [k, v] of Object.entries(o)) store.set(k, v); } };
  const fetchImpl = async (url, init) => {
    reqs.push({ url, init });
    if (url.endsWith('/activate')) return { ok: true, status: 200, json: async () => ({ activated: true, instance: { id: 'inst-1' }, license_key: { status: 'active' }, meta: {} }) };
    return { ok: true, status: 200, json: async () => ({ valid: true, license_key: { status: 'active' }, meta: {} }) };
  };
  const c = L.createLicenseClient({ enabled: true, fetchImpl, area });
  assert.equal(await c.isPro(), false);
  assert.equal(await c.canUse('folders', { folderCount: L.FREE_FOLDER_LIMIT }), false);
  assert.equal(await c.canUse('folders', { folderCount: 1 }), true);
  assert.equal(await c.canUse('import'), true, 'core features never gated');
  assert.equal((await c.activate('bad key!')).reason, 'invalid-key-format');
  const a = await c.activate('ABCD-1234-EFGH-5678', 'test');
  assert.equal(a.ok, true);
  assert.equal(reqs[0].url, 'https://api.lemonsqueezy.com/v1/licenses/activate');
  assert.equal(reqs[0].init.method, 'POST');
  assert.equal(reqs[0].init.body, 'license_key=ABCD-1234-EFGH-5678&instance_name=test');
  assert.equal(await c.isPro(), true);
  const v = await c.validate(await c.getState());
  assert.equal(v.ok, true);
  assert.equal(reqs[1].init.body, 'license_key=ABCD-1234-EFGH-5678&instance_id=inst-1');
  const failing = L.createLicenseClient({ enabled: true, fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal((await failing.activate('ABCD-1234-EFGH')).reason, 'network');
});

test('locales: en and tr have identical keys and cover every key used in code', () => {
  const en = JSON.parse(fs.readFileSync(path.join(ROOT, '_locales/en/messages.json'), 'utf8'));
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, '_locales/tr/messages.json'), 'utf8'));
  assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort());
  const files = ['manifest.json', 'background.js', 'content/content.js', 'panel/panel.html', 'panel/panel.js', 'options/options.html', 'options/options.js', 'options/pro.js'];
  const used = new Set();
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of src.matchAll(/data-i18n(?:-placeholder|-title)?="([A-Za-z0-9_]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/\bt\('([A-Za-z0-9_]+)'/g)) used.add(m[1]);
    for (const m of src.matchAll(/getMessage\('([A-Za-z0-9_]+)'/g)) used.add(m[1]);
    for (const m of src.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !(k in en));
  assert.deepEqual(missing, []);
  for (const [k, v] of Object.entries(tr)) assert.ok(v.message && v.message.trim(), 'empty tr message ' + k);
});

test('no network APIs outside lib/license.js, no remote code, no eval', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const js = walk(ROOT).filter((f) => /\.(js|html)$/.test(f));
  for (const f of js) {
    const src = fs.readFileSync(f, 'utf8');
    const rel = path.relative(ROOT, f);
    assert.doesNotMatch(src, /\beval\(|new Function\(|innerHTML\s*=|document\.write/, rel);
    assert.doesNotMatch(src, /<script[^>]+src=["']https?:/, rel);
    if (rel !== 'lib/license.js') assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource/, rel);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.deepEqual(manifest.permissions.sort(), ['alarms', 'clipboardWrite', 'storage', 'unlimitedStorage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.oauth2, undefined, 'no OAuth client configured (Drive adapter disabled)');
  assert.ok(!manifest.permissions.includes('identity'));
  assert.deepEqual(manifest.optional_host_permissions, ['https://api.lemonsqueezy.com/*']);
});
