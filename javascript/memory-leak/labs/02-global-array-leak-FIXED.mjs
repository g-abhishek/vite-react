/**
 * Lab 02 — FIXED: Bounded ring buffer instead of unbounded global
 * Run: node javascript/memory-leak/labs/02-global-array-leak-FIXED.mjs
 */

const MAX = 1000;
const requestLog = [];

function logMemory(label) {
  const m = process.memoryUsage();
  console.log(
    `[${label}] rss=${(m.rss / 1e6).toFixed(1)}MB heapUsed=${(m.heapUsed / 1e6).toFixed(1)}MB log.length=${requestLog.length}`
  );
}

function handleRequest(body) {
  requestLog.push({ body, at: Date.now() });
  if (requestLog.length > MAX) requestLog.shift();
}

logMemory('start');

for (let i = 0; i < 50_000; i++) {
  handleRequest({ id: i, data: 'x'.repeat(200) });
}

logMemory('after 50k requests');
console.log('\nLength capped at', MAX, '— memory plateaus instead of climbing forever.');
