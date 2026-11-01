(function (root) {
  'use strict';
  const PM = (root.PM = root.PM || {});
  function t(key, subs) {
    try { return chrome.i18n.getMessage(key, subs) || key; } catch (_) { return key; }
  }
  function applyI18n(scope) {
    const r = scope || document;
    r.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    r.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    r.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    try { document.documentElement.lang = chrome.i18n.getUILanguage().split('-')[0]; } catch (_) {  }
  }

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
    return el;
  }
  Object.assign(PM, { t, applyI18n, h });
})(typeof self !== 'undefined' ? self : this);
