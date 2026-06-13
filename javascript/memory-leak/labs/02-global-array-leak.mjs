/**
 * Lab 02 — Global Unbounded Array Leak
 * Run: node javascript/memory-leak/labs/02-global-array-leak.mjs
 *
 * Simulates a request handler that logs every body into a global array forever.
 */

function logMemory(label) {
  const m = process.memoryUsage();
  console.log(
    `[${label}] rss=${(m.rss / 1e6).toFixed(1)}MB heapUsed=${(m.heapUsed / 1e6).toFixed(1)}MB log.length=${globalThis.requestLog?.length ?? 0}`
  );
}

// ── LEAKY VERSION ────────────────────────────────────────────────
function handleRequest(body) {
  if (!globalThis.requestLog) globalThis.requestLog = [];
  globalThis.requestLog.push({ body, at: Date.now() });
}

logMemory('start');

for (let i = 0; i < 50_000; i++) {
  handleRequest({ id: i, data: 'x'.repeat(200) });
}

logMemory('after 50k requests');
console.log('\nMemory keeps growing because requestLog is never trimmed.');
console.log('Your Turn: fix this in 02-global-array-leak-FIXED.mjs\n');
