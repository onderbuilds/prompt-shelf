const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '../..');
const EXT = path.join(ROOT, 'prompt-manager');
const SHOTS = path.join(ROOT, 'screenshots');
const MOCKS = require('../mock-sites/make.js');
const BUNDLES = { '/__mock/pm.bundle.js': 'pm.bundle.js', '/__mock/quill.bundle.js': 'quill.bundle.js' };
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const blocked = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); console.log('  ✔', name); } catch (e) { results.push({ name, ok: false, err: e.message }); console.log('  ✖', name, '\n     ', e.message.split('\n')[0]); }
}
function assert(c, m) { if (!c) throw new Error(m); }
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

async function launch(lang) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-e2e-'));
  const ctx = await chromium.launchPersistentContext(dir, {
    channel: 'chromium', headless: true, locale: lang, viewport: { width: 1280, height: 800 },
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, `--lang=${lang}`],
  });
  await ctx.route('**/*', async (route) => {
    const raw = route.request().url();
    if (/^(chrome-extension|data|blob):/.test(raw)) return route.continue();
    const u = new URL(raw);
    const key = u.origin + u.pathname;
    if (MOCKS[key]) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: MOCKS[key] });
    if (BUNDLES[u.pathname]) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(path.join(ROOT, 'tests/mock-sites', BUNDLES[u.pathname])) });
    }
    blocked.push(route.request().url());
    return route.abort();
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  const id = new URL(sw.url()).host;
  return { ctx, sw, id, dir };
}

async function seed(ctx, id) {
  const p = await ctx.newPage();
  await p.goto(`chrome-extension://${id}/options/options.html`);
  await p.waitForFunction(async () => (await PM.createStore(chrome.storage.local).load()).prompts.length >= 3, null, { timeout: 10000 });
  await p.evaluate(async () => {
    const s = PM.createStore(chrome.storage.local);
    await s.upsertPrompt({ title: 'Multi-line test', body: 'Line one of the prompt.\nLine two with ünïcödé ğüşİ.\nLine three.', folder: 'Tests', tags: ['e2e'] });
    await s.upsertPrompt({ title: 'Blog outline', body: 'Create a blog outline about {{topic}} for {{audience|beginners}} in a {{tone|friendly}} tone.', folder: 'Writing', tags: ['blog', 'template'] });
    await s.upsertPrompt({ title: 'Kod incelemesi', body: 'Bu kodu incele ve hataları listele.', folder: 'Kod', tags: ['kod'] });
  });
  return p;
}

async function openPanel(page) {
  const btn = page.locator('#pm-local-prompt-manager button[data-pm="toggle"]');
  await btn.waitFor({ timeout: 10000 });
  await btn.click();
  const frame = page.frameLocator('#pm-local-prompt-manager iframe');
  await frame.locator('#q').waitFor({ timeout: 10000 });
  return frame;
}

async function pick(frame, title) {
  await frame.locator('#q').fill(title);
  await frame.locator('#list li', { hasText: title }).first().click();
}

