(() => {
  'use strict';
  if (window.__pmContentLoaded) return;
  window.__pmContentLoaded = true;
  const PM = globalThis.PM;
  const site = PM.detectSite(location);
  const MAX_TEXT = 200000;

  let lastEditable = null;
  let host = null;
  let shadow = null;
  let frame = null;
  let showButton = true;

  const t = (k) => { try { return chrome.i18n.getMessage(k) || k; } catch (_) { return k; } };

  document.addEventListener('focusin', (e) => {
    const el = PM.editableHost(e.composedPath()[0]);
    if (el && (!host || !host.contains(el))) lastEditable = el;
  }, true);

  function ensureHost() {
    if (host) { if (!host.isConnected) document.documentElement.appendChild(host); return; }
    host = document.createElement('div');
    host.id = 'pm-local-prompt-manager';
    host.style.cssText = 'all:initial;position:fixed;z-index:2147483646;right:18px;bottom:110px;';
    shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .btn{width:36px;height:36px;border-radius:50%;border:1px solid #d0d4dc;background:#fff;color:#1f2937;
        font:600 15px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center}
      .btn:hover{background:#f3f4f6}
      .btn[hidden]{display:none}
      iframe{position:absolute;right:0;bottom:44px;width:360px;height:480px;border:1px solid #d0d4dc;border-radius:12px;
        background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.2);color-scheme:normal}`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.type = 'button';
    btn.textContent = '✎';
    btn.title = t('openPanel');
    btn.setAttribute('aria-label', t('openPanel'));
    btn.dataset.pm = 'toggle';
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', togglePanel);
    shadow.append(style, btn);
    document.documentElement.appendChild(host);
    applyButtonSetting();
  }

  function applyButtonSetting() {
    if (!shadow) return;
    shadow.querySelector('.btn').hidden = !showButton && !frame;
  }

  function openPanel() {
    ensureHost();
    if (frame) return;
    frame = document.createElement('iframe');
    frame.src = chrome.runtime.getURL('panel/panel.html?mode=embed');
    frame.setAttribute('allow', 'clipboard-write');
    frame.title = t('extName');
    shadow.appendChild(frame);
    applyButtonSetting();
  }

  function closePanel() {
    if (!frame) return;
    frame.remove();
    frame = null;
    applyButtonSetting();
    if (lastEditable && lastEditable.isConnected) lastEditable.focus();
  }

  function togglePanel() { if (frame) closePanel(); else openPanel(); }

  async function handleInsert(text) {
    if (typeof text !== 'string' || text.length > MAX_TEXT) return { ok: false, reason: 'bad-text' };
    const el = PM.findInput(site, document, lastEditable);
    if (!el) return { ok: false, reason: 'no-input' };
    try {
      const res = await PM.insertText(el, text);
      if (res.ok) closePanel();
      return res;
    } catch (e) {
      return { ok: false, reason: 'error', message: String(e && e.message) };
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (sender.id !== chrome.runtime.id || !msg || typeof msg.type !== 'string') return undefined;
    if (msg.type === 'PM_INSERT') { handleInsert(msg.text).then(sendResponse); return true; }
    if (msg.type === 'PM_TOGGLE_PANEL') { togglePanel(); sendResponse({ ok: true }); return undefined; }
    if (msg.type === 'PM_CLOSE_PANEL') { closePanel(); sendResponse({ ok: true }); return undefined; }
    if (msg.type === 'PM_PING') { sendResponse({ ok: true, site: site ? site.id : null }); return undefined; }
    return undefined;
  });

  async function readSetting() {
    try {
      const r = await chrome.storage.local.get(['pm_data']);
      const s = r && r.pm_data && r.pm_data.settings;
      showButton = !(s && s.floatingButton === false);
    } catch (_) { showButton = true; }
    applyButtonSetting();
  }
  chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.pm_data) readSetting(); });

  if (site) {
    ensureHost();
    readSetting();
    setInterval(() => { if (host && !host.isConnected) document.documentElement.appendChild(host); }, 2000);
  }
})();
