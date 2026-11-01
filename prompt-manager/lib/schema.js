(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCHEMA_VERSION = 2;
  const PROMPT_VERSION = 2;
  const TOMBSTONE_TTL_DAYS = 30;
  const LIMITS = Object.freeze({
    title: 200,
    body: 100000,
    tag: 40,
    tags: 20,
    folder: 60,
    prompts: 10000,
  });
  const DEFAULT_SETTINGS = Object.freeze({
    floatingButton: true,
    lastExportAt: null,
    backupReminderDays: 7,
    historyMaxVersions: 50,
    historyMaxDays: 365,
    sync: { enabled: false, adapter: 'chrome-sync' },
  });

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function nowISO() { return new Date().toISOString(); }

  function emptyData() {
    return { schemaVersion: SCHEMA_VERSION, prompts: [], folders: [], tombstones: [], packs: {}, settings: cloneSettings(DEFAULT_SETTINGS) };
  }

  function cloneSettings(s) { return JSON.parse(JSON.stringify(s)); }

  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }

  const CONTENT_FIELDS = ['title', 'body', 'folder', 'tags'];
  function sortedTags(t) { return [...(t || [])].map((x) => x.toLocaleLowerCase()).sort(); }
  function contentKey(p) { return JSON.stringify([p.title, p.body, p.folder || '', sortedTags(p.tags)]); }
  function contentHash(p) { return fnv1a(contentKey(p)); }
  function sameContent(a, b) { return contentKey(a) === contentKey(b); }
  function fieldEqual(f, a, b) {
    if (f === 'tags') return JSON.stringify(sortedTags(a)) === JSON.stringify(sortedTags(b));
    return (a || '') === (b || '');
  }

  function isPristinePack(p) { return !!(p && p.packId && p.packHash && p.packHash === contentHash(p)); }

  function isISODate(s) { return typeof s === 'string' && !Number.isNaN(Date.parse(s)); }

  function cleanFolder(f) {
    if (typeof f !== 'string') return '';
    return f.replace(/\s+/g, ' ').trim().slice(0, LIMITS.folder);
  }

  function cleanTags(tags) {
    let list = tags;
    if (typeof list === 'string') list = list.split(',');
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const tag = raw.replace(/\s+/g, ' ').trim().replace(/^#/, '').slice(0, LIMITS.tag);
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) continue;
      seen.add(key);
      out.push(tag);
      if (out.length >= LIMITS.tags) break;
    }
    return out;
  }

  function validatePrompt(p) {
    const errors = [];
    if (!p || typeof p !== 'object' || Array.isArray(p)) return ['not an object'];
    if (typeof p.title !== 'string' || !p.title.trim()) errors.push('title missing');
    else if (p.title.length > LIMITS.title) errors.push('title longer than ' + LIMITS.title);
    if (typeof p.body !== 'string') errors.push('body must be a string');
    else if (p.body.length > LIMITS.body) errors.push('body longer than ' + LIMITS.body);
    if (p.folder != null && typeof p.folder !== 'string') errors.push('folder must be a string');
    if (p.tags != null && !Array.isArray(p.tags) && typeof p.tags !== 'string') errors.push('tags must be an array');
    if (p.id != null && (typeof p.id !== 'string' || !p.id || p.id.length > 100)) errors.push('invalid id');
    if (p.createdAt != null && !isISODate(p.createdAt)) errors.push('invalid createdAt');
    if (p.updatedAt != null && !isISODate(p.updatedAt)) errors.push('invalid updatedAt');
    if (p.rev != null && (!Number.isInteger(p.rev) || p.rev < 0)) errors.push('invalid rev');
    for (const k of ['deviceId', 'packId', 'packTplId', 'packHash', 'conflictOf']) {
      if (p[k] != null && (typeof p[k] !== 'string' || p[k].length > 200)) errors.push('invalid ' + k);
    }
    return errors;
  }

  function normalizePrompt(p) {
    const ts = nowISO();
    const createdAt = isISODate(p.createdAt) ? new Date(p.createdAt).toISOString() : ts;
    const updatedAt = isISODate(p.updatedAt) ? new Date(p.updatedAt).toISOString() : createdAt;
    return {
      id: typeof p.id === 'string' && p.id ? p.id : uid(),
      title: p.title.trim().slice(0, LIMITS.title),
      body: p.body,
      folder: cleanFolder(p.folder),
      tags: cleanTags(p.tags),
      createdAt,
      updatedAt,
      version: PROMPT_VERSION,
      rev: Number.isInteger(p.rev) && p.rev > 0 ? p.rev : 1,
      deviceId: typeof p.deviceId === 'string' ? p.deviceId : '',
      packId: typeof p.packId === 'string' && p.packId ? p.packId : null,
      packTplId: typeof p.packTplId === 'string' && p.packTplId ? p.packTplId : null,
      packHash: typeof p.packHash === 'string' && p.packHash ? p.packHash : null,
      conflictOf: typeof p.conflictOf === 'string' && p.conflictOf ? p.conflictOf : null,
    };
  }

  function cleanTombstones(list, now) {
    const cutoff = (now || Date.now()) - TOMBSTONE_TTL_DAYS * 864e5;
    const byId = new Map();
    for (const t of Array.isArray(list) ? list : []) {
      if (!t || typeof t.id !== 'string' || !isISODate(t.deletedAt)) continue;
      if (Date.parse(t.deletedAt) < cutoff) continue;
      const n = { id: t.id, deletedAt: new Date(t.deletedAt).toISOString(), rev: Number.isInteger(t.rev) ? t.rev : 0, deviceId: typeof t.deviceId === 'string' ? t.deviceId : '', hash: typeof t.hash === 'string' ? t.hash : '' };
      const prev = byId.get(n.id);
      if (!prev || n.rev > prev.rev || (n.rev === prev.rev && n.deletedAt > prev.deletedAt)) byId.set(n.id, n);
    }
    return [...byId.values()];
  }

  function cleanPacks(p) {
    const out = {};
    if (!p || typeof p !== 'object') return out;
    for (const [k, v] of Object.entries(p)) {
      if (!v || typeof v !== 'object' || !isISODate(v.at)) continue;
      out[k] = { installed: !!v.installed, lang: v.lang === 'tr' ? 'tr' : 'en', at: new Date(v.at).toISOString() };
    }
    return out;
  }

  function collectFolders(prompts, folders) {
    const set = new Set();
    for (const f of folders || []) { const c = cleanFolder(f); if (c) set.add(c); }
    for (const p of prompts) if (p.folder) set.add(p.folder);
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  const MIGRATIONS = {
    0: (d) => {
      const list = Array.isArray(d) ? d : (d && Array.isArray(d.prompts) ? d.prompts : []);
      const prompts = list.map((p) => {
        if (!p || typeof p !== 'object') return p;
        const q = { ...p };
        if (q.body == null && typeof q.text === 'string') q.body = q.text;
        if (q.body == null && typeof q.prompt === 'string') q.body = q.prompt;
        if (q.title == null && typeof q.name === 'string') q.title = q.name;
        delete q.text; delete q.prompt; delete q.name;
        return q;
      });
      return { schemaVersion: 1, prompts, folders: (d && d.folders) || [], settings: (d && d.settings) || {} };
    },

    1: (d) => ({ ...d, schemaVersion: 2, tombstones: [], packs: {} }),
  };

  function migrate(input) {
    if (input == null) return { data: emptyData(), migrated: false, invalid: [] };
    let d = input;
    let from = Array.isArray(d) ? 0 : (typeof d.schemaVersion === 'number' ? d.schemaVersion : 0);
    if (from > SCHEMA_VERSION) {
      throw new Error('Data uses schema v' + from + ', this version supports up to v' + SCHEMA_VERSION + '. Please update the extension.');
    }
    const migrated = from !== SCHEMA_VERSION;
    while (from < SCHEMA_VERSION) { d = MIGRATIONS[from](d); from += 1; }

    const invalid = [];
    const prompts = [];
    const ids = new Set();
    (Array.isArray(d.prompts) ? d.prompts : []).forEach((p, index) => {
      const errs = validatePrompt(p);
      if (errs.length) { invalid.push({ index, errors: errs, raw: p }); return; }
      const n = normalizePrompt(p);
      if (ids.has(n.id)) n.id = uid();
      ids.add(n.id);
      prompts.push(n);
    });
    const given = d.settings && typeof d.settings === 'object' ? d.settings : {};
    const settings = { ...cloneSettings(DEFAULT_SETTINGS), ...given, sync: { ...DEFAULT_SETTINGS.sync, ...(given.sync && typeof given.sync === 'object' ? given.sync : {}) } };
    return {
      data: { schemaVersion: SCHEMA_VERSION, prompts, folders: collectFolders(prompts, d.folders), tombstones: cleanTombstones(d.tombstones), packs: cleanPacks(d.packs), settings },
      migrated,
      invalid,
    };
  }

  return { SCHEMA_VERSION, PROMPT_VERSION, TOMBSTONE_TTL_DAYS, CONTENT_FIELDS, fnv1a, contentKey, contentHash, sameContent, fieldEqual, isPristinePack, cleanTombstones, cleanPacks, LIMITS, DEFAULT_SETTINGS, uid, nowISO, emptyData, cleanTags, cleanFolder, validatePrompt, normalizePrompt, collectFolders, migrate };
});
