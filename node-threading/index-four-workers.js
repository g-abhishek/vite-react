const express = require("express");
const { Worker } = require("worker_threads");

const app = express();
const THREAD_COUNT = 4;

app.get("/non-blocking", (req, res) => {
  res.status(200).send("This page is non-blocking");
});

const createWorker = async () => {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./four-workers.js", {
      workerData: {
        THREAD_COUNT: THREAD_COUNT,
      },
    });
    worker.on("message", (data) => {
      resolve(data);
    });

    worker.on("error", (error) => {
      reject(error);
    });
  });
};

app.get("/blocking", async (req, res) => {
  const workerPromises = [];
  for (let i = 0; i < THREAD_COUNT; i++) {
    workerPromises.push(createWorker());
  }

  const thread_result = await Promise.all(workerPromises);

  let total =
    thread_result[0] + thread_result[1] + thread_result[2] + thread_result[3];

  res.status(200).send(`Result is ${total}`);
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