(async () => {
  console.log('E2E (headless Chromium, unpacked extension, mock pages)');
  const { ctx, sw, id } = await launch('en-US');
  const opt = await seed(ctx, id);

  await check('service worker seeded 3 sample prompts on install', async () => {
    const n = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.length);
    assert(n === 6, 'expected 6 prompts (3 samples + 3 test), got ' + n);
  });

  await check('options: create prompt via form', async () => {
    await opt.reload();
    await opt.click('#newPrompt');
    await opt.fill('#fTitle', 'Created in UI');
    await opt.fill('#fFolder', 'Writing');
    await opt.fill('#fTags', 'ui, demo');
    await opt.fill('#fBody', 'Summarize {{text}} in {{n|3}} bullet points.');
    await opt.click('#editForm button[type=submit]');
    await opt.locator('#editMsg', { hasText: 'Saved' }).waitFor();
    await opt.locator('#promptList li', { hasText: 'Created in UI' }).waitFor();
  });
  await check('options: search filters list', async () => {
    await opt.fill('#search', '#blog');
    const n = await opt.locator('#promptList li').count();
    assert(n === 1, 'expected 1 result for #blog, got ' + n);
    await opt.fill('#search', '');
  });
  await opt.locator('#promptList li', { hasText: 'Blog outline' }).click();
  await opt.screenshot({ path: path.join(SHOTS, '01-options-prompts-en.png') });

  await check('options: export downloads valid JSON', async () => {
    await opt.click('.tabs button[data-tab=io]');
    const [dl] = await Promise.all([opt.waitForEvent('download'), opt.click('#exportBtn')]);
    const file = await dl.path();
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert(j.app === 'local-prompt-manager' && j.prompts.length === 7, 'bad export ' + j.prompts.length);
    fs.copyFileSync(file, '/tmp/pm-export.json');
  });
  await check('options: import merge of own export = all skipped, no duplicates', async () => {
    await opt.setInputFiles('#importFile', '/tmp/pm-export.json');
    await opt.click('#importBtn');
    await opt.locator('#importResult', { hasText: '0 added, 7 identical skipped, 0 conflicts' }).waitFor({ timeout: 5000 });
  });
  await check('options: import replace makes a backup first', async () => {
    fs.writeFileSync('/tmp/pm-small.json', JSON.stringify([{ title: 'Only one', body: 'x' }, { title: '' }]));
    opt.once('dialog', (d) => d.accept());
    await opt.check('input[name=mode][value=replace]');
    await opt.setInputFiles('#importFile', '/tmp/pm-small.json');
    await opt.click('#importBtn');
    await opt.locator('#importResult', { hasText: 'backup' }).waitFor({ timeout: 5000 });
    await opt.screenshot({ path: path.join(SHOTS, '02-options-import-en.png') });
    await opt.click('.tabs button[data-tab=backups]');
    await opt.locator('#backupRows tr', { hasText: 'before-replace' }).waitFor();
    opt.once('dialog', (d) => d.accept());
    await opt.locator('#backupRows tr', { hasText: 'before-replace' }).locator('button', { hasText: 'Restore' }).click();
    await opt.waitForFunction(async () => (await PM.createStore(chrome.storage.local).load()).prompts.length === 7);
    await opt.screenshot({ path: path.join(SHOTS, '03-options-backups-en.png') });
  });
  await opt.click('.tabs button[data-tab=pro]');
  await opt.screenshot({ path: path.join(SHOTS, '04-options-pro-placeholder-en.png') });

  const pop = await ctx.newPage();
  await pop.setViewportSize({ width: 360, height: 520 });
  await pop.goto(`chrome-extension://${id}/panel/panel.html`);
  await pop.locator('#list li').first().waitFor();
  await pop.screenshot({ path: path.join(SHOTS, '05-popup-list-en.png') });
  await check('popup: search finds Turkish prompt with ASCII query', async () => {
    await pop.fill('#q', 'kod inceleme');
    assert(await pop.locator('#list li', { hasText: 'Kod incelemesi' }).count() === 1, 'not found');
    await pop.fill('#q', '');
  });

  const multi = 'Line one of the prompt.\nLine two with ünïcödé ğüşİ.\nLine three.';
  const sites = [
    ['ChatGPT (ProseMirror)', 'https://chatgpt.com/', 'chatgpt'],
    ['ChatGPT legacy (textarea)', 'https://chat.openai.com/', 'chatgpt-legacy'],
    ['Claude (ProseMirror)', 'https://claude.ai/new', 'claude'],
    ['Gemini (Quill)', 'https://gemini.google.com/app', 'gemini'],
    ['Grok (textarea)', 'https://grok.com/', 'grok'],
    ['Grok on X (textarea)', 'https://x.com/i/grok', 'x-grok'],
  ];
  for (const [label, url, slug] of sites) {
    const page = await ctx.newPage();
    await page.goto(url);
    await page.bringToFront();
    await check(`${label}: plain multi-line insert registered by editor`, async () => {
      const frame = await openPanel(page);
      await pick(frame, 'Multi-line test');
      await page.waitForFunction(() => !document.getElementById('pm-local-prompt-manager').shadowRoot.querySelector('iframe'), null, { timeout: 5000 });
      const reg = await page.evaluate(() => window.__registered());
      assert(norm(reg) === norm(multi), 'registered=' + JSON.stringify(reg) + ' dom=' + await page.evaluate(() => (document.querySelector('[contenteditable=true],textarea:not([style])') || {}).outerHTML));
      assert(reg.includes('\n'), 'newlines lost: ' + JSON.stringify(reg));
      assert(!(await page.locator('#send').isDisabled()), 'send button still disabled (site did not register text)');
    });
    await check(`${label}: template with variable form appends at caret`, async () => {
      const frame = await openPanel(page);
      await pick(frame, 'Blog outline');
      await frame.locator('#varForm input[name=topic]').waitFor();
      await frame.locator('#varForm input[name=topic]').fill('home espresso');
      if (slug === 'chatgpt') await page.screenshot({ path: path.join(SHOTS, '06-variable-form-chatgpt-mock.png') });
      await frame.locator('#insertBtn').click();
      await page.waitForFunction(() => !document.getElementById('pm-local-prompt-manager').shadowRoot.querySelector('iframe'), null, { timeout: 5000 });
      const reg = norm(await page.evaluate(() => window.__registered()));
      const exp = 'Create a blog outline about home espresso for beginners in a friendly tone.';
      assert(reg.startsWith(norm(multi)) && reg.endsWith(exp), 'registered=' + reg);
      const raw = await page.evaluate(() => window.__registered());
      assert(/Line three\.\n+Create/.test(raw), 'no paragraph break before appended prompt: ' + JSON.stringify(raw));
    });
    await page.screenshot({ path: path.join(SHOTS, `07-inserted-${slug}-mock.png`) });
    await page.close();
  }

  await check('panel opened on page: Escape closes it', async () => {
    const page = await ctx.newPage();
    await page.goto('https://grok.com/');
    const frame = await openPanel(page);
    await frame.locator('#q').press('Escape');
    await page.waitForFunction(() => !document.getElementById('pm-local-prompt-manager').shadowRoot.querySelector('iframe'), null, { timeout: 5000 });
    await page.close();
  });

  await check('popup → content script messaging (toolbar popup path)', async () => {
    const page = await ctx.newPage();
    await page.goto('https://claude.ai/new');
    await page.locator('#pm-local-prompt-manager button').waitFor();
    await page.bringToFront();
    const tabId = await sw.evaluate(async () => (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id);
    const r = await pop.evaluate(async (tid) => chrome.runtime.sendMessage({ type: 'PM_INSERT_REQUEST', text: 'from popup', tabId: tid }), tabId);
    assert(r && r.ok, 'response ' + JSON.stringify(r));
    assert(norm(await page.evaluate(() => window.__registered())) === 'from popup', 'not inserted');
    await page.close();
  });

  await check('fallback: page without prompt box -> copied to clipboard', async () => {
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await ctx.newPage();
    await page.goto('https://claude.ai/no-input');
    const frame = await openPanel(page);
    await pick(frame, 'Kod incelemesi');
    await frame.locator('#status', { hasText: 'copied to clipboard' }).waitFor({ timeout: 5000 });
    await page.screenshot({ path: path.join(SHOTS, '08-fallback-clipboard-mock.png') });
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => 'ERR ' + e.message);
    assert(clip === 'Bu kodu incele ve hataları listele.', 'clipboard=' + clip);
    await page.close();
  });

  await check('setting: floating button can be turned off', async () => {
    await opt.click('.tabs button[data-tab=settings]');
    await opt.uncheck('#sFloating');
    const page = await ctx.newPage();
    await page.goto('https://chatgpt.com/');
    await page.waitForTimeout(1500);
    assert(await page.locator('#pm-local-prompt-manager button').isHidden(), 'button still visible');
    await opt.check('#sFloating');
    await page.locator('#pm-local-prompt-manager button').waitFor({ state: 'visible', timeout: 5000 });
    await page.close();
  });

  await check('no prompt data exposed to the host page DOM', async () => {
    const page = await ctx.newPage();
    await page.goto('https://chatgpt.com/');
    await openPanel(page);
    const leaked = await page.evaluate(() => {
      const root = document.getElementById('pm-local-prompt-manager').shadowRoot;
      return document.documentElement.outerHTML.includes('Blog outline') || root.innerHTML.includes('Blog outline');
    });
    assert(!leaked, 'prompt titles visible in page DOM');
    await page.close();
  });

  await opt.bringToFront();
  await opt.reload();
  await check('packs: install crypto pack (EN) from the Packs tab', async () => {
    await opt.click('.tabs button[data-tab=packs]');
    const card = opt.locator('.pack[data-pack=crypto]');
    await card.locator('button[data-act=install]').click();
    await card.locator('.pill', { hasText: 'Installed' }).waitFor({ timeout: 5000 });
    const n = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.filter((p) => p.packId === 'crypto').length);
    assert(n === 15, 'crypto prompts ' + n);
    await opt.locator('.pack[data-pack=code] button[data-act=install]').click();
    await opt.locator('.pack[data-pack=code] .pill').waitFor();
    await opt.screenshot({ path: path.join(SHOTS, '13-packs-en.png'), fullPage: true });
  });
  await check('packs: crypto template inserts on a mock site with disclaimer', async () => {
    const page = await ctx.newPage();
    await page.goto('https://grok.com/');
    await page.bringToFront();
    const frame = await openPanel(page);
    await pick(frame, 'Rug-pull risk checklist');
    await frame.locator('#varForm input[name=token]').fill('$EXAMPLE');
    await frame.locator('#insertBtn').click();
    await page.waitForFunction(() => !document.getElementById('pm-local-prompt-manager').shadowRoot.querySelector('iframe'), null, { timeout: 5000 });
    const reg = await page.evaluate(() => window.__registered());
    assert(reg.includes('$EXAMPLE on Solana') && reg.includes('not financial advice'), reg.slice(0, 200));
    await page.close();
  });
  await check('packs: uninstall keeps the pack prompt the user edited', async () => {
    await opt.bringToFront();
    await opt.evaluate(async () => {
      const s = PM.createStore(chrome.storage.local);
      const p = (await s.load()).prompts.find((x) => x.id === 'pack.code.review');
      await s.upsertPrompt({ ...p, body: p.body + '\nMy extra rule.' });
    });
    await opt.reload();
    await opt.click('.tabs button[data-tab=packs]');
    await opt.locator('.pack[data-pack=code] button[data-act=uninstall]').click();
    await opt.locator('#pmToast', { hasText: '15 unedited prompts deleted, 1 edited' }).waitFor({ timeout: 5000 });
    const left = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.filter((p) => p.id.startsWith('pack.code.')).map((p) => p.packId));
    assert(left.length === 1 && left[0] === null, JSON.stringify(left));
  });

  await check('history: every save creates a version; diff view shows word changes; restore adds a version', async () => {
    await opt.click('.tabs button[data-tab=prompts]');
    await opt.locator('#promptList li', { hasText: 'Blog outline' }).click();
    const orig = await opt.inputValue('#fBody');
    const before = await opt.evaluate(async () => { const s = PM.createStore(chrome.storage.local); const p = (await s.load()).prompts.find((x) => x.title === 'Blog outline'); return (await s.listHistory(p.id)).length; });
    await opt.fill('#fBody', orig.replace('friendly', 'witty') + '\nAdd a FAQ section.');
    await opt.click('#editForm button[type=submit]');
    await opt.locator('#editMsg', { hasText: 'Saved' }).waitFor();
    await opt.fill('#fBody', (await opt.inputValue('#fBody')).replace('blog outline', 'detailed blog outline'));
    await opt.click('#editForm button[type=submit]');
    await opt.waitForTimeout(300);
    await opt.click('#histBtn');
    await opt.locator('#histDialog[open]').waitFor();
    const n = await opt.locator('#histList li[data-v]').count();
    assert(n === before + 2, 'versions ' + n + ' (before ' + before + ')');
    await opt.locator('#histList li[data-v]').nth(1).click();
    assert(await opt.locator('#histDiff ins').count() > 0 && await opt.locator('#histDiff del').count() > 0, 'no word highlights');
    await opt.screenshot({ path: path.join(SHOTS, '16-history-diff-en.png') });
    await opt.click('#histRestore');
    await opt.waitForFunction((k) => document.querySelectorAll('#histList li[data-v]').length === k, before + 3);
    const body = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.find((p) => p.title === 'Blog outline').body);
    assert(body === orig, 'restored body differs');
    await opt.click('#histClose');
  });

  await check('sync: enable Chrome sync -> data written to chrome.storage.sync in chunks', async () => {
    await opt.click('.tabs button[data-tab=sync]');
    await opt.check('#syncEnabled');
    await opt.locator('#syncStatus', { hasText: 'In sync' }).waitFor({ timeout: 10000 });
    const keys = await opt.evaluate(async () => Object.keys(await chrome.storage.sync.get(null)));
    assert(keys.includes('pms_meta') && keys.some((k) => /^pms_\w+_0$/.test(k)), keys.join(','));
    const dec = await opt.evaluate(async () => { const r = await PM.decodeItems(await chrome.storage.sync.get(null)); return { status: r.status, n: r.payload.prompts.length, packs: Object.keys(r.payload.packs) }; });
    assert(dec.status === 'ok' && dec.packs.includes('crypto'), JSON.stringify(dec));
    assert(dec.n === 8, 'pristine pack prompts must not be uploaded; payload prompts=' + dec.n);
    await opt.evaluate(() => { document.querySelector('details.why').open = true; });
    await opt.screenshot({ path: path.join(SHOTS, '14-sync-settings-en.png'), fullPage: true });
  });

  await check('sync: simulated second device edits same prompt -> conflict UI, keep both versions', async () => {
    const r = await opt.evaluate(async () => {
      const s = PM.createStore(chrome.storage.local);
      const target = (await s.load()).prompts.find((p) => p.title === 'Kod incelemesi');

      const remote = await PM.decodeItems(await chrome.storage.sync.get(null));
      const rp = remote.payload.prompts.find((p) => p.id === target.id);
      rp.body = 'Bu kodu incele, hataları ve güvenlik açıklarını listele. (cihaz B)';
      rp.rev += 1; rp.deviceId = 'dev-B-laptop'; rp.updatedAt = new Date(Date.now() + 60000).toISOString();
      const enc = await PM.encodePayload(remote.payload, { deviceId: 'dev-B-laptop' });
      const old = Object.keys(await chrome.storage.sync.get(null)).filter((k) => k.startsWith('pms_') && !(k in enc.items));
      await chrome.storage.sync.set(enc.items); await chrome.storage.sync.remove(old);

      await s.upsertPrompt({ ...target, body: 'Bu kodu incele ve performans sorunlarını listele. (cihaz A)' });
      return chrome.runtime.sendMessage({ type: 'PM_SYNC_NOW', force: true });
    });
    assert(r && r.status && r.status.startsWith('ok'), JSON.stringify(r));
    await opt.locator('.conflict').first().waitFor({ timeout: 5000 });
    assert(!(await opt.locator('#conflictBanner').isHidden()), 'banner hidden');
    await opt.screenshot({ path: path.join(SHOTS, '15-sync-conflict-en.png'), fullPage: true });
    const bodies = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.filter((p) => /cihaz [AB]/.test(p.body)).map((p) => p.body).sort());
    assert(bodies.length === 2, 'both versions kept: ' + JSON.stringify(bodies));
    await opt.locator('.conflict button[data-choice=both]').first().click();
    await opt.locator('.conflict').first().waitFor({ state: 'detached', timeout: 5000 });
    const after = await opt.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.filter((p) => /cihaz [AB]/.test(p.body)).length);
    assert(after === 2, 'keep both -> 2 prompts, got ' + after);
  });

  await check('sync: over quota -> warning, nothing uploaded, local intact; recovers after cleanup', async () => {
    const metaBefore = await opt.evaluate(async () => (await chrome.storage.sync.get('pms_meta')).pms_meta.dataHash);
    const st = await opt.evaluate(async () => {
      const s = PM.createStore(chrome.storage.local);
      const rnd = (n) => Array.from({ length: n }, () => Math.random().toString(36).slice(2)).join(' ');
      for (let i = 0; i < 12; i += 1) await s.upsertPrompt({ title: 'Huge ' + i, body: rnd(1200), folder: 'Quota test' });
      return chrome.runtime.sendMessage({ type: 'PM_SYNC_NOW', force: true });
    });
    assert(st.status === 'over-quota', JSON.stringify(st.status));
    await opt.locator('#syncStatus', { hasText: 'Too large' }).waitFor({ timeout: 5000 });
    await opt.screenshot({ path: path.join(SHOTS, '18-sync-over-quota-en.png') });
    const metaAfter = await opt.evaluate(async () => (await chrome.storage.sync.get('pms_meta')).pms_meta.dataHash);
    assert(metaAfter === metaBefore, 'cloud copy changed while over quota');
    const st2 = await opt.evaluate(async () => {
      const s = PM.createStore(chrome.storage.local);
      for (const p of (await s.load()).prompts.filter((x) => x.folder === 'Quota test')) await s.deletePrompt(p.id);
      return chrome.runtime.sendMessage({ type: 'PM_SYNC_NOW', force: true });
    });
    assert(st2.status === 'ok', st2.status);
  });

  await check('sync: Google Drive option is disabled (no OAuth client, no network)', async () => {
    assert(await opt.locator('#syncAdapter option[value=google-drive]').isDisabled(), 'drive option enabled');
  });

  await check('zero network requests outside mocked pages', async () => {
    assert(blocked.length === 0, 'blocked requests: ' + blocked.join(', '));
  });
  await ctx.close();

  const tr = await launch('tr');
  const o2 = await seed(tr.ctx, tr.id);
  await o2.reload();
  await check('Turkish locale is applied', async () => {
    const txt = await o2.locator('.tabs button[data-tab=prompts]').textContent();
    assert(txt === 'Promptlar', 'tab text=' + txt);
  });
  await o2.locator('#promptList li').first().click();
  await o2.screenshot({ path: path.join(SHOTS, '09-options-prompts-tr.png') });
  await o2.click('.tabs button[data-tab=packs]');
  await o2.locator('.pack[data-pack=writing] button[data-act=install]').click();
  await o2.locator('.pack[data-pack=writing] .pill').waitFor();
  await check('Turkish pack install uses Turkish templates', async () => {
    const t = await o2.evaluate(async () => (await PM.createStore(chrome.storage.local).load()).prompts.find((p) => p.id === 'pack.writing.outline'));
    assert(t.title === 'Makale taslağı' && t.folder === 'İçerik yazımı', JSON.stringify([t.title, t.folder]));
  });
  await o2.screenshot({ path: path.join(SHOTS, '17-packs-tr.png'), fullPage: true });
  const p2 = await tr.ctx.newPage();
  await p2.goto('https://gemini.google.com/app');
  const f2 = await openPanel(p2);
  await p2.screenshot({ path: path.join(SHOTS, '10-panel-on-gemini-mock-tr.png') });
  await pick(f2, 'Farklı bir tonda');
  await f2.locator('#varForm input').first().waitFor();
  await p2.screenshot({ path: path.join(SHOTS, '11-variable-form-gemini-mock-tr.png') });
  await tr.ctx.close();

  const b = await chromium.launch({ headless: true });
  const lp = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await lp.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : (blocked.push(r.request().url()), r.abort())));
  await lp.goto('file://' + path.join(ROOT, 'landing/index.html'));
  await lp.screenshot({ path: path.join(SHOTS, '12-landing-page.png'), fullPage: true });
  await check('landing: no external requests, form not wired', async () => {
    assert(blocked.length === 0, 'landing requested: ' + blocked.join(', '));
    const action = await lp.getAttribute('form', 'action');
    assert(action === '#TODO-waitlist-endpoint', 'form action=' + action);
  });
  await b.close();

  const pass = results.filter((r) => r.ok).length;
  console.log(`\nE2E: ${pass} passed, ${results.length - pass} failed`);
  fs.writeFileSync(path.join(ROOT, 'tests/e2e/last-run.json'), JSON.stringify({ at: new Date().toISOString(), results, blocked }, null, 2));
  process.exit(pass === results.length ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
