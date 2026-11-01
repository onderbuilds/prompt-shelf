function pmProInit() {
  'use strict';
  const O = window.PMOptions;
  const { t, h, store } = O;
  const $ = (id) => document.getElementById(id);
  const uiLang = () => { try { return chrome.i18n.getUILanguage().toLowerCase().startsWith('tr') ? 'tr' : 'en'; } catch (_) { return 'en'; } };

  function renderPacks() {
    const data = O.data;
    $('packGrid').replaceChildren(...PM.listPacks().map((pack) => {
      const st = PM.packStatus(data, pack.id);
      const lang = st.installed ? st.lang : uiLang();
      const langSel = h('select', { class: 'lang', disabled: st.installed, 'aria-label': t('packLanguage') },
        h('option', { value: 'en' }, 'English'), h('option', { value: 'tr' }, 'Türkçe'));
      langSel.value = lang;
      const L = langSel.value;
      return h('div', { class: 'pack', dataset: { pack: pack.id } },
        h('div', { class: 'row' }, h('h3', {}, pack.name[uiLang()]), h('span', { class: 'spacer' }),
          st.installed ? h('span', { class: 'pill ok' }, t('installed')) : null),
        h('p', { class: 'muted small' }, pack.description[uiLang()]),
        h('span', { class: 'n' }, t('packCount', [String(pack.templates.length)]) + (st.installed ? ' · ' + t('packEdited', [String(st.edited)]) : '')),
        h('ul', {}, pack.templates.map((x) => h('li', {}, (x[L] || x.en).title))),
        h('div', { class: 'row' }, langSel, h('span', { class: 'spacer' }),
          st.installed
            ? h('button', { type: 'button', class: 'danger', dataset: { act: 'uninstall' }, onclick: async () => {
              const r = await store.uninstallPack(pack.id); await O.reload();
              toast(t('packUninstalled', [String(r.removed), String(r.kept)]));
            } }, t('uninstall'))
            : h('button', { type: 'button', class: 'primary', dataset: { act: 'install' }, onclick: async () => {
              const r = await store.installPack(pack, langSel.value, PM.buildPackPrompts); await O.reload();
              toast(t('packInstalled', [String(r.added), String(r.skipped)]));
            } }, t('install'))));
    }));
  }
  function toast(msg) {
    let el = $('pmToast');
    if (!el) { el = h('div', { id: 'pmToast', class: 'banner', role: 'status' }); $('tab-packs').prepend(el); }
    el.textContent = msg;
  }

  const STATUS_KIND = { ok: 'ok', 'ok-near-quota': 'warn', pending: 'warn', 'waiting-remote': 'warn', backoff: 'warn', 'over-quota': 'err', 'remote-corrupt': 'err', error: 'err', unavailable: 'err', disabled: '' };
  async function renderSync() {
    const data = O.data;
    const s = data.settings.sync || {};
    $('syncEnabled').checked = !!s.enabled;
    const pill = document.querySelector('.top .pill');
    pill.textContent = t(s.enabled ? 'syncedPill' : 'localOnly');
    $('syncAdapter').value = s.adapter || 'chrome-sync';
    const st = (await chrome.storage.local.get([PM.STATE_KEY]))[PM.STATE_KEY] || {};
    const status = s.enabled ? (st.status || 'never') : 'disabled';
    const box = $('syncStatus');
    box.className = 'statusbox ' + (STATUS_KIND[status] || '');
    const statusKey = 'syncStatus_' + status.replace(/-/g, '_');
    const lines = [t(statusKey)];
    if (st.message && status !== 'ok') lines.push(st.message);
    if (s.enabled && st.lastSyncAt) lines.push(t('syncLast', [new Date(st.lastSyncAt).toLocaleString()]));
    if (st.stats && (st.stats.added || st.stats.updated || st.stats.deleted || st.stats.conflicts)) {
      lines.push(t('syncStats', [String(st.stats.added), String(st.stats.updated), String(st.stats.deleted), String(st.stats.conflicts)]));
    }
    box.replaceChildren(...lines.map((x, i) => (i ? h('div', { class: 'small muted' }, x) : h('strong', {}, x))));
    const budget = st.budget || PM.PAYLOAD_BUDGET;
    const ratio = st.bytes ? st.bytes / budget : 0;
    const bar = $('syncMeter');
    bar.style.width = Math.min(100, Math.round(ratio * 100)) + '%';
    bar.className = ratio > 1 ? 'err' : ratio > PM.WARN_RATIO ? 'warn' : '';
    $('syncUsage').textContent = st.bytes ? t('syncUsage', [(st.bytes / 1024).toFixed(1), (budget / 1024).toFixed(0), String(Math.round(ratio * 100))]) : '';
    $('syncNow').disabled = !s.enabled;
    $('syncReset').disabled = !s.enabled;
    renderConflicts();
  }

  $('syncEnabled').addEventListener('change', async (e) => {
    await store.setSettings({ sync: { enabled: e.target.checked } });
    await O.reload();
    if (e.target.checked) await chrome.runtime.sendMessage({ type: 'PM_SYNC_NOW', force: true }).catch(() => {});
    renderSync();
  });
  $('syncAdapter').addEventListener('change', async (e) => { await store.setSettings({ sync: { adapter: e.target.value } }); await O.reload(); });
  $('syncNow').addEventListener('click', async () => {
    $('syncNow').disabled = true;
    await chrome.runtime.sendMessage({ type: 'PM_SYNC_NOW', force: true }).catch(() => {});
    await O.reload(); renderSync();
  });
  $('syncReset').addEventListener('click', async () => {
    if (!confirm(t('confirmSyncReset'))) return;
    await chrome.runtime.sendMessage({ type: 'PM_SYNC_RESET_REMOTE' }).catch(() => {});
    await O.reload(); renderSync();
  });

  function renderDiffInto(el, a, b, mode) {
    const nodes = [];
    if (mode === 'lines') {
      for (const l of PM.diffLines(a, b)) nodes.push(h('div', { class: 'l ' + l.op }, (l.op === 'add' ? '+ ' : l.op === 'del' ? '− ' : '  ') + l.text));
    } else {
      for (const l of PM.diffRich(a, b)) {
        if (l.op === 'mod') nodes.push(h('div', { class: 'l' }, l.words.map((w) => (w.op === 'eq' ? w.text : h(w.op === 'add' ? 'ins' : 'del', {}, w.text)))));
        else nodes.push(h('div', { class: 'l ' + l.op }, l.op === 'eq' ? (l.text || '\u00a0') : h(l.op === 'add' ? 'ins' : 'del', {}, l.text || '\u00a0')));
      }
    }
    el.replaceChildren(...nodes);
  }

  function renderConflicts() {
    const list = store.listConflicts(O.data);
    $('conflictBanner').hidden = list.length === 0;
    $('conflictBannerText').textContent = t('conflictBanner', [String(list.length)]);
    $('conflictList').replaceChildren(...(list.length ? list.map(({ main, copy }) => {
      const meta = (p) => t('conflictMeta', [new Date(p.updatedAt).toLocaleString(), p.deviceId || '?']);
      const diff = h('div', { class: 'diff' });
      renderDiffInto(diff, main ? main.body : '', copy.body, 'words');
      const act = (choice) => async () => { await store.resolveConflict(copy.id, choice); await O.reload(); renderSync(); };
      return h('div', { class: 'conflict', dataset: { copy: copy.id } },
        h('h4', {}, copy.title),
        h('div', { class: 'sides' },
          h('div', {}, h('strong', { class: 'small' }, t('conflictMain')), h('div', { class: 'small muted' }, main ? meta(main) : '—'), h('pre', {}, main ? main.body : '')),
          h('div', {}, h('strong', { class: 'small' }, t('conflictCopy')), h('div', { class: 'small muted' }, meta(copy)), h('pre', {}, copy.body))),
        h('div', { class: 'small muted' }, t('conflictDiff')), diff,
        h('div', { class: 'row actions' },
          h('button', { type: 'button', dataset: { choice: 'main' }, onclick: act('main') }, t('keepMain')),
          h('button', { type: 'button', dataset: { choice: 'copy' }, onclick: act('copy') }, t('keepCopy')),
          h('button', { type: 'button', dataset: { choice: 'both' }, onclick: act('both') }, t('keepBoth'))));
    }) : [h('p', { class: 'muted small' }, t('noConflicts'))]));
  }
  $('conflictBannerBtn').addEventListener('click', () => O.showTab('sync'));

  let hist = { id: null, list: [], v: null };
  const dlg = $('histDialog');
  $('histBtn').addEventListener('click', () => openHistory(O.selectedId));
  $('histClose').addEventListener('click', () => dlg.close());
  document.querySelectorAll('input[name=dmode]').forEach((r) => r.addEventListener('change', showVersion));

  async function openHistory(id) {
    if (!id) return;
    const p = O.data.prompts.find((x) => x.id === id);
    hist = { id, list: (await store.listHistory(id)).slice().reverse(), v: null };
    $('histTitle').textContent = t('historyOf', [p ? p.title : id]);
    $('histList').replaceChildren(
      h('li', { class: 'cur' }, h('span', {}, t('currentVersion')), h('span', { class: 'r' }, p ? new Date(p.updatedAt).toLocaleString() : '')),
      ...hist.list.map((e) => h('li', { dataset: { v: String(e.v) }, onclick: () => { hist.v = e.v; showVersion(); } },
        h('span', {}, 'v' + e.v + ' · ' + e.title), h('span', { class: 'r' }, new Date(e.at).toLocaleString() + ' · ' + reasonLabel(e.reason)))));
    hist.v = hist.list.length ? hist.list[0].v : null;
    showVersion();
    if (!dlg.open) dlg.showModal();
  }
  function reasonLabel(r) { const k = 'reason_' + String(r).replace(/[^a-z]/g, '_'); const m = t(k); return m === k ? r : m; }

  function showVersion() {
    const p = O.data.prompts.find((x) => x.id === hist.id);
    const e = hist.list.find((x) => x.v === hist.v);
    document.querySelectorAll('#histList li').forEach((li) => li.classList.toggle('active', li.dataset.v === String(hist.v)));
    $('histRestore').disabled = !e;
    if (!e) { $('histDiff').replaceChildren(h('p', { class: 'muted' }, t('noHistory'))); $('histCompare').textContent = ''; $('histMeta').textContent = ''; return; }
    const mode = document.querySelector('input[name=dmode]:checked').value;
    const a = 'Title: ' + e.title + '\nFolder: ' + (e.folder || '—') + '\nTags: ' + (e.tags || []).join(', ') + '\n\n' + e.body;
    const b = p ? 'Title: ' + p.title + '\nFolder: ' + (p.folder || '—') + '\nTags: ' + (p.tags || []).join(', ') + '\n\n' + p.body : '';
    renderDiffInto($('histDiff'), a, b, mode);
    const st = PM.diffStats(a, b);
    $('histCompare').textContent = t('compareWithCurrent', ['v' + e.v]);
    $('histMeta').textContent = t('diffSummary', [String(st.added), String(st.removed)]) + ' · ' + (e.deviceId || '');
  }
  $('histRestore').addEventListener('click', async () => {
    if (hist.v == null) return;
    await store.restoreVersion(hist.id, hist.v);
    await O.reload();
    O.select(hist.id);
    await openHistory(hist.id);
  });

  function render() { renderPacks(); renderConflicts(); }
  window.PMPro = {
    render, renderSync,
    onTab(name) { if (name === 'packs') renderPacks(); if (name === 'sync') renderSync(); },
  };
  render();
  renderSync();
}
if (window.PMOptions) pmProInit(); else window.addEventListener('pm-options-ready', pmProInit, { once: true });
