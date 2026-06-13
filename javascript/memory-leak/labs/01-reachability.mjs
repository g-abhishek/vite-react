/**
 * Lab 01 — Reachability & Garbage Collection
 * Run: node javascript/memory-leak/labs/01-reachability.mjs
 *
 * Shows how references keep objects alive even when you "clear" a container.
 */

// ── Setup ────────────────────────────────────────────────────────
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const first = users[0];

console.log('Before clear — first.name:', first.name);

users.length = 0; // empties array, but first still holds Alice

console.log('After users.length = 0 — first.name:', first.name);
console.log('Is Alice collectible? NO — `first` still references her object.\n');

// ── Demo: leak via global ────────────────────────────────────────
function createLeakyHandler() {
  const bigPayload = new Array(100_000).fill('secret-data');
  const handler = () => {
    console.log('Handler ran. Payload size:', bigPayload.length);
  };
  globalThis.__leakedHandler = handler; // root reference — never collectible
  return handler;
}

createLeakyHandler();

// Force GC if available: node --expose-gc javascript/memory-leak/labs/01-reachability.mjs
if (globalThis.gc) {
  globalThis.gc();
  console.log('After gc() — leaked handler still on globalThis:', !!globalThis.__leakedHandler);
} else {
  console.log('Tip: re-run with node --expose-gc to force garbage collection');
}
