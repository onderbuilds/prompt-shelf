(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LICENSE_FEATURE_ENABLED = false;
  const LS_API = 'https://api.lemonsqueezy.com/v1/licenses';
  const EXPECTED_STORE_ID = null;
  const EXPECTED_PRODUCT_ID = null;
  const LICENSE_KEY = 'pm_license';
  const FREE_FOLDER_LIMIT = 10;

  const PLAN = Object.freeze({
    free: ['unlimited prompts', 'one-click insert on all 4 sites', '{{variable}} templates', 'search, tags', `up to ${FREE_FOLDER_LIMIT} folders`, 'JSON import/export', 'automatic backups + restore'],
    pro: ['cross-device sync (your own Chrome sync)', 'built-in prompt packs (code, marketing, crypto research, writing)', 'version history with diff + restore', 'unlimited folders', 'backup reminders'],
  });

  function createLicenseClient(opts) {
    const o = opts || {};
    const enabled = o.enabled !== undefined ? !!o.enabled : LICENSE_FEATURE_ENABLED;
    const fetchImpl = o.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    const area = o.area || null;

    async function post(path, params) {
      if (!enabled) return { ok: false, reason: 'disabled' };
      if (!fetchImpl) return { ok: false, reason: 'no-fetch' };
      const body = new URLSearchParams(params).toString();
      let res;
      try {
        res = await fetchImpl(LS_API + '/' + path, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          credentials: 'omit',
        });
      } catch (e) { return { ok: false, reason: 'network', message: String(e && e.message) }; }
      let json = null;
      try { json = await res.json(); } catch {  }
      if (!json) return { ok: false, reason: 'bad-response', status: res.status };
      if (EXPECTED_STORE_ID && json.meta && json.meta.store_id !== EXPECTED_STORE_ID) return { ok: false, reason: 'wrong-store' };
      if (EXPECTED_PRODUCT_ID && json.meta && json.meta.product_id !== EXPECTED_PRODUCT_ID) return { ok: false, reason: 'wrong-product' };
      return { ok: res.ok, status: res.status, json };
    }

    async function activate(licenseKey, instanceName) {
      if (!enabled) return { ok: false, reason: 'disabled' };
      if (typeof licenseKey !== 'string' || !/^[A-Za-z0-9-]{8,100}$/.test(licenseKey.trim())) return { ok: false, reason: 'invalid-key-format' };
      const r = await post('activate', { license_key: licenseKey.trim(), instance_name: instanceName || 'browser' });
      if (!r.ok || !r.json || !r.json.activated) return { ok: false, reason: (r.json && r.json.error) || r.reason || 'not-activated' };
      const state = { key: licenseKey.trim(), instanceId: r.json.instance && r.json.instance.id, status: r.json.license_key && r.json.license_key.status, checkedAt: new Date().toISOString() };
      if (area) await area.set({ [LICENSE_KEY]: state });
      return { ok: true, state };
    }

    async function validate(state) {
      if (!enabled) return { ok: false, reason: 'disabled' };
      if (!state || !state.key) return { ok: false, reason: 'no-license' };
      const params = { license_key: state.key };
      if (state.instanceId) params.instance_id = state.instanceId;
      const r = await post('validate', params);
      const valid = !!(r.ok && r.json && r.json.valid);
      return { ok: valid, reason: valid ? undefined : ((r.json && r.json.error) || r.reason || 'invalid'), status: r.json && r.json.license_key && r.json.license_key.status };
    }

    async function getState() {
      if (!area) return null;
      const r = await area.get([LICENSE_KEY]);
      return (r && r[LICENSE_KEY]) || null;
    }

    async function isPro() {
      if (!enabled) return true;
      const s = await getState();
      return !!(s && s.status === 'active');
    }

    async function canUse(feature, ctx) {
      if (await isPro()) return true;
      if (feature === 'folders') return ((ctx && ctx.folderCount) || 0) < FREE_FOLDER_LIMIT;
      if (feature === 'backupReminders') return false;
      return true;
    }

    return { enabled, activate, validate, getState, isPro, canUse };
  }

  return { LICENSE_FEATURE_ENABLED, LS_API, FREE_FOLDER_LIMIT, PLAN, createLicenseClient };
});
