(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function fold(s) {
    return String(s || '')
      .toLocaleLowerCase('tr')
      .replace(/ı/g, 'i')
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
  }

  function searchPrompts(prompts, opts) {
    const o = opts || {};
    const tokens = fold(o.query).split(/\s+/).filter(Boolean);
    const tagF = o.tag ? fold(o.tag) : null;
    const out = [];
    for (const p of prompts || []) {
      if (o.folder === '__none__' ? p.folder : (o.folder && p.folder !== o.folder)) continue;
      const tags = (p.tags || []).map(fold);
      if (tagF && !tags.includes(tagF)) continue;
      const title = fold(p.title);
      const hay = title + '\n' + fold(p.body) + '\n' + fold(p.folder) + '\n' + tags.join(' ');
      let score = 0;
      let ok = true;
      for (const tok of tokens) {
        if (tok.startsWith('#') && tok.length > 1) {
          if (!tags.some((t) => t.includes(tok.slice(1)))) { ok = false; break; }
          score += 2;
        } else if (title.includes(tok)) score += 3;
        else if (tags.some((t) => t.includes(tok))) score += 2;
        else if (hay.includes(tok)) score += 1;
        else { ok = false; break; }
      }
      if (ok) out.push({ p, score });
    }
    out.sort((a, b) => b.score - a.score || String(b.p.updatedAt).localeCompare(String(a.p.updatedAt)));
    return out.map((x) => x.p);
  }

  function listTags(prompts) {
    const map = new Map();
    for (const p of prompts || []) for (const t of p.tags || []) {
      const k = t.toLocaleLowerCase();
      if (!map.has(k)) map.set(k, { tag: t, count: 0 });
      map.get(k).count += 1;
    }
    return [...map.values()].sort((a, b) => a.tag.localeCompare(b.tag));
  }

  return { fold, searchPrompts, listTags };
});
