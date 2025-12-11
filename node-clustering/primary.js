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
 *      3. Each worker creates its own server on same port
 * 
 */


/**
 * 
Without Clustering:
┌──────────────┐
│   1 Process  │ ← Uses only 1 CPU core
│   1 Thread   │ ← Other 7 cores are IDLE!
└──────────────┘
 * 
 *
With Clustering (8 cores):
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Worker 1 │ │ Worker 2 │ │ Worker 3 │ │ Worker 4 │
│  Core 1  │ │  Core 2  │ │  Core 3  │ │  Core 4  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Worker 5 │ │ Worker 6 │ │ Worker 7 │ │ Worker 8 │
│  Core 5  │ │  Core 6  │ │  Core 7  │ │  Core 8  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

All 8 cores utilized! 8x throughput potential!
 * 
 * 
 * 
                    ┌─────────────────────────────────┐
                    │         MASTER PROCESS          │
                    │         (primary.js)            │
                    │         PID: 1234               │
                    │                                 │
                    │  • Manages all workers          │
                    │  • Doesn't handle requests      │
                    │  • Restarts dead workers        │
                    └─────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   WORKER 1          │ │   WORKER 2          │ │   WORKER N          │
│   (index.js)        │ │   (index.js)        │ │   (index.js)        │
│   PID: 1235         │ │   PID: 1236         │ │   PID: 123N         │
│                     │ │                     │ │                     │
│   Handles requests  │ │   Handles requests  │ │   Handles requests  │
│   on same port      │ │   on same port      │ │   on same port      │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
           ▲                       ▲                       ▲
           │                       │                       │
           └───────────────────────┴───────────────────────┘
                                   │
                         ┌─────────────────┐
                         │  Incoming HTTP  │
                         │   Requests      │
                         │   (Port 3000)   │
                         └─────────────────┘
 * 
 * Load balancing - Node automatically distributes requests
 * Fault tolerance - Dead workers are auto-restarted
 * Zero downtime - Other workers handle requests while one restarts
 * Same port - All workers share port 3000 (handled by OS)
 * Multi-core usage - Utilize all CPU cores
 * 
 */

/**
 * ============================================================================
 * CONS / DISADVANTAGES OF CLUSTERING
 * ============================================================================
 *
 * 1. NO SHARED MEMORY BETWEEN WORKERS
 * ------------------------------------
 * Each worker is a separate process with its own memory space.
 *
 * // Worker 1
 * let userSessions = { user1: "session123" };
 *
 * // Worker 2 - Has NO idea about user1's session!
 * console.log(userSessions.user1);  // undefined
 *
 * Problem: In-memory data (sessions, cache, counters) is NOT shared.
 * Solution: Use Redis for shared sessions/cache, or use a database.
 *
 * ----------------------------------------------------------------------------
 *
 * 2. STATEFUL CONNECTIONS BREAK (WebSockets, SSE)
 * ------------------------------------------------
 * Request 1 → Worker 1 → WebSocket connection established
 * Request 2 → Worker 3 → Different worker! Connection lost! 💥
 *
 * Problem: Long-lived connections may route to different workers.
 * Solution: Use sticky sessions, or Redis pub/sub for Socket.io.
 *
 * ----------------------------------------------------------------------------
 *
 * 3. INCREASED MEMORY USAGE
 * --------------------------
 * Without Clustering:
 *   1 process × 100MB = 100MB RAM
 *
 * With Clustering (8 workers):
 *   8 processes × 100MB = 800MB RAM 💥
 *
 * Each worker loads the entire application into memory.
 *
 * ----------------------------------------------------------------------------
 *
 * 4. DEBUGGING IS HARDER
 * -----------------------
 * // Which worker handled this request?
 * // Which worker has the bug?
 * // Logs are interleaved from 8 processes!
 *
 * [Worker 3] Request started
 * [Worker 1] Error: Something failed    // Which request was this?
 * [Worker 5] Request started
 * [Worker 3] Request completed
 *
 * Solution: Add worker PID to all logs, use centralized logging.
 *
 * ----------------------------------------------------------------------------
 *
 * 5. COLD START LATENCY
 * ----------------------
 * When a worker dies and restarts:
 *
 * Worker 3 crashes
 *     ↓
 * cluster.fork() called
 *     ↓
 * New process spawns
 *     ↓
 * Loads all modules (require)
 *     ↓
 * Initializes connections (DB, Redis)
 *     ↓
 * Ready to serve (may take seconds!)
 *
 * First few requests after restart may be slow.
 *
 * ----------------------------------------------------------------------------
 *
 * 6. NO FINE-GRAINED CONTROL OVER LOAD BALANCING
 * ------------------------------------------------
 * Node.js uses OS-level round-robin (on most platforms):
 *
 * Request 1 → Worker 1
 * Request 2 → Worker 2
 * Request 3 → Worker 3
 *
 * Problems:
 *   - Can't route based on request type
 *   - Can't prioritize certain workers
 *   - One worker handling heavy task still gets new requests
 *
 * Solution: Use Nginx or HAProxy for smarter load balancing.
 *
 * ----------------------------------------------------------------------------
 *
 * 7. NOT IDEAL FOR CPU-BOUND TASKS
 * ---------------------------------
 * Even with clustering, each worker is still single-threaded.
 * One heavy CPU task blocks that entire worker.
 *
 * app.get("/heavy", (req, res) => {
 *   const result = heavyComputation();  // Blocks THIS worker
 *   res.send(result);
 * });
 *
 * Solution: Use Worker Threads for CPU-intensive tasks.
 *
 * ============================================================================
 *
 * SUMMARY TABLE:
 * --------------
 * | Con                      | Impact                    | Solution              |
 * |--------------------------|---------------------------|-----------------------|
 * | No shared memory         | Sessions/cache don't sync | Redis                 |
 * | WebSocket issues         | Connections break         | Sticky sessions       |
 * | High memory usage        | 8x RAM consumption        | Optimize per-worker   |
 * | Debugging difficulty     | Logs interleaved          | Centralized logging   |
 * | Cold start latency       | Slow after restart        | Pre-warming           |
 * | Basic load balancing     | No smart routing          | Nginx/HAProxy         |
 * | CPU-bound blocks worker  | Worker unresponsive       | Worker Threads        |
 *
 * ============================================================================
 *
 * BETTER ALTERNATIVES FOR PRODUCTION:
 * ------------------------------------
 * 1. PM2 - Process manager with clustering, logging, monitoring
 *    $ pm2 start index.js -i max
 *
 * 2. Docker + Kubernetes - Container orchestration with auto-scaling
 *
 * 3. Nginx/HAProxy - External load balancer with more control
 *
 * ============================================================================
 */
