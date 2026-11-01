(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DRIVE_ADAPTER_ENABLED = false;
  const DRIVE_CLIENT_ID = null;

  function createDriveAppDataAdapter() {
    const notConfigured = async () => { const e = new Error('Google Drive adapter is not configured (no OAuth client ID)'); e.code = 'not-configured'; throw e; };
    return {
      id: 'google-drive',
      label: 'Google Drive (appDataFolder) — not available yet',
      budget: 5 * 1024 * 1024,
      enabled: DRIVE_ADAPTER_ENABLED && !!DRIVE_CLIENT_ID,
      async available() { return DRIVE_ADAPTER_ENABLED && !!DRIVE_CLIENT_ID; },
      read: notConfigured,
      write: notConfigured,
      async usage() { return { bytesInUse: 0, quotaBytes: 0 }; },
      onRemoteChange() { return () => {}; },
    };
  }
  return { DRIVE_ADAPTER_ENABLED, createDriveAppDataAdapter };
});
