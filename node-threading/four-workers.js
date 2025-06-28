const { workerData, parentPort } = require("worker_threads");

let counter = 0;
for (let i = 0; i < 20_000_000_000 / workerData.THREAD_COUNT; i++) {
  counter++;
}

parentPort.postMessage(counter);
