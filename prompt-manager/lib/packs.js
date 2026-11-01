(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const S = isNode ? require('./schema.js') : root.PM;
  const data = isNode ? ['code', 'marketing', 'crypto', 'writing'].map((n) => require('../packs/' + n + '.js')) : null;
  const mod = factory(S, () => (isNode ? data : (root.PM.PACK_DATA || [])));
  if (isNode) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function (S, getData) {
  'use strict';

  const ORDER = ['code', 'marketing', 'crypto', 'writing'];
  function listPacks() { return getData().slice().sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id)); }
  function getPack(id) { return listPacks().find((p) => p.id === id) || null; }
  const promptId = (packId, tplId) => 'pack.' + packId + '.' + tplId;

  function buildPackPrompts(pack, lang, nowISO, deviceId) {
    const L = lang === 'tr' ? 'tr' : 'en';
    const folder = pack.name[L] || pack.name.en;
    const ts = nowISO || new Date().toISOString();
    return pack.templates.map((t) => {
      const text = t[L] || t.en;
      const p = S.normalizePrompt({
        id: promptId(pack.id, t.id), title: text.title, body: text.body, folder, tags: ['pack:' + pack.id].concat(t.tags || []),
        createdAt: ts, updatedAt: ts, rev: 1, deviceId: deviceId || '', packId: pack.id, packTplId: t.id,
      });
      p.packHash = S.contentHash(p);
      return p;
    });
  }

  function packStatus(data, packId) {
    const st = (data.packs || {})[packId];
    const prompts = data.prompts.filter((p) => p.packId === packId);
    return { installed: !!(st && st.installed), lang: st ? st.lang : null, count: prompts.length, edited: prompts.filter((p) => !S.isPristinePack(p)).length };
  }

  return { listPacks, getPack, buildPackPrompts, packStatus, packPromptId: promptId };
});
