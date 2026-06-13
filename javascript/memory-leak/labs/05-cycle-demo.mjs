/**
 * Lab 05 — Cycle Demo (Exercise 5.1)
 * Run: node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs
 */

function makeCycle(attachToGlobal) {
  const a = { tag: 'a' };
  const b = { tag: 'b' };
  a.ref = b;
  b.ref = a;
  if (attachToGlobal) globalThis.holder = a;
  return { a, b };
}

makeCycle(false);
makeCycle(true);

if (globalThis.gc) {
  globalThis.gc();
  console.log('After gc(): global holder exists:', !!globalThis.holder);
} else {
  console.log('Run with: node --expose-gc javascript/memory-leak/labs/05-cycle-demo.mjs');
}
