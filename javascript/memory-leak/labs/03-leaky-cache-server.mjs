/**
 * Lab 03 — Unbounded Map Cache Server (LEAKY)
 * Run: node javascript/memory-leak/labs/03-leaky-cache-server.mjs
 * Then in another terminal: for i in $(seq 1 5000); do curl -s http://localhost:3456/ > /dev/null; done
 */

import http from 'http';

const cache = new Map(); // grows forever — one entry per unique request time

const server = http.createServer((req, res) => {
  const key = `${req.url}-${Date.now()}-${Math.random()}`;
  const payload = new Array(5_000).fill(req.url);
  cache.set(key, payload);
  res.end(`ok cache.size=${cache.size}\n`);
});

server.listen(3456, () => {
  console.log('Leaky server on http://localhost:3456');
  console.log('Watch cache.size climb every 3s:\n');

  setInterval(() => {
    const m = process.memoryUsage();
    console.log(
      `cache.size=${cache.size} rss=${(m.rss / 1e6).toFixed(1)}MB heapUsed=${(m.heapUsed / 1e6).toFixed(1)}MB`
    );
  }, 3000);
});
