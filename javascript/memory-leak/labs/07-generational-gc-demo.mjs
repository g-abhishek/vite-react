/**
 * Lab 07 — Generational GC: young temps vs accidental promotion (leak)
 * Run: node --expose-gc javascript/memory-leak/labs/07-generational-gc-demo.mjs
 *
 * Part A: 10,000 temp objects per "request" — all die young (Minor GC collects them)
 * Part B: Same requests but ONE object retained globally per request — stays alive (Old Space)
 */

function mb(bytes) {
  return (bytes / 1e6).toFixed(1) + 'MB';
}

function heap(label) {
  const m = process.memoryUsage();
  console.log(`[${label}] heapUsed=${mb(m.heapUsed)} heapTotal=${mb(m.heapTotal)}`);
}

// ── Part A: Healthy — temps die young ────────────────────────────
function healthyRequest() {
  const temps = [];
  for (let i = 0; i < 10_000; i++) {
    temps.push({ id: i, payload: 'x'.repeat(50) });
  }
  return temps.length;
}

heap('A start');
for (let i = 0; i < 200; i++) healthyRequest();
if (globalThis.gc) globalThis.gc();
heap('A after 200 requests + gc');
console.log('→ Temps were unreachable when each request ended.');
console.log('→ Minor/Major GC collected them — heap stays relatively flat.\n');

// ── Part B: Leak — one survivor promoted per request ─────────────
const survivors = [];

function leakyRequest() {
  const temps = [];
  for (let i = 0; i < 10_000; i++) {
    temps.push({ id: i, payload: 'x'.repeat(50) });
  }
  survivors.push(temps[0]); // ONE reachable ref per request — never unused to GC
  return temps.length;
}

heap('B start');
for (let i = 0; i < 200; i++) leakyRequest();
if (globalThis.gc) globalThis.gc();
heap('B after 200 requests + gc');
console.log(`→ survivors.length=${survivors.length} (200 objects still reachable from root)`);
console.log('→ 9,999 temps per request were collected, but 1 per request was PROMOTED/kept.');
console.log('→ Old Space grows → future Major GC scans more → longer pauses.\n');

if (!globalThis.gc) {
  console.log('Tip: run with node --expose-gc for clearer before/after numbers');
}
