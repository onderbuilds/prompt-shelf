(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VAR_RE = /(\\?)\{\{\s*([\p{L}\p{N}_\- ]{1,60}?)\s*(?:\|([^{}]{0,500}))?\}\}/gu;

  function parseVariables(body) {
    const out = [];
    const seen = new Map();
    if (typeof body !== 'string') return out;
    for (const m of body.matchAll(VAR_RE)) {
      if (m[1] === '\\') continue;
      const name = m[2].trim();
      if (!name) continue;
      const key = name.toLocaleLowerCase();
      const def = m[3] !== undefined ? m[3].trim() : undefined;
      if (seen.has(key)) {
        const v = seen.get(key);
        if (v.default === undefined && def !== undefined) v.default = def;
        continue;
      }
      const v = { name, default: def };
      seen.set(key, v);
      out.push(v);
    }
    return out;
  }

  function fillTemplate(body, values) {
    if (typeof body !== 'string') return '';
    const vals = {};
    for (const [k, v] of Object.entries(values || {})) vals[k.trim().toLocaleLowerCase()] = v;
    return body.replace(VAR_RE, (whole, esc, name, def) => {
      if (esc === '\\') return whole.slice(1);
      const key = name.trim().toLocaleLowerCase();
      const v = vals[key];
      if (v !== undefined && v !== null && String(v) !== '') return String(v);
      return def !== undefined ? def.trim() : '';
    });
  }

  function hasVariables(body) { return parseVariables(body).length > 0; }

  return { parseVariables, fillTemplate, hasVariables };
});
