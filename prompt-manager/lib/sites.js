(function (root) {
  'use strict';
  const PM = (root.PM = root.PM || {});

  const SITES = [
    {
      id: 'chatgpt', name: 'ChatGPT', hosts: ['chatgpt.com', 'chat.openai.com'],
      selectors: ['#prompt-textarea[contenteditable="true"]', 'div.ProseMirror[contenteditable="true"]', 'textarea#prompt-textarea', 'textarea[data-id="root"]', 'form textarea'],
    },
    {
      id: 'claude', name: 'Claude', hosts: ['claude.ai'],
      selectors: ['div.ProseMirror[contenteditable="true"]', 'fieldset [contenteditable="true"]', '[contenteditable="true"][aria-label*="prompt" i]', 'textarea'],
    },
    {
      id: 'gemini', name: 'Gemini', hosts: ['gemini.google.com'],
      selectors: ['rich-textarea .ql-editor[contenteditable="true"]', 'div.ql-editor[contenteditable="true"]', '[contenteditable="true"][role="textbox"]', 'textarea'],
    },
    {
      id: 'grok', name: 'Grok', hosts: ['grok.com'],
      selectors: ['form textarea[aria-label]', 'div.tiptap.ProseMirror[contenteditable="true"]', 'div.ProseMirror[contenteditable="true"]', 'form textarea', 'textarea'],
    },
    {
      id: 'x-grok', name: 'Grok (X)', hosts: ['x.com'], pathPrefix: '/i/grok',
      selectors: ['textarea[placeholder]', 'textarea', '[contenteditable="true"][role="textbox"]'],
    },
  ];

  function detectSite(loc) {
    const host = String(loc.hostname || '').toLowerCase();
    const path = String(loc.pathname || '/');
    return SITES.find((s) => s.hosts.some((h) => host === h || host.endsWith('.' + h)) && (!s.pathPrefix || path.startsWith(s.pathPrefix))) || null;
  }

  function isTextField(el) {
    if (!el || el.disabled || el.readOnly) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && /^(text|search|)$/i.test(el.type || '');
  }

  function editableHost(node) {
    let el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el) return null;
    if (isTextField(el)) return el;
    if (!el.isContentEditable) return null;
    while (el.parentElement && el.parentElement.isContentEditable) el = el.parentElement;
    return el;
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  function findInput(site, doc, preferred) {
    const d = doc || document;
    const pref = editableHost(preferred);
    if (pref && isVisible(pref)) return pref;
    for (const sel of (site && site.selectors) || []) {
      const els = [...d.querySelectorAll(sel)].map(editableHost).filter((e) => e && isVisible(e));
      if (els.length) return els[els.length - 1];
    }

    const all = [...d.querySelectorAll('textarea, [contenteditable="true"], [contenteditable=""]')]
      .map(editableHost).filter((e) => e && isVisible(e));
    all.sort((a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom);
    return all.length ? all[all.length - 1] : null;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  function contains(el, text) {
    const hay = norm(isTextField(el) ? el.value : el.innerText);
    const needle = norm(text);
    return needle.length === 0 || hay.includes(needle.slice(0, 200));
  }

  function caretToEndIfOutside(el) {
    const sel = el.ownerDocument.getSelection();
    if (sel && sel.rangeCount && el.contains(sel.anchorNode)) return;
    const range = el.ownerDocument.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function withSeparator(before, text) {
    return before && /\S$/.test(before) && !/^\s/.test(text) ? '\n\n' + text : text;
  }

  function textBeforeCaret(el) {
    const sel = el.ownerDocument.getSelection();
    if (!sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return '';
    const r = el.ownerDocument.createRange();
    r.setStart(el, 0);
    r.setEnd(sel.anchorNode, sel.anchorOffset);
    return r.toString();
  }

  async function insertText(el, rawText) {
    const doc = el.ownerDocument;
    let text = rawText;
    el.focus();
    if (isTextField(el)) {
      text = withSeparator(el.value.slice(0, el.selectionStart ?? el.value.length), rawText);
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const expected = el.value.slice(0, start) + text + el.value.slice(end);
      let ok = false;
      try { ok = doc.execCommand('insertText', false, text); } catch (_) { ok = false; }
      if (ok && el.value === expected) return { ok: true, method: 'execCommand' };
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, expected);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      try { el.setSelectionRange(start + text.length, start + text.length); } catch (_) {  }
      return { ok: el.value === expected, method: 'value-setter' };
    }

    caretToEndIfOutside(el);
    await sleep(30);
    text = withSeparator(textBeforeCaret(el), rawText);
    const before = norm(el.innerText);
    const changed = () => norm(el.innerText) !== before;

    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      el.dispatchEvent(ev);
      if (ev.defaultPrevented) {
        await sleep(50);
        if (contains(el, text) || changed()) return { ok: true, method: 'paste' };
      }
    } catch (_) {  }

    let ok = false;
    try { ok = doc.execCommand('insertText', false, text); } catch (_) { ok = false; }
    await sleep(30);
    if (ok && (contains(el, text) || changed())) return { ok: true, method: 'execCommand' };

    const bi = new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text });
    el.dispatchEvent(bi);
    if (!bi.defaultPrevented) {
      el.appendChild(doc.createTextNode(text));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
    await sleep(30);
    return { ok: contains(el, text), method: 'manual' };
  }

  Object.assign(PM, { SITES, detectSite, isTextField, editableHost, isVisible, findInput, insertText });
})(typeof self !== 'undefined' ? self : this);
