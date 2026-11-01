(async () => {
  'use strict';
  const { t, applyI18n, h } = PM;
  const embed = new URLSearchParams(location.search).get('mode') === 'embed';
  document.body.classList.toggle('embed', embed);
  applyI18n();

  const store = PM.createStore(chrome.storage.local);
  const $ = (id) => document.getElementById(id);
  const q = $('q'); const folderSel = $('folder'); const list = $('list');
  let data = await store.load();
  let current = null;

  $('manage').addEventListener('click', () => chrome.runtime.openOptionsPage());
  if (embed) {
    $('close').hidden = false;
    $('close').addEventListener('click', closeEmbed);
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('formView').hidden) showList(); else if (embed) closeEmbed();
  });

  function status(msg, kind) { const s = $('status'); s.textContent = msg; s.className = kind || ''; }

  function renderFolders() {
    const val = folderSel.value;
    folderSel.replaceChildren(h('option', { value: '' }, t('allFolders')), ...data.folders.map((f) => h('option', { value: f }, f)));
    folderSel.value = data.folders.includes(val) ? val : '';
  }

  function renderList() {
    const items = PM.searchPrompts(data.prompts, { query: q.value, folder: folderSel.value });
    list.replaceChildren(...items.map((p) => {
      const vars = PM.parseVariables(p.body);
      const meta = [p.folder, ...(p.tags || []).map((x) => '#' + x)].filter(Boolean).join(' · ') || p.body.slice(0, 80);
      return h('li', { tabindex: '0', role: 'option', dataset: { id: p.id }, onclick: () => choose(p), onkeydown: (e) => { if (e.key === 'Enter') choose(p); } },
        h('div', { class: 't' }, p.title, vars.length ? h('span', { class: 'badge' }, t('templateBadge')) : null),
        h('div', { class: 'meta' }, meta));
    }));
    $('empty').hidden = items.length > 0;
  }

  q.addEventListener('input', renderList);
  q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const first = list.querySelector('li'); if (first) first.click(); } });
  folderSel.addEventListener('change', renderList);

  function showList() { current = null; $('formView').hidden = true; $('listView').hidden = false; q.focus(); }

  function choose(p) {
    const vars = PM.parseVariables(p.body);
    if (!vars.length) { send(p.body); return; }
    current = p;
    $('listView').hidden = true; $('formView').hidden = false;
    $('formTitle').textContent = p.title;
    const form = $('varForm');
    const fields = vars.map((v, i) => {
      const id = 'v' + i;
      const input = h('input', { id, name: v.name, type: 'text', value: v.default || '', placeholder: v.default || v.name, autocomplete: 'off' });
      input.addEventListener('input', updatePreview);
      return [h('label', { for: id }, v.name), input];
    });
    form.replaceChildren(...fields.flat(),
      h('div', { class: 'actions' },
        h('button', { class: 'primary', type: 'submit', id: 'insertBtn' }, t('insert')),
        h('button', { type: 'button', id: 'copyBtn', onclick: () => copy(filled()) }, t('copy')),
        h('span', { class: 'spacer' }),
        h('button', { type: 'button', class: 'ghost', onclick: showList }, t('back'))));
    form.onsubmit = (e) => { e.preventDefault(); send(filled()); };
    updatePreview();
    const first = form.querySelector('input'); if (first) { first.focus(); first.select(); }
  }

  function filled() {
    const values = {};
    $('varForm').querySelectorAll('input[name]').forEach((i) => { values[i.name] = i.value; });
    return PM.fillTemplate(current.body, values);
  }
  function updatePreview() { $('preview').textContent = filled(); }

  async function targetTabId() {
    if (embed) return undefined;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab && tab.id;
  }

  async function send(text) {
    let res = null;
    try { res = await chrome.runtime.sendMessage({ type: 'PM_INSERT_REQUEST', text, tabId: await targetTabId() }); } catch (_) { res = null; }
    if (res && res.ok) {
      status(t('inserted'), 'ok');
      if (!embed) setTimeout(() => window.close(), 400);
      return;
    }
    const copied = await copy(text, true);
    status(copied ? t('copiedFallback') : t('insertFailed'), 'warn');
  }

  async function copy(text, silent) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (_) {
      const ta = h('textarea', { style: 'position:fixed;left:-9999px' }); ta.value = text;
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
      ta.remove();
    }
    if (!silent) status(ok ? t('copied') : t('copyFailed'), ok ? 'ok' : 'warn');
    return ok;
  }

  function closeEmbed() { chrome.runtime.sendMessage({ type: 'PM_CLOSE_REQUEST' }).catch(() => {}); }

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local' || !changes.pm_data) return;
    data = await store.load(); renderFolders(); renderList();
  });

  renderFolders(); renderList(); q.focus();
})();
