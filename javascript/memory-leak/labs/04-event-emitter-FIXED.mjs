/**
 * Lab 04 — FIXED EventEmitter with unsubscribe
 * Run: node javascript/memory-leak/labs/04-event-emitter-FIXED.mjs
 */

import { EventEmitter } from 'events';

const bus = new EventEmitter();

function subscribe(userId, handler) {
  bus.on('tick', handler);
  return () => bus.off('tick', handler);
}

const unsubscribers = [];

for (let i = 0; i < 15; i++) {
  const handler = () => void i;
  unsubscribers.push(subscribe(i, handler));
}

console.log('After 15 subscribes:', bus.listenerCount('tick'));

// Cleanup — like component unmount or connection close
unsubscribers.forEach((off) => off());

console.log('After cleanup:', bus.listenerCount('tick'));
