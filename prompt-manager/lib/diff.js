(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.PM = root.PM || {}; Object.assign(root.PM, mod); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_CELLS = 4e6;

  function diffTokens(a, b) {
    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
    let endA = a.length; let endB = b.length;
    while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA -= 1; endB -= 1; }
    const out = [];
    for (let i = 0; i < start; i += 1) out.push({ op: 'eq', text: a[i] });
    const A = a.slice(start, endA); const B = b.slice(start, endB);
    const n = A.length; const m = B.length;
    if (n && m && (n + 1) * (m + 1) <= MAX_CELLS) {

      const w = m + 1;
      const dp = new Uint32Array((n + 1) * w);
      for (let i = n - 1; i >= 0; i -= 1) {
        for (let j = m - 1; j >= 0; j -= 1) {
          dp[i * w + j] = A[i] === B[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
        }
      }
      let i = 0; let j = 0;
      while (i < n && j < m) {
        if (A[i] === B[j]) { out.push({ op: 'eq', text: A[i] }); i += 1; j += 1; }
        else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { out.push({ op: 'del', text: A[i] }); i += 1; }
        else { out.push({ op: 'add', text: B[j] }); j += 1; }
      }
      while (i < n) { out.push({ op: 'del', text: A[i] }); i += 1; }
      while (j < m) { out.push({ op: 'add', text: B[j] }); j += 1; }
    } else {
      for (const x of A) out.push({ op: 'del', text: x });
      for (const x of B) out.push({ op: 'add', text: x });
    }
    for (let i = endA; i < a.length; i += 1) out.push({ op: 'eq', text: a[i] });
    return out;
  }

  const splitLines = (s) => String(s == null ? '' : s).split('\n');
  const splitWords = (s) => String(s == null ? '' : s).match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu) || [];

  function compact(ops) {
    const out = [];
    for (const o of ops) {
      const last = out[out.length - 1];
      if (last && last.op === o.op) last.text += o.text; else out.push({ op: o.op, text: o.text });
    }
    return out;
  }

  function diffLines(a, b) { return diffTokens(splitLines(a), splitLines(b)); }
  function diffWords(a, b) { return compact(diffTokens(splitWords(a), splitWords(b))); }

  function diffRich(a, b) {
    const lines = diffLines(a, b);
    const out = [];
    for (let i = 0; i < lines.length;) {
      if (lines[i].op === 'eq') { out.push(lines[i]); i += 1; continue; }
      const dels = []; const adds = [];
      while (i < lines.length && lines[i].op !== 'eq') { (lines[i].op === 'del' ? dels : adds).push(lines[i].text); i += 1; }
      const pairs = Math.min(dels.length, adds.length);
      for (let k = 0; k < pairs; k += 1) out.push({ op: 'mod', from: dels[k], to: adds[k], words: diffWords(dels[k], adds[k]) });
      for (let k = pairs; k < dels.length; k += 1) out.push({ op: 'del', text: dels[k] });
      for (let k = pairs; k < adds.length; k += 1) out.push({ op: 'add', text: adds[k] });
    }
    return out;
  }

  function diffStats(a, b) {
    const s = { added: 0, removed: 0, same: 0 };
    for (const l of diffLines(a, b)) { if (l.op === 'add') s.added += 1; else if (l.op === 'del') s.removed += 1; else s.same += 1; }
    return s;
  }

  function applySide(ops, side, joiner) {
    return ops.filter((o) => o.op === 'eq' || o.op === (side === 'a' ? 'del' : 'add')).map((o) => o.text).join(joiner);
  }

  return { diffTokens, diffLines, diffWords, diffRich, diffStats, applySide, MAX_CELLS };
});
