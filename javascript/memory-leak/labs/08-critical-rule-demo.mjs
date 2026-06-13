/**
 * Lab 08 — The critical rule: reachable vs unreachable
 * Run: node --expose-gc javascript/memory-leak/labs/08-critical-rule-demo.mjs
 */

function logHeap(label) {
  const u = process.memoryUsage().heapUsed;
  console.log(`${label}: ${(u / 1e6).toFixed(1)}MB`);
}

// ── Scenario A: UNREACHABLE — GC collects ──────────────────────
function scenarioA() {
  const data = new Array(500_000).fill('temporary');
  return data.length;
}
scenarioA();
// `data` unreachable here — no root path

// ── Scenario B: REACHABLE but UNUSED — leak ────────────────────
const leakedStore = [];
function scenarioB() {
  const data = new Array(500_000).fill('leaked');
  leakedStore.push(data);
  return data.length;
}
scenarioB();

// ── Scenario C: REACHABLE + bounded cache — not a leak ────────
const MAX = 2;
const boundedCache = [];
function scenarioC(key) {
  const data = new Array(100_000).fill(`cache-${key}`);
  boundedCache.push({ key, data });
  if (boundedCache.length > MAX) boundedCache.shift();
  return data.length;
}
scenarioC('a');
scenarioC('b');
scenarioC('c'); // evicts oldest — only 2 entries kept

if (globalThis.gc) globalThis.gc();

console.log('\nAfter gc():');
console.log('  Scenario A — no global ref → large array collected');
console.log('  Scenario B — leakedStore.length =', leakedStore.length, '→ KEPT (leak)');
console.log('  Scenario C — boundedCache.length =', boundedCache.length, '→ KEPT by design (max 2)');
logHeap('heapUsed');

if (!globalThis.gc) {
  console.log('\nTip: node --expose-gc javascript/memory-leak/labs/08-critical-rule-demo.mjs');
}
