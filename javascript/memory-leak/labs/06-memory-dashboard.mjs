/**
 * Lab 06 — Memory Dashboard (Solution for Exercise 11.2)
 * Run alongside leaky server: node javascript/memory-leak/labs/06-memory-dashboard.mjs
 */

setInterval(() => {
  const m = process.memoryUsage();
  console.log(
    [
      new Date().toISOString(),
      `rss=${(m.rss / 1e6).toFixed(1)}MB`,
      `heapUsed=${(m.heapUsed / 1e6).toFixed(1)}MB`,
      `heapTotal=${(m.heapTotal / 1e6).toFixed(1)}MB`,
      `external=${(m.external / 1e6).toFixed(1)}MB`,
      `arrayBuffers=${(m.arrayBuffers / 1e6).toFixed(1)}MB`,
    ].join(' | ')
  );
}, 5000);

console.log('Memory dashboard running (every 5s). Ctrl+C to stop.');
