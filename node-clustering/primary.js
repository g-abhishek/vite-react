const cluster = require("cluster");
const os = require("os");

const cpuCount = os.cpus().length;

console.log(`The total number of CPUs is ${cpuCount}`);
console.log(`Primary pid=${process.pid}`);

if (cluster.isMaster) {
  // Fork workers.
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }

  // Optional: Listen for worker exits
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  require("./index");
}

/**
 * When you use cluster.fork(), it creates a completely new Node.js process, and in that new process, the code runs from the top again, but with a different value for cluster.isPrimary.
 * 
 * ✅ What Happens Internally
 * You run node primary.js
 * The code runs top to bottom in the original process
 * cluster.isPrimary === true, so:
 *      1. You see: Primary process: 1234
 *      2. 8 cluster.fork() calls happen
 * Each fork() starts a completely new Node.js process
 *      1. These new processes re-run the same file primary.js from the top
 * 
 * Inside these new processes:
 *      1. cluster.isPrimary === false
 *      2. So, code inside the else block runs
 *      3. Each worker creates its own server
 * 
 */
