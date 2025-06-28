const express = require("express");

const app = express();

app.get("/heavy", (req, res) => {
  let total = 0;
  for (let i = 0; i < 50_000_000; i++) {
    total++;
  }

  res.send(`The result of the cpu intensive task is ${total}`);
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
  console.log(`worker pid=${process.pid}`);
});


// npx loadtest -n 1200 -c 400 -k http://localhost:3000/heavy

// npx pm2 start index.js
/**
 * When you run: pm2 start index.js -i max
 * 
 * 1. ✔ Automatically forks multiple worker processes, equal to your CPU cores
 * 2. ✔ Uses the cluster module internally
 * 3. ✔ Handles socket sharing, so all workers listen on the same port
 * 4. ✔ Manages process restarts if any worker crashes
 * 5. ✔ Provides logs, CPU, and memory monitoring for all workers
 * 6. ✔ Load-balances incoming connections among the worker processes
 * 
 * ✅ PM2 vs Manual Clustering
 * With PM2:
 *  1. You don't manually write cluster.fork()
 *  2. PM2 does the clustering for you
 *  3. You keep your app logic clean, just write the server as usual
 *  4. PM2 injects the clustering layer beneath
 * 
 * Without PM2:
 *  1. You need to write cluster.isPrimary checks
 *  2. Manually fork workers
 *  3. Handle worker restarts
 *  4. More boilerplate code to manage clustering
 * 
 */