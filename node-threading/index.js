const express = require("express");
const { Worker } = require("worker_threads");

const app = express();

app.get("/non-blocking", (req, res) => {
  res.status(200).send("This page is non-blocking");
});

app.get("/blocking", (req, res) => {
  const worker = new Worker("./worker.js");

  worker.on("message", (data) => {
    res.status(200).send(`Result is ${data}`);
  });
  worker.on("error", (data) => {
    res.status(200).send(`Error is ${data}`);
  });
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
