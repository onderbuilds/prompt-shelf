const Q = { bytes: 102400, perItem: 8192, maxItems: 512, perMinute: 120, perHour: 1800 };
const enc = (s) => Buffer.byteLength(s, 'utf8');
const itemBytes = (k, v) => enc(k) + enc(JSON.stringify(v));

function fakeSyncArea(clock, quotas) {
  const q = { ...Q, ...(quotas || {}) };
  const m = new Map();
  const ops = [];
  const listeners = new Set();
  let failNext = null;
  const now = () => (clock ? clock() : Date.now());
  function countOp() {
    const t = now();
    while (ops.length && t - ops[0] > 3600000) ops.shift();
    if (ops.filter((x) => t - x < 60000).length >= q.perMinute) throw new Error('MAX_WRITE_OPERATIONS_PER_MINUTE quota exceeded');
    if (ops.length >= q.perHour) throw new Error('MAX_WRITE_OPERATIONS_PER_HOUR quota exceeded');
    ops.push(t);
  }
  const total = (map) => [...map].reduce((n, [k, v]) => n + itemBytes(k, v), 0);
  const fire = (changes) => { for (const l of listeners) l(changes, 'sync'); };
  return {
    async get(keys) {
      const out = {};
      const list = keys == null ? [...m.keys()] : [].concat(keys);
      for (const k of list) if (m.has(k)) out[k] = JSON.parse(JSON.stringify(m.get(k)));
      return out;
    },
    async set(obj) {
      if (failNext) { const e = failNext; failNext = null; throw e; }
      countOp();
      const next = new Map(m);
      for (const [k, v] of Object.entries(obj)) {
        if (itemBytes(k, v) > q.perItem) throw new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
        next.set(k, JSON.parse(JSON.stringify(v)));
      }
      if (next.size > q.maxItems) throw new Error('MAX_ITEMS quota exceeded');
      if (total(next) > q.bytes) throw new Error('QUOTA_BYTES quota exceeded');
      const changes = {};
      for (const k of Object.keys(obj)) { changes[k] = { newValue: next.get(k) }; m.set(k, next.get(k)); }
      fire(changes);
    },
    async remove(keys) {
      countOp();
      const changes = {};
      for (const k of [].concat(keys)) if (m.has(k)) { m.delete(k); changes[k] = { newValue: undefined }; }
      fire(changes);
    },
    async getBytesInUse() { return total(m); },
    onChanged: { addListener: (f) => listeners.add(f), removeListener: (f) => listeners.delete(f) },

    failOnce(err) { failNext = err; },
    raw: m,
    ops,
  };
}
module.exports = { fakeSyncArea, QUOTAS: Q, itemBytes };
