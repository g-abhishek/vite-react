const express = require("express");

const app = express();

app.get("/non-blocking", (req, res) => {
  res.status(200).send("This page is non-blocking");
});

app.get("/blocking", (req, res) => {
  let counter = 0;
  for (let i = 0; i < 20_000_000_000; i++) {
    counter++;
  }
  res.status(200).send(`Result is ${counter}`);
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});
