/**
 * Lab 04 — EventEmitter Listener Leak
 * Run: node javascript/memory-leak/labs/04-event-emitter-leak.mjs
 */

import { EventEmitter } from 'events';

const bus = new EventEmitter();

function subscribe(userId) {
  bus.on('tick', () => {
    // Each call adds a NEW listener — old ones never removed
    void userId;
  });
}

for (let i = 0; i < 15; i++) {
  subscribe(i);
}

console.log('listenerCount(tick):', bus.listenerCount('tick'));
console.log('MaxListenersExceededWarning appears when default limit (10) is exceeded.');
console.log('\nYour Turn: fix by returning an unsubscribe function and calling off().');
