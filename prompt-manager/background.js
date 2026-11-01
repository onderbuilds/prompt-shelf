importScripts(
  'lib/schema.js', 'lib/io.js', 'lib/search.js', 'lib/store.js',
  'packs/code.js', 'packs/marketing.js', 'packs/crypto.js', 'packs/writing.js', 'lib/packs.js',
  'lib/sync.js', 'lib/sync-drive.js',
);

const PM = self.PM;
const store = PM.createStore(chrome.storage.local);

chrome.runtime.onInstalled.addListener(async (details) => {
  const data = await store.load();
  if (details.reason === 'install' && data.prompts.length === 0) {
    const samples = [
      { title: chrome.i18n.getMessage('sample1Title'), body: chrome.i18n.getMessage('sample1Body'), folder: chrome.i18n.getMessage('sampleFolder'), tags: ['writing'] },
      { title: chrome.i18n.getMessage('sample2Title'), body: chrome.i18n.getMessage('sample2Body'), folder: chrome.i18n.getMessage('sampleFolder'), tags: ['email', 'template'] },
      { title: chrome.i18n.getMessage('sample3Title'), body: chrome.i18n.getMessage('sample3Body'), folder: '', tags: ['code'] },
    ];
    for (const s of samples) await store.upsertPrompt(s);
  }
  chrome.alarms.create('pm-sync', { periodInMinutes: 5 });
});
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('pm-sync', { periodInMinutes: 5 }); schedule(3000); });

function makeEngine(settings) {
  const adapter = settings.sync && settings.sync.adapter === 'google-drive'
    ? PM.createDriveAppDataAdapter()
    : PM.createChromeSyncAdapter(chrome.storage.sync);
  return PM.createSyncEngine({ store, adapter, localArea: chrome.storage.local, registry: PM.listPacks(), build: PM.buildPackPrompts });
}
let chain = Promise.resolve();
async function runSync(opts) {
  const job = chain.then(async () => makeEngine((await store.load()).settings).syncNow(opts));
  chain = job.catch(() => {});
  return job;
}
let timer = null;
function schedule(ms) {
  clearTimeout(timer);
  timer = setTimeout(() => { runSync().catch(() => {}); }, ms);
}
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'pm-sync') runSync().catch(() => {}); });
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.pm_data) schedule(5000);
  if (area === 'sync' && Object.keys(changes).some((k) => k.startsWith('pms_'))) schedule(1500);
});

async function activeTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab && tab.id;
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-panel') return;
  const id = await activeTabId();
  if (id != null) chrome.tabs.sendMessage(id, { type: 'PM_TOGGLE_PANEL' }, { frameId: 0 }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !msg) return undefined;
  if (msg.type === 'PM_INSERT_REQUEST' || msg.type === 'PM_CLOSE_REQUEST') {
    const tabId = Number.isInteger(msg.tabId) ? msg.tabId : (sender.tab ? sender.tab.id : undefined);
    if (tabId == null) { sendResponse({ ok: false, reason: 'no-tab' }); return undefined; }
    const out = msg.type === 'PM_INSERT_REQUEST' ? { type: 'PM_INSERT', text: msg.text } : { type: 'PM_CLOSE_PANEL' };
    chrome.tabs.sendMessage(tabId, out, { frameId: 0 })
      .then((r) => sendResponse(r || { ok: false, reason: 'no-response' }))
      .catch(() => sendResponse({ ok: false, reason: 'no-content-script' }));
    return true;
  }
  if (msg.type === 'PM_SYNC_NOW') {
    runSync({ force: !!msg.force }).then(sendResponse, (e) => sendResponse({ status: 'error', message: String(e && e.message) }));
    return true;
  }
  if (msg.type === 'PM_SYNC_RESET_REMOTE') {
    chain = chain.then(async () => makeEngine((await store.load()).settings).resetRemote());
    chain.then(sendResponse, (e) => sendResponse({ status: 'error', message: String(e && e.message) }));
    return true;
  }
  return undefined;
});
