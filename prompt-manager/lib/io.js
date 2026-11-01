(function (root, factory) {
  const schema = (typeof module === 'object' && module.exports) ? require('./schema.js') : root.PM;
  const mod = factory(schema);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function (S) {
  'use strict';

  const APP_ID = 'local-prompt-manager';
  const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

  function exportJSON(data) {
    const payload = {
      app: APP_ID,
      schemaVersion: S.SCHEMA_VERSION,
      exportedAt: S.nowISO(),
      prompts: data.prompts,
      folders: data.folders,
    };
    return JSON.stringify(payload, null, 2);
  }

  function parseImport(text) {
    if (typeof text !== 'string') return { ok: false, error: 'empty file', prompts: [], folders: [], invalid: [] };
    if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'file larger than 5 MB', prompts: [], folders: [], invalid: [] };
    let raw;
    try { raw = JSON.parse(text.replace(/^\uFEFF/, '')); } catch (e) {
      return { ok: false, error: 'not valid JSON: ' + e.message, prompts: [], folders: [], invalid: [] };
    }
    if (!Array.isArray(raw) && (!raw || typeof raw !== 'object' || !Array.isArray(raw.prompts))) {
      return { ok: false, error: 'expected an array of prompts or an object with a "prompts" array', prompts: [], folders: [], invalid: [] };
    }
    let res;
    try { res = S.migrate(raw); } catch (e) {
      return { ok: false, error: e.message, prompts: [], folders: [], invalid: [] };
    }
    const count = Array.isArray(raw) ? raw.length : raw.prompts.length;
    if (count > S.LIMITS.prompts) return { ok: false, error: 'more than ' + S.LIMITS.prompts + ' prompts', prompts: [], folders: [], invalid: [] };
    const invalid = res.invalid.map(({ index, errors }) => ({ index, errors }));
    if (res.data.prompts.length === 0) {
      return { ok: false, error: invalid.length ? 'no valid prompts in file' : 'file contains no prompts', prompts: [], folders: res.data.folders, invalid };
    }
    return { ok: true, prompts: res.data.prompts, folders: res.data.folders, invalid };
  }

  const sameContent = S.sameContent;

  function mergeImport(current, parsed) {
    const byId = new Map(current.prompts.map((p) => [p.id, p]));
    const prompts = current.prompts.slice();
    const stats = { added: 0, skipped: 0, conflicts: 0 };
    for (const inc of parsed.prompts) {
      const ex = byId.get(inc.id);
      if (!ex) { prompts.push(inc); byId.set(inc.id, inc); stats.added += 1; continue; }
      if (sameContent(ex, inc)) { stats.skipped += 1; continue; }
      const copy = { ...inc, id: S.uid() };
      prompts.push(copy); byId.set(copy.id, copy); stats.conflicts += 1;
    }
    if (prompts.length > S.LIMITS.prompts) throw new Error('import would exceed ' + S.LIMITS.prompts + ' prompts');
    return {
      data: { ...current, prompts, folders: S.collectFolders(prompts, current.folders.concat(parsed.folders || [])) },
      stats,
    };
  }

  function replaceImport(current, parsed) {
    return {
      data: { ...current, prompts: parsed.prompts.slice(), folders: S.collectFolders(parsed.prompts, parsed.folders || []) },
      stats: { added: parsed.prompts.length, skipped: 0, conflicts: 0, removed: current.prompts.length },
    };
  }

  return { APP_ID, MAX_IMPORT_BYTES, exportJSON, parseImport, mergeImport, replaceImport, sameContent };
});
