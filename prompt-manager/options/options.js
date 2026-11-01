(async () => {
  'use strict';
  const { t, applyI18n, h } = PM;
  applyI18n();
  const store = PM.createStore(chrome.storage.local);
  const license = PM.createLicenseClient({ area: chrome.storage.local });
  const $ = (id) => document.getElementById(id);

  let data = await store.load();
  const ui = { folder: '', tag: '', query: '', selectedId: null };

  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach((s) => { s.hidden = s.id !== 'tab-' + name; });
    if (name === 'backups') renderBackups();
    if (window.PMPro) window.PMPro.onTab(name);
    history.replaceState(null, '', '#' + name);
  }

  function renderNav() {
    const count = (f) => data.prompts.filter((p) => (f === '__none__' ? !p.folder : !f || p.folder === f)).length;
    const item = (value, label, removable) => h('li', { class: ui.folder === value ? 'active' : '', dataset: { folder: value }, onclick: () => { ui.folder = value; renderAll(); } },
      h('span', {}, label), h('span', { class: 'n' }, String(count(value))),
      removable ? h('button', { type: 'button', title: t('rename'), onclick: (e) => { e.stopPropagation(); renameFolder(value); } }, '✎') : null,
      removable ? h('button', { type: 'button', title: t('delete'), onclick: (e) => { e.stopPropagation(); deleteFolder(value); } }, '✕') : null);
    $('folderNav').replaceChildren(item('', t('allFolders')), ...data.folders.map((f) => item(f, f, true)), item('__none__', t('noFolder')));
    $('folderList').replaceChildren(...data.folders.map((f) => h('option', { value: f })));
    $('tagNav').replaceChildren(...PM.listTags(data.prompts).map(({ tag, count: n }) =>
      h('span', { class: 'chip' + (ui.tag.toLowerCase() === tag.toLowerCase() ? ' active' : ''), onclick: () => { ui.tag = ui.tag === tag ? '' : tag; renderAll(); } }, '#' + tag + ' ' + n)));
  }

  function renderList() {
    const items = PM.searchPrompts(data.prompts, { query: ui.query, folder: ui.folder, tag: ui.tag });
    $('count').textContent = t('countOf', [String(items.length), String(data.prompts.length)]);
    $('promptList').replaceChildren(...items.map((p) => h('li', { class: p.id === ui.selectedId ? 'active' : '', dataset: { id: p.id }, onclick: () => select(p.id) },
      h('div', { class: 't' }, p.title, p.conflictOf ? h('span', { class: 'badge warn' }, t('conflictBadge')) : null, p.packId ? h('span', { class: 'badge' }, t('packBadge')) : null),
      h('div', { class: 'm' }, [p.folder, ...(p.tags || []).map((x) => '#' + x)].filter(Boolean).join(' · ') || p.body.slice(0, 80)))));
  }

  function select(id) {
    ui.selectedId = id;
    const p = data.prompts.find((x) => x.id === id) || { title: '', body: '', folder: ui.folder && ui.folder !== '__none__' ? ui.folder : '', tags: [] };
    $('fTitle').value = p.title; $('fBody').value = p.body; $('fFolder').value = p.folder || ''; $('fTags').value = (p.tags || []).join(', ');
    $('delBtn').disabled = !id; $('dupBtn').disabled = !id; $('histBtn').disabled = !id;
    $('editMsg').textContent = '';
    renderVarChips(); renderList();
    $('fTitle').focus();
  }

  function renderVarChips() {
    $('varChips').replaceChildren(...PM.parseVariables($('fBody').value).map((v) =>
      h('span', { class: 'chip active' }, '{{' + v.name + (v.default !== undefined ? '|' + v.default : '') + '}}')));
  }
  $('fBody').addEventListener('input', renderVarChips);

  function msg(el, text, ok) { el.textContent = text; el.className = (el.className.replace(/\b(ok|err)\b/g, '').trim() + ' ' + (ok ? 'ok' : 'err')).trim(); }

  $('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const folder = $('fFolder').value.trim();
    if (folder && !data.folders.includes(folder) && !(await license.canUse('folders', { folderCount: data.folders.length }))) {
      msg($('editMsg'), t('folderLimit', [String(PM.FREE_FOLDER_LIMIT)]), false); return;
    }
    try {
      const saved = await store.upsertPrompt({ id: ui.selectedId || undefined, title: $('fTitle').value, body: $('fBody').value, folder, tags: $('fTags').value });
      data = await store.load(); ui.selectedId = saved.id;
      renderAll(); msg($('editMsg'), t('saved'), true);
    } catch (err) { msg($('editMsg'), err.message, false); }
  });
  $('newPrompt').addEventListener('click', () => select(null));
  $('dupBtn').addEventListener('click', async () => {
    const p = data.prompts.find((x) => x.id === ui.selectedId); if (!p) return;
    const copy = await store.upsertPrompt({ ...p, id: undefined, title: p.title + ' ' + t('copySuffix') });
    data = await store.load(); select(copy.id); renderAll();
  });
  $('delBtn').addEventListener('click', async () => {
    const p = data.prompts.find((x) => x.id === ui.selectedId); if (!p) return;
    if (!confirm(t('confirmDelete', [p.title]))) return;
    await store.deletePrompt(p.id); data = await store.load(); select(null); renderAll();
  });
  $('search').addEventListener('input', (e) => { ui.query = e.target.value; renderList(); });

  $('addFolderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('newFolder').value.trim(); if (!name) return;
    if (!data.folders.includes(name) && !(await license.canUse('folders', { folderCount: data.folders.length }))) { alert(t('folderLimit', [String(PM.FREE_FOLDER_LIMIT)])); return; }
    await store.addFolder(name); $('newFolder').value = ''; data = await store.load(); renderAll();
  });
  async function renameFolder(f) {
    const to = prompt(t('renameFolder'), f); if (!to || to === f) return;
    await store.renameFolder(f, to); data = await store.load(); if (ui.folder === f) ui.folder = to.trim(); renderAll();
  }
  async function deleteFolder(f) {
    if (!confirm(t('confirmDeleteFolder', [f]))) return;
    await store.deleteFolder(f); data = await store.load(); if (ui.folder === f) ui.folder = ''; renderAll();
  }

  $('exportBtn').addEventListener('click', async () => {
    const json = await store.exportJSON();
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = h('a', { href: url, download: 'prompts-' + new Date().toISOString().slice(0, 10) + '.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await store.markExported(); data = await store.load(); renderReminder();
  });
  $('importBtn').addEventListener('click', async () => {
    const file = $('importFile').files[0];
    const out = $('importResult');
    if (!file) { msg(out, t('chooseFile'), false); return; }
    const mode = document.querySelector('input[name=mode]:checked').value;
    if (mode === 'replace' && !confirm(t('confirmReplace'))) return;
    try {
      const r = await store.importJSON(await file.text(), mode);
      let text = t('importDone', [String(r.stats.added), String(r.stats.skipped), String(r.stats.conflicts)]);
      if (r.backupId) text += '\n' + t('backupMade');
      if (r.invalid.length) text += '\n' + t('importInvalid', [String(r.invalid.length)]) + '\n' + r.invalid.slice(0, 10).map((x) => '#' + (x.index + 1) + ': ' + x.errors.join(', ')).join('\n');
      msg(out, text, true);
      data = await store.load(); renderAll();
    } catch (err) {
      msg(out, t('importFailed') + ' ' + err.message, false);
    }
  });

  async function renderBackups() {
    const list = await store.listBackups();
    $('backupRows').replaceChildren(...(list.length ? list.map((b) => h('tr', {},
      h('td', {}, new Date(b.createdAt).toLocaleString()),
      h('td', {}, b.reason),
      h('td', {}, String((b.data && b.data.prompts && b.data.prompts.length) || 0)),
      h('td', {},
        h('button', { type: 'button', onclick: async () => { if (!confirm(t('confirmRestore'))) return; await store.restoreBackup(b.id); data = await store.load(); renderAll(); renderBackups(); } }, t('restore')), ' ',
        h('button', { type: 'button', onclick: () => {
          const url = URL.createObjectURL(new Blob([PM.exportJSON(b.data)], { type: 'application/json' }));
          const a = h('a', { href: url, download: 'backup-' + b.createdAt.slice(0, 19).replace(/:/g, '') + '.json' }); document.body.append(a); a.click(); a.remove();
        } }, t('download'))))) : [h('tr', {}, h('td', { colspan: '4', class: 'muted' }, t('noBackups')))]));
  }
  $('backupNow').addEventListener('click', async () => { await store.createBackup('manual'); renderBackups(); });

  $('sFloating').addEventListener('change', async (e) => { await store.setSettings({ floatingButton: e.target.checked }); data = await store.load(); });

  function renderPro() {
    $('licenseStatus').textContent = license.enabled ? t('licenseEnabled') : t('licenseDisabled');
    $('planFree').replaceChildren(...PM.PLAN.free.map((x) => h('li', {}, x)));
    $('planPro').replaceChildren(...PM.PLAN.pro.map((x) => h('li', {}, x)));

  }

  async function renderReminder() {
    const s = data.settings;
    const days = s.backupReminderDays || 7;
    const oldest = Math.min(...data.prompts.map((p) => Date.parse(p.createdAt)));
    const last = s.lastExportAt ? Date.parse(s.lastExportAt) : oldest;
    const due = data.prompts.length > 0 && Date.now() - last > days * 864e5;
    const show = due && (await license.canUse('backupReminders'));
    $('reminder').hidden = !show;
    $('reminder').textContent = show ? t('backupReminder') : '';
  }

  function renderAll() {
    renderNav(); renderList();
    $('sFloating').checked = data.settings.floatingButton !== false;
    $('sHistMax').value = data.settings.historyMaxVersions;
    $('sHistDays').value = data.settings.historyMaxDays;
    if (window.PMPro) window.PMPro.render();
  }

  $('sHistApply').addEventListener('click', async () => {
    const maxV = Math.min(500, Math.max(1, parseInt($('sHistMax').value, 10) || 50));
    const days = Math.min(3650, Math.max(0, parseInt($('sHistDays').value, 10) || 0));
    await store.setSettings({ historyMaxVersions: maxV, historyMaxDays: days });
    const removed = await store.applyHistoryPolicy();
    data = await store.load(); renderAll();
    $('sHistMsg').textContent = t('historyApplied', [String(removed)]);
  });

  window.PMOptions = {
    store, license, t, h,
    get data() { return data; },
    async reload() { data = await store.load(); renderAll(); return data; },
    get selectedId() { return ui.selectedId; },
    select, showTab,
  };
  window.dispatchEvent(new Event('pm-options-ready'));

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.pm_data) { data = await store.load(); renderAll(); }
    if (area === 'local' && changes.pm_sync_state && window.PMPro) window.PMPro.renderSync();
  });

  renderAll(); renderPro(); renderReminder();
  select(data.prompts[0] ? PM.searchPrompts(data.prompts, {})[0].id : null);
  const startTab = (location.hash || '').slice(1);
  showTab(['prompts', 'io', 'packs', 'sync', 'backups', 'settings', 'pro'].includes(startTab) ? startTab : 'prompts');
})();
