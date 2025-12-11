# Kafka Deep Dive - Detailed Explanations with Examples

## Table of Contents
1. [How Kafka Works Under the Hood](#1-how-kafka-works-under-the-hood)
2. [Producer Deep Dive](#2-producer-deep-dive)
3. [Consumer Deep Dive](#3-consumer-deep-dive)
4. [Partitions In-Depth](#4-partitions-in-depth)
5. [Replication Explained](#5-replication-explained)
6. [Real-World Scenarios](#6-real-world-scenarios)
7. [Performance Tuning](#7-performance-tuning)

---

## 1. How Kafka Works Under the Hood

### The Log Data Structure

Kafka stores messages in an **append-only log** - the most important concept to understand.

```
┌────────────────────────────────────────────────────────────────────────┐
│                    KAFKA LOG STRUCTURE                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Traditional Database (B-Tree)          Kafka Log (Append-Only)        │
│  ┌───────────────────────┐              ┌───────────────────────┐      │
│  │      Random I/O       │              │   Sequential I/O      │      │
│  │   ┌───┐               │              │                       │      │
│  │   │ 5 │               │              │  [0][1][2][3][4]──▶   │      │
│  │  ┌┴─┬─┴┐              │              │        ↑              │      │
│  │  │3 │7 │              │              │    New messages       │      │
│  │ ┌┴┐ │ ┌┴┐             │              │    appended here      │      │
│  │ │1│ │4│ │9│           │              │                       │      │
│  │ └─┘ └─┘ └─┘           │              │  🚀 10x-100x faster!  │      │
│  └───────────────────────┘              └───────────────────────┘      │
│                                                                         │
│  Why Sequential I/O is faster:                                         │
│  ─────────────────────────────                                         │
│  • HDD: No disk head movement (seek time eliminated)                   │
│  • SSD: Better wear leveling, sequential writes are faster             │
│  • OS: Can prefetch data efficiently                                   │
│  • Cache: Better CPU cache utilization                                 │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Message Storage on Disk

```
┌────────────────────────────────────────────────────────────────────────┐
│                 KAFKA STORAGE STRUCTURE                                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /kafka-logs/                                                          │
│  └── order-topic-0/                    ← Partition 0 directory         │
│      ├── 00000000000000000000.log      ← Segment file (messages)       │
│      ├── 00000000000000000000.index    ← Offset index                  │
│      ├── 00000000000000000000.timeindex← Timestamp index               │
│      ├── 00000000000000005000.log      ← Next segment (offset 5000+)   │
│      ├── 00000000000000005000.index                                    │
│      └── 00000000000000005000.timeindex                                │
│  └── order-topic-1/                    ← Partition 1 directory         │
│      └── ...                                                           │
│                                                                         │
│  SEGMENT FILES                                                         │
│  ─────────────                                                         │
│  • Default size: 1GB (configurable)                                    │
│  • Active segment: Currently being written to                          │
│  • Closed segments: Immutable, can be deleted by retention policy      │
│                                                                         │
│  INDEX FILES                                                           │
│  ───────────                                                           │
│  • Sparse index (not every message)                                    │
│  • Maps offset → file position                                         │
│  • Enables O(1) message lookup by offset                               │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### How Message Lookup Works

```
┌────────────────────────────────────────────────────────────────────────┐
│              FINDING MESSAGE AT OFFSET 7523                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1: Find the right segment                                        │
│  ──────────────────────────────                                        │
│  Segment files: 0000.log, 5000.log, 10000.log                          │
│  7523 is between 5000 and 10000 → Use 5000.log                         │
│                                                                         │
│  Step 2: Binary search in index                                        │
│  ──────────────────────────────                                        │
│  5000.index (sparse):                                                  │
│  ┌──────────┬────────────┐                                             │
│  │  Offset  │  Position  │                                             │
│  ├──────────┼────────────┤                                             │
│  │   5000   │     0      │                                             │
│  │   5100   │   10240    │  ← 7523 > 5100                              │
│  │   5200   │   20480    │                                             │
│  │   ...    │    ...     │                                             │
│  │   7500   │   250000   │  ← Found! Closest ≤ 7523                    │
│  │   7600   │   260000   │                                             │
│  └──────────┴────────────┘                                             │
│                                                                         │
│  Step 3: Sequential scan from position                                 │
│  ─────────────────────────────────────                                 │
│  Start at position 250000, scan forward 23 messages                    │
│  Found: Offset 7523! ✓                                                 │
│                                                                         │
│  Total: O(log n) for segment + O(log n) for index + O(k) scan          │
│         where k is typically < 100 messages                            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Zero-Copy Optimization

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ZERO-COPY TRANSFER                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TRADITIONAL WAY (4 copies, 4 context switches):                       │
│  ┌──────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐     │
│  │   Disk   │───▶│ OS Buffer  │───▶│ App Buffer │───▶│ Socket   │     │
│  └──────────┘ 1  └────────────┘ 2  └────────────┘ 3  └──────────┘     │
│                                           │              │              │
│                                           └──────────────┘              │
│                                                  4                      │
│                                                  ▼                      │
│                                           ┌──────────┐                 │
│                                           │ Network  │                 │
│                                           └──────────┘                 │
│                                                                         │
│  KAFKA ZERO-COPY (sendfile syscall):                                   │
│  ┌──────────┐    ┌────────────┐    ┌──────────┐                        │
│  │   Disk   │───▶│ OS Buffer  │───▶│ Network  │                        │
│  └──────────┘ 1  └────────────┘ 2  └──────────┘                        │
│                                                                         │
│  RESULT: 2-4x throughput improvement for consumers!                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Producer Deep Dive

### Producer Internals

```
┌────────────────────────────────────────────────────────────────────────┐
│                    PRODUCER ARCHITECTURE                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Your Code                            KafkaJS Internals                │
│  ─────────                            ─────────────────                │
│                                                                         │
│  producer.send({                      ┌─────────────────────────┐      │
│    topic: 'orders',       ──────▶     │   1. SERIALIZATION      │      │
│    messages: [{                       │   key → bytes           │      │
│      key: 'cust-1',                   │   value → bytes         │      │
│      value: JSON.stringify(order)     └──────────┬──────────────┘      │
│    }]                                            │                     │
│  });                                             ▼                     │
│                                       ┌─────────────────────────┐      │
│                                       │   2. PARTITIONER        │      │
│                                       │   hash(key) % partitions│      │
│                                       └──────────┬──────────────┘      │
│                                                  │                     │
│                                                  ▼                     │
│                                       ┌─────────────────────────┐      │
│                                       │   3. RECORD ACCUMULATOR │      │
│                                       │   Batches by partition  │      │
│                                       │   ┌─────┐ ┌─────┐       │      │
│                                       │   │ P0  │ │ P1  │       │      │
│                                       │   │batch│ │batch│       │      │
│                                       │   └─────┘ └─────┘       │      │
│                                       └──────────┬──────────────┘      │
│                                                  │                     │
│                                                  ▼                     │
│                                       ┌─────────────────────────┐      │
│                                       │   4. SENDER THREAD      │      │
│                                       │   Sends when:           │      │
│                                       │   • Batch full          │      │
│                                       │   • linger.ms elapsed   │      │
│                                       └──────────┬──────────────┘      │
│                                                  │                     │
│                                                  ▼                     │
│                                       ┌─────────────────────────┐      │
│                                       │   5. BROKER             │      │
│                                       └─────────────────────────┘      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Partitioner Algorithm Explained

```javascript
// Default Murmur2 partitioner (what Kafka uses)
// This is a simplified version to understand the concept

function defaultPartitioner(key, partitionCount) {
  if (key === null || key === undefined) {
    // Round-robin for null keys (sticky partitioner in newer versions)
    return Math.floor(Math.random() * partitionCount);
  }
  
  // Convert key to bytes
  const keyBytes = Buffer.from(key);
  
  // Calculate murmur2 hash (simplified)
  let hash = murmur2Hash(keyBytes);
  
  // Make positive (hash can be negative)
  hash = hash & 0x7fffffff;
  
  // Modulo by partition count
  return hash % partitionCount;
}

// EXAMPLE:
// Topic: order-topic with 4 partitions
// 
// Key: "cust-1"  → hash = 12345  → 12345 % 4 = 1  → Partition 1
// Key: "cust-2"  → hash = 67890  → 67890 % 4 = 2  → Partition 2
// Key: "cust-1"  → hash = 12345  → 12345 % 4 = 1  → Partition 1 (SAME!)
//
// ✅ Same key ALWAYS goes to same partition
// ✅ Orders for "cust-1" are always in order
```

### Detailed Producer Example

```javascript
// producer-detailed.js
const { kafka } = require("./kafka");
const { CompressionTypes } = require("kafkajs");

const createDetailedProducer = async () => {
  const producer = kafka.producer({
    // Idempotency - prevent duplicate messages on retry
    idempotent: true,
    
    // Max requests without response (must be ≤5 for idempotency)
    maxInFlightRequests: 5,
    
    // Retry configuration
    retry: {
      retries: 5,              // Number of retries
      initialRetryTime: 300,   // First retry after 300ms
      maxRetryTime: 30000,     // Max wait between retries
      factor: 2,               // Exponential backoff factor
      multiplier: 1.5,         // Jitter multiplier
    },
  });

  await producer.connect();
  console.log("Producer connected");

  // Example 1: Simple send with key (your approach)
  const sendWithKey = async () => {
    const order = { orderId: "ORD-001", customerId: "cust-1", amount: 99.99 };
    
    await producer.send({
      topic: "order-topic",
      messages: [
        {
          key: order.customerId,  // Ensures ordering per customer
          value: JSON.stringify(order),
        },
      ],
    });
    console.log("Sent order with key-based partitioning");
  };

  // Example 2: Send with headers (metadata)
  const sendWithHeaders = async () => {
    await producer.send({
      topic: "order-topic",
      messages: [
        {
          key: "cust-1",
          value: JSON.stringify({ orderId: "ORD-002", amount: 150 }),
          headers: {
            "correlation-id": "abc-123-def",  // Track request across services
            "source-service": "checkout-api",
            "version": "1.0",
            "timestamp": Date.now().toString(),
          },
        },
      ],
    });
    console.log("Sent with headers");
  };

  // Example 3: Batch send (efficient)
  const sendBatch = async () => {
    const orders = [
      { customerId: "cust-1", orderId: "ORD-003" },
      { customerId: "cust-2", orderId: "ORD-004" },
      { customerId: "cust-1", orderId: "ORD-005" },
      { customerId: "cust-3", orderId: "ORD-006" },
    ];

    await producer.send({
      topic: "order-topic",
      messages: orders.map(order => ({
        key: order.customerId,
        value: JSON.stringify(order),
      })),
    });
    console.log(`Sent batch of ${orders.length} orders`);
  };

  // Example 4: Send with compression
  const sendWithCompression = async () => {
    const largePayload = { data: "x".repeat(10000) };
    
    await producer.send({
      topic: "order-topic",
      compression: CompressionTypes.GZIP,  // or Snappy, LZ4, ZSTD
      messages: [
        { value: JSON.stringify(largePayload) },
      ],
    });
    console.log("Sent with GZIP compression");
  };

  // Example 5: Send to multiple topics atomically
  const sendToMultipleTopics = async () => {
    await producer.sendBatch({
      topicMessages: [
        {
          topic: "orders",
          messages: [
            { key: "cust-1", value: JSON.stringify({ orderId: "ORD-007" }) },
          ],
        },
        {
          topic: "notifications",
          messages: [
            { value: JSON.stringify({ type: "ORDER_CREATED", orderId: "ORD-007" }) },
          ],
        },
        {
          topic: "analytics",
          messages: [
            { value: JSON.stringify({ event: "purchase", orderId: "ORD-007" }) },
          ],
        },
      ],
    });
    console.log("Sent to multiple topics");
  };

  // Example 6: Manual partition selection
  const sendToSpecificPartition = async () => {
    await producer.send({
      topic: "order-topic",
      messages: [
        {
          partition: 0,  // Force to partition 0
          value: JSON.stringify({ orderId: "ORD-008", priority: "high" }),
        },
      ],
    });
    console.log("Sent to specific partition");
  };

  // Run examples
  await sendWithKey();
  await sendWithHeaders();
  await sendBatch();
  await sendWithCompression();
  await sendToMultipleTopics();
  await sendToSpecificPartition();

  await producer.disconnect();
};

createDetailedProducer().catch(console.error);
```

### ACKs Deep Dive

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ACKS DETAILED EXPLANATION                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACKS = 0 (Fire and Forget)                                            │
│  ──────────────────────────                                            │
│                                                                         │
│  Producer          Broker                                              │
│  ┌──────┐          ┌──────┐                                            │
│  │ Msg  │─────────▶│      │                                            │
│  │      │  (no     │      │     Producer doesn't wait for response     │
│  │      │   wait)  │      │     Message may be lost if broker fails    │
│  └──────┘          └──────┘                                            │
│                                                                         │
│  Use case: Metrics, logs where some loss is acceptable                 │
│  Throughput: HIGHEST (100K+ msgs/sec per producer)                     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ACKS = 1 (Leader Only)                                                │
│  ─────────────────────                                                 │
│                                                                         │
│  Producer          Leader           Followers                          │
│  ┌──────┐          ┌──────┐         ┌──────┐ ┌──────┐                  │
│  │ Msg  │─────────▶│  ✓   │────────▶│      │ │      │                  │
│  │      │◀── ACK ──│      │         │      │ │      │                  │
│  └──────┘          └──────┘         └──────┘ └──────┘                  │
│                        │                                                │
│                        └── Writes to local log, ACKs immediately       │
│                            (followers may not have it yet!)            │
│                                                                         │
│  Risk: If leader fails BEFORE replication, message lost                │
│  Use case: Most production workloads                                   │
│  Throughput: HIGH                                                      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ACKS = -1 / ALL (All In-Sync Replicas)                                │
│  ───────────────────────────────────────                               │
│                                                                         │
│  Producer          Leader           Followers (ISR)                    │
│  ┌──────┐          ┌──────┐         ┌──────┐ ┌──────┐                  │
│  │ Msg  │─────────▶│  ✓   │────────▶│  ✓   │ │  ✓   │                  │
│  │      │          │      │◀── OK ──│      │ │      │                  │
│  │      │◀── ACK ──│      │         │      │ │      │                  │
│  └──────┘          └──────┘         └──────┘ └──────┘                  │
│                        │                                                │
│                        └── Waits for ALL ISR replicas to confirm       │
│                                                                         │
│  IMPORTANT: Combine with min.insync.replicas = 2                       │
│  - Ensures at least 2 replicas have the message                        │
│  - If ISR < min.insync.replicas, producer gets error                   │
│                                                                         │
│  Use case: Financial transactions, critical data                       │
│  Throughput: LOWEST (but safest)                                       │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Consumer Deep Dive

### Consumer Group Coordinator

```
┌────────────────────────────────────────────────────────────────────────┐
│                 CONSUMER GROUP COORDINATION                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  When a consumer starts:                                               │
│                                                                         │
│  ┌──────────────┐    1. FindCoordinator     ┌──────────────────────┐  │
│  │   Consumer   │───────────────────────────▶│  Any Broker          │  │
│  │   (new)      │◀──────────────────────────│  Returns coordinator │  │
│  └──────────────┘    Coordinator = Broker 2  └──────────────────────┘  │
│         │                                                               │
│         │ 2. JoinGroup                                                 │
│         ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                    GROUP COORDINATOR (Broker 2)               │      │
│  │                                                               │      │
│  │  Responsibilities:                                            │      │
│  │  • Track group members                                        │      │
│  │  • Detect failures (heartbeat)                                │      │
│  │  • Trigger rebalances                                         │      │
│  │  • Store committed offsets                                    │      │
│  │                                                               │      │
│  │  Consumer Group: "notification-group"                         │      │
│  │  ┌─────────────────────────────────────────────────────┐     │      │
│  │  │ Member        │ Partitions │ Last Heartbeat         │     │      │
│  │  ├─────────────────────────────────────────────────────┤     │      │
│  │  │ consumer-1    │ [0, 1]     │ 2 seconds ago          │     │      │
│  │  │ consumer-2    │ [2, 3]     │ 1 second ago           │     │      │
│  │  └─────────────────────────────────────────────────────┘     │      │
│  │                                                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Rebalancing Process (Step by Step)

```
┌────────────────────────────────────────────────────────────────────────┐
│                    REBALANCING EXPLAINED                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SCENARIO: Consumer-3 joins the group                                  │
│                                                                         │
│  BEFORE:                                                               │
│  Topic: order-topic (4 partitions)                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │   P0   │ │   P1   │ │   P2   │ │   P3   │                          │
│  └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘                          │
│       │          │          │          │                               │
│       └────┬─────┘          └────┬─────┘                               │
│            ▼                     ▼                                     │
│       Consumer-1            Consumer-2                                 │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  STEP 1: Consumer-3 sends JoinGroup request                            │
│                                                                         │
│  Consumer-1 ──┐                                                        │
│  Consumer-2 ──┼──▶ Group Coordinator: "Stop consuming, rebalance!"    │
│  Consumer-3 ──┘                                                        │
│                                                                         │
│  ⚠️ All consumers STOP processing during rebalance                     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  STEP 2: Leader election (oldest member usually becomes leader)        │
│                                                                         │
│  Consumer-1 (LEADER): "I'll decide partition assignment"               │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  STEP 3: Leader computes assignment using strategy                     │
│                                                                         │
│  RANGE Strategy (default):                                             │
│  • Partitions / Consumers = 4 / 3 = 1.33                              │
│  • Consumer-1: P0                                                      │
│  • Consumer-2: P1                                                      │
│  • Consumer-3: P2, P3 (gets extra because it's last)                  │
│                                                                         │
│  ROUND-ROBIN Strategy:                                                 │
│  • Consumer-1: P0, P3                                                  │
│  • Consumer-2: P1                                                      │
│  • Consumer-3: P2                                                      │
│                                                                         │
│  STICKY Strategy (preferred):                                          │
│  • Tries to keep existing assignments                                  │
│  • Minimizes partition movement                                        │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  STEP 4: SyncGroup - Leader sends assignment to coordinator            │
│                                                                         │
│  Coordinator ──▶ Consumer-1: "You get P0"                              │
│              ──▶ Consumer-2: "You get P1"                              │
│              ──▶ Consumer-3: "You get P2, P3"                          │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  AFTER:                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │   P0   │ │   P1   │ │   P2   │ │   P3   │                          │
│  └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘                          │
│       │          │          │          │                               │
│       ▼          ▼          └────┬─────┘                               │
│  Consumer-1  Consumer-2          ▼                                     │
│                             Consumer-3                                 │
│                                                                         │
│  ✅ Consumption resumes!                                               │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Heartbeat and Session Timeout

```
┌────────────────────────────────────────────────────────────────────────┐
│                 HEARTBEAT MECHANISM                                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Consumer                            Group Coordinator                  │
│  ┌────────────┐                      ┌────────────────┐                │
│  │            │───── Heartbeat ─────▶│                │                │
│  │            │         (3s)         │  "Consumer     │                │
│  │            │◀──── Response ───────│   is alive"    │                │
│  │            │                      │                │                │
│  │            │───── Heartbeat ─────▶│                │                │
│  │            │         (3s)         │                │                │
│  │            │◀──── Response ───────│                │                │
│  │            │                      │                │                │
│  │   💥 CRASH │                      │                │                │
│  │            │      (no heartbeat)  │ Waiting...     │                │
│  │            │                      │ session.timeout│                │
│  │            │                      │ = 45s          │                │
│  │            │                      │                │                │
│  │            │                      │ ⏰ TIMEOUT!    │                │
│  │            │                      │ Trigger        │                │
│  │            │                      │ Rebalance!     │                │
│  └────────────┘                      └────────────────┘                │
│                                                                         │
│  KEY CONFIGURATIONS:                                                   │
│  ───────────────────                                                   │
│  heartbeat.interval.ms = 3000 (default)                                │
│  • How often consumer sends heartbeat                                  │
│  • Should be 1/3 of session.timeout                                    │
│                                                                         │
│  session.timeout.ms = 45000 (default)                                  │
│  • Time before consumer considered dead                                │
│  • Higher = more tolerance for slow consumers                          │
│  • Lower = faster failure detection                                    │
│                                                                         │
│  max.poll.interval.ms = 300000 (5 min, default)                        │
│  • Max time between poll() calls                                       │
│  • If processing takes longer, consumer kicked out!                    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Consumer Example

```javascript
// consumer-detailed.js
const { kafka } = require("./kafka");

const runDetailedConsumer = async () => {
  const consumer = kafka.consumer({
    groupId: "order-processing-group",
    
    // Session management
    sessionTimeout: 30000,      // 30 seconds
    heartbeatInterval: 3000,    // 3 seconds (1/10 of session timeout)
    
    // Rebalance timeout
    rebalanceTimeout: 60000,    // 60 seconds for rebalance
    
    // Partition assignment strategy
    // 'RoundRobinAssigner' | 'RangeAssigner'
    partitionAssigners: [
      // Default is RangeAssigner
    ],
    
    // Max time between polls
    maxWaitTimeInMs: 5000,
    
    // Retry configuration
    retry: {
      retries: 10,
    },
  });

  // Event handlers for observability
  consumer.on("consumer.connect", () => {
    console.log("✅ Consumer connected");
  });

  consumer.on("consumer.disconnect", () => {
    console.log("❌ Consumer disconnected");
  });

  consumer.on("consumer.group_join", ({ payload }) => {
    console.log("👥 Joined consumer group:", payload);
  });

  consumer.on("consumer.rebalancing", () => {
    console.log("⚖️ Rebalancing started...");
  });

  consumer.on("consumer.fetch_start", ({ payload }) => {
    console.log("📥 Starting fetch from partition:", payload.partition);
  });

  await consumer.connect();

  // Subscribe to topics
  await consumer.subscribe({
    topics: ["order-topic"],
    fromBeginning: false,  // Only new messages
  });

  // Option 1: Process each message individually
  await consumer.run({
    autoCommit: true,
    autoCommitInterval: 5000,  // Commit every 5 seconds
    autoCommitThreshold: 100,  // Or every 100 messages
    
    eachMessage: async ({ topic, partition, message, heartbeat }) => {
      const order = JSON.parse(message.value.toString());
      
      console.log({
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: order,
        headers: message.headers,
        timestamp: message.timestamp,
      });

      // Long processing? Call heartbeat to prevent timeout
      await heavyProcessing(order);
      await heartbeat();  // Tell Kafka we're still alive
    },
  });
};

// Alternative: Batch processing
const runBatchConsumer = async () => {
  const consumer = kafka.consumer({ groupId: "batch-processor" });
  await consumer.connect();
  await consumer.subscribe({ topics: ["order-topic"] });

  await consumer.run({
    autoCommit: false,
    
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      uncommittedOffsets,
      isRunning,
      isStale,
    }) => {
      console.log(`📦 Received batch of ${batch.messages.length} messages`);
      console.log(`   Topic: ${batch.topic}, Partition: ${batch.partition}`);
      console.log(`   First offset: ${batch.firstOffset()}`);
      console.log(`   Last offset: ${batch.lastOffset()}`);

      for (const message of batch.messages) {
        // Check if partition was reassigned (stale batch)
        if (!isRunning() || isStale()) {
          console.log("⚠️ Batch is stale, skipping remaining messages");
          break;
        }

        // Process message
        const order = JSON.parse(message.value.toString());
        await processOrder(order);

        // Mark message as processed (but don't commit yet)
        resolveOffset(message.offset);

        // Send heartbeat periodically
        await heartbeat();
      }

      // Commit all processed offsets at once
      await commitOffsetsIfNecessary();
      console.log("✅ Batch committed");
    },
  });
};

// Helper: Pause and resume consumption
const pauseResumeExample = async () => {
  const consumer = kafka.consumer({ groupId: "pausable-consumer" });
  await consumer.connect();
  await consumer.subscribe({ topics: ["order-topic"] });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const order = JSON.parse(message.value.toString());
      
      // Check if we need to slow down (e.g., downstream is overwhelmed)
      if (shouldPause()) {
        console.log("⏸️ Pausing consumption");
        consumer.pause([{ topic, partitions: [partition] }]);
        
        // Resume after some time
        setTimeout(() => {
          console.log("▶️ Resuming consumption");
          consumer.resume([{ topic, partitions: [partition] }]);
        }, 10000);
      }
      
      await processOrder(order);
    },
  });
};

runDetailedConsumer().catch(console.error);
```

---

## 4. Partitions In-Depth

### Partition Distribution Across Brokers

```
┌────────────────────────────────────────────────────────────────────────┐
│           PARTITION DISTRIBUTION (3 brokers, RF=3)                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Topic: order-topic, 4 partitions, replication-factor=3                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        BROKER 1                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ P0 (LEADER) │  │ P1 (follower)│  │ P3 (follower)│             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        BROKER 2                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ P0 (follower)│  │ P1 (LEADER) │  │ P2 (follower)│             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        BROKER 3                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ P2 (LEADER) │  │ P3 (LEADER) │  │ P0 (follower)│             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  LEADER DISTRIBUTION:                                                  │
│  • Broker 1: Leader for P0                                             │
│  • Broker 2: Leader for P1                                             │
│  • Broker 3: Leader for P2, P3                                         │
│                                                                         │
│  ALL reads/writes go to LEADER only!                                   │
│  Followers just replicate for fault tolerance.                         │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Calculating Optimal Partition Count

```
┌────────────────────────────────────────────────────────────────────────┐
│             HOW MANY PARTITIONS DO I NEED?                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FACTORS TO CONSIDER:                                                  │
│  ────────────────────                                                  │
│                                                                         │
│  1. THROUGHPUT TARGET                                                  │
│     ─────────────────                                                  │
│     Formula: Partitions = max(Tp/Pp, Tc/Pc)                           │
│                                                                         │
│     Where:                                                             │
│     Tp = Target producer throughput (msgs/sec)                         │
│     Pp = Throughput per partition for producer                         │
│     Tc = Target consumer throughput (msgs/sec)                         │
│     Pc = Throughput per partition for consumer                         │
│                                                                         │
│     EXAMPLE:                                                           │
│     • Target: 100,000 msgs/sec                                         │
│     • Single partition producer: ~10,000 msgs/sec                      │
│     • Single partition consumer: ~5,000 msgs/sec                       │
│                                                                         │
│     Partitions = max(100000/10000, 100000/5000)                        │
│                = max(10, 20) = 20 partitions                           │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  2. CONSUMER PARALLELISM                                               │
│     ──────────────────                                                 │
│     Max consumers = Number of partitions                               │
│                                                                         │
│     If you expect 10 consumers max → at least 10 partitions            │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  3. BROKER CAPACITY                                                    │
│     ───────────────                                                    │
│     Each partition uses:                                               │
│     • File handles                                                     │
│     • Memory (index cache)                                             │
│     • CPU for replication                                              │
│                                                                         │
│     Rule of thumb: ≤ 4000 partitions per broker                       │
│                    ≤ 200,000 partitions per cluster                   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  RECOMMENDED FORMULA:                                                  │
│  ────────────────────                                                  │
│  Partitions = max(                                                     │
│    expectedThroughput / singlePartitionThroughput,                     │
│    expectedMaxConsumers                                                │
│  ) × 1.5  (growth buffer)                                              │
│                                                                         │
│  START SMALL, SCALE UP:                                                │
│  • Start with 6-12 partitions                                          │
│  • Monitor lag and throughput                                          │
│  • Add more if needed (can't remove!)                                  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Replication Explained

### ISR (In-Sync Replicas) Deep Dive

```
┌────────────────────────────────────────────────────────────────────────┐
│                    ISR MECHANISM                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  What makes a replica "in-sync"?                                       │
│  ────────────────────────────────                                      │
│  1. Connected to ZooKeeper/Controller                                  │
│  2. Fetched messages within replica.lag.time.max.ms (default 30s)      │
│                                                                         │
│  SCENARIO: Partition 0 with RF=3                                       │
│                                                                         │
│  TIME T0: All in sync                                                  │
│  ┌────────────────────────────────────────────────────┐               │
│  │ Leader (Broker 1)  │ Follower (Broker 2) │ Follower (Broker 3)│    │
│  │ Offset: 100        │ Offset: 100         │ Offset: 100        │    │
│  │                    │                     │                    │    │
│  │ ISR = [1, 2, 3]    │                     │                    │    │
│  └────────────────────────────────────────────────────┘               │
│                                                                         │
│  TIME T1: New message arrives, Broker 3 is slow                        │
│  ┌────────────────────────────────────────────────────┐               │
│  │ Leader (Broker 1)  │ Follower (Broker 2) │ Follower (Broker 3)│    │
│  │ Offset: 105        │ Offset: 105         │ Offset: 101        │    │
│  │                    │                     │ (lagging!)         │    │
│  │ ISR = [1, 2, 3]    │ (still OK, within   │                    │    │
│  │                    │  time window)       │                    │    │
│  └────────────────────────────────────────────────────┘               │
│                                                                         │
│  TIME T2: Broker 3 exceeds lag time                                    │
│  ┌────────────────────────────────────────────────────┐               │
│  │ Leader (Broker 1)  │ Follower (Broker 2) │ Follower (Broker 3)│    │
│  │ Offset: 200        │ Offset: 200         │ Offset: 150        │    │
│  │                    │                     │ (OUT OF SYNC!)     │    │
│  │ ISR = [1, 2] ⚠️    │                     │                    │    │
│  │ (3 removed!)       │                     │                    │    │
│  └────────────────────────────────────────────────────┘               │
│                                                                         │
│  IMPACT with acks=-1 and min.insync.replicas=2:                        │
│  • ISR=[1,2] → Still works (2 ≥ min.insync.replicas)                  │
│  • If Broker 2 also falls behind → ISR=[1] → PRODUCER BLOCKED!        │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Leader Election Scenarios

```
┌────────────────────────────────────────────────────────────────────────┐
│                    LEADER ELECTION SCENARIOS                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SCENARIO 1: Clean Leader Failure (ISR member takes over)              │
│  ─────────────────────────────────────────────────────                 │
│                                                                         │
│  Before:  Leader=B1, ISR=[B1, B2, B3]                                  │
│           B1: [0,1,2,3,4,5]                                            │
│           B2: [0,1,2,3,4,5]  ← In sync!                                │
│           B3: [0,1,2,3,4,5]  ← In sync!                                │
│                                                                         │
│  B1 fails 💥                                                           │
│                                                                         │
│  After:   Leader=B2, ISR=[B2, B3]                                      │
│           B2: [0,1,2,3,4,5]  ← New leader, NO DATA LOSS! ✅            │
│           B3: [0,1,2,3,4,5]                                            │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  SCENARIO 2: Unclean Leader Election (data loss possible)              │
│  ────────────────────────────────────────────────────────              │
│                                                                         │
│  Before:  Leader=B1, ISR=[B1]  (B2, B3 were slow)                      │
│           B1: [0,1,2,3,4,5,6,7,8,9]                                    │
│           B2: [0,1,2,3,4,5]        ← Behind!                           │
│           B3: [0,1,2,3,4]          ← Very behind!                      │
│                                                                         │
│  B1 fails 💥                                                           │
│                                                                         │
│  With unclean.leader.election.enable=true:                             │
│  After:   Leader=B2                                                    │
│           B2: [0,1,2,3,4,5]  ← Messages 6,7,8,9 LOST! ❌               │
│                                                                         │
│  With unclean.leader.election.enable=false (default):                  │
│  After:   PARTITION UNAVAILABLE until B1 recovers                      │
│           Availability sacrificed for consistency ✅                   │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  BEST PRACTICE:                                                        │
│  • Keep unclean.leader.election.enable=false (default)                 │
│  • Use min.insync.replicas=2 with acks=-1                              │
│  • Monitor ISR shrinkage alerts                                        │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Real-World Scenarios

### Scenario 1: E-Commerce Order Processing

```
┌────────────────────────────────────────────────────────────────────────┐
│              E-COMMERCE ORDER PROCESSING PIPELINE                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                       │
│  │   Checkout  │                                                       │
│  │   Service   │                                                       │
│  └──────┬──────┘                                                       │
│         │ order.created                                                │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              KAFKA: orders topic (key: orderId)                  │   │
│  │              Partitions: 12, RF: 3                               │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
│                             │                                          │
│         ┌───────────────────┼───────────────────────┐                  │
│         │                   │                       │                  │
│         ▼                   ▼                       ▼                  │
│  ┌─────────────┐     ┌─────────────┐        ┌─────────────┐           │
│  │  Payment    │     │  Inventory  │        │ Notification │           │
│  │  Service    │     │  Service    │        │   Service   │           │
│  │  (group-1)  │     │  (group-2)  │        │  (group-3)  │           │
│  └──────┬──────┘     └──────┬──────┘        └─────────────┘           │
│         │                   │                                          │
│         │ payment.processed │ inventory.reserved                       │
│         ▼                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              KAFKA: order-events topic                           │   │
│  └──────────────────────────┬───────────────────────────────────────┘   │
│                             │                                          │
│                             ▼                                          │
│                      ┌─────────────┐                                   │
│                      │  Shipping   │                                   │
│                      │  Service    │                                   │
│                      └─────────────┘                                   │
│                                                                         │
│  WHY THIS DESIGN?                                                      │
│  ────────────────                                                      │
│  • orderId as key → All events for same order in same partition       │
│  • Multiple consumer groups → Each service processes independently     │
│  • Events are permanent → Can replay for debugging/recovery            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

```javascript
// checkout-service/producer.js
const publishOrderCreated = async (order) => {
  await producer.send({
    topic: "orders",
    messages: [{
      key: order.orderId,  // Ensures ordering for this order
      value: JSON.stringify({
        eventType: "ORDER_CREATED",
        orderId: order.orderId,
        customerId: order.customerId,
        items: order.items,
        total: order.total,
        timestamp: new Date().toISOString(),
      }),
      headers: {
        "event-type": "ORDER_CREATED",
        "correlation-id": order.correlationId,
      },
    }],
  });
};

// payment-service/consumer.js
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());
    
    if (event.eventType === "ORDER_CREATED") {
      try {
        // Process payment
        const paymentResult = await processPayment(event);
        
        // Publish result
        await producer.send({
          topic: "order-events",
          messages: [{
            key: event.orderId,
            value: JSON.stringify({
              eventType: "PAYMENT_PROCESSED",
              orderId: event.orderId,
              success: paymentResult.success,
              transactionId: paymentResult.transactionId,
            }),
          }],
        });
        
        // Commit only after successful processing AND publishing
        await consumer.commitOffsets([{
          topic, partition,
          offset: (parseInt(message.offset) + 1).toString(),
        }]);
        
      } catch (error) {
        // Don't commit - message will be reprocessed
        console.error("Payment failed, will retry:", error);
        throw error;  // Triggers retry logic
      }
    }
  },
});
```

### Scenario 2: Real-Time Analytics Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│              REAL-TIME CLICKSTREAM ANALYTICS                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User clicks on website                                                │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────────────────┐  │
│  │   Web App   │────▶│  KAFKA: clicks (key: sessionId)             │  │
│  │             │     │  Partitions: 50, Retention: 7 days          │  │
│  └─────────────┘     └────────────────────┬────────────────────────┘  │
│                                           │                           │
│              ┌────────────────────────────┼────────────────────┐      │
│              │                            │                    │      │
│              ▼                            ▼                    ▼      │
│       ┌─────────────┐              ┌─────────────┐      ┌──────────┐ │
│       │  Flink/     │              │   Elastic   │      │  S3 +    │ │
│       │  Spark      │              │   Search    │      │  Athena  │ │
│       │  Streaming  │              │  (search)   │      │  (batch) │ │
│       └──────┬──────┘              └─────────────┘      └──────────┘ │
│              │                                                        │
│              │ aggregated metrics                                    │
│              ▼                                                        │
│       ┌─────────────┐              ┌─────────────┐                   │
│       │  KAFKA:     │─────────────▶│  Dashboard  │                   │
│       │  metrics    │              │  (real-time)│                   │
│       └─────────────┘              └─────────────┘                   │
│                                                                         │
│  KEY DESIGN DECISIONS:                                                 │
│  ─────────────────────                                                 │
│  • sessionId as key → Group user's clicks together                     │
│  • High partition count → Handle millions of events/sec                │
│  • 7-day retention → Can reprocess for debugging                       │
│  • Multiple consumers → Different processing needs                      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Microservices Event Sourcing

```
┌────────────────────────────────────────────────────────────────────────┐
│              EVENT SOURCING WITH KAFKA                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Traditional: Store current STATE                                      │
│  ───────────────────────────────                                       │
│  User table: { id: 1, balance: 100 }  ← Only know current balance     │
│                                                                         │
│  Event Sourcing: Store EVENTS                                          │
│  ────────────────────────────                                          │
│  Events:                                                               │
│  1. { type: "ACCOUNT_CREATED", userId: 1, balance: 0 }                │
│  2. { type: "DEPOSIT", userId: 1, amount: 150 }                       │
│  3. { type: "WITHDRAWAL", userId: 1, amount: 50 }                     │
│  Current balance = 0 + 150 - 50 = 100 ✓                               │
│                                                                         │
│  KAFKA AS EVENT STORE:                                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Topic: user-events (key: userId)                                │  │
│  │  Retention: infinite (log.retention.ms=-1)                       │  │
│  │  Compaction: enabled                                             │  │
│  │                                                                   │  │
│  │  Partition 0 (userId hashes here):                               │  │
│  │  ┌────────────────────────────────────────────────────────────┐ │  │
│  │  │ [CREATED] [DEPOSIT] [WITHDRAW] [DEPOSIT] [PROFILE_UPDATE]  │ │  │
│  │  │  user-1    user-1    user-1     user-1      user-1         │ │  │
│  │  └────────────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  BENEFITS:                                                             │
│  ─────────                                                             │
│  • Complete audit trail                                                │
│  • Time travel (rebuild state at any point)                            │
│  • Easy debugging                                                      │
│  • Decouple services                                                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

```javascript
// Event Sourcing Example
const { kafka } = require("./kafka");

// Event types
const EventTypes = {
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRANSFER: "TRANSFER",
};

// Command Handler (writes events)
const createAccount = async (userId, initialBalance = 0) => {
  await producer.send({
    topic: "account-events",
    messages: [{
      key: userId,
      value: JSON.stringify({
        type: EventTypes.ACCOUNT_CREATED,
        userId,
        initialBalance,
        timestamp: Date.now(),
      }),
    }],
  });
};

const deposit = async (userId, amount) => {
  await producer.send({
    topic: "account-events",
    messages: [{
      key: userId,
      value: JSON.stringify({
        type: EventTypes.DEPOSIT,
        userId,
        amount,
        timestamp: Date.now(),
      }),
    }],
  });
};

// Event Processor (builds read model)
const accountBalances = new Map();  // In-memory read model

const processEvent = (event) => {
  switch (event.type) {
    case EventTypes.ACCOUNT_CREATED:
      accountBalances.set(event.userId, event.initialBalance);
      break;
    case EventTypes.DEPOSIT:
      const balance = accountBalances.get(event.userId) || 0;
      accountBalances.set(event.userId, balance + event.amount);
      break;
    case EventTypes.WITHDRAWAL:
      const currentBalance = accountBalances.get(event.userId) || 0;
      accountBalances.set(event.userId, currentBalance - event.amount);
      break;
  }
};

// Consumer that builds the read model
await consumer.run({
  eachMessage: async ({ message }) => {
    const event = JSON.parse(message.value.toString());
    processEvent(event);
    console.log(`Processed ${event.type} for ${event.userId}`);
    console.log(`Current balance: ${accountBalances.get(event.userId)}`);
  },
});

// To rebuild state: consume from beginning!
await consumer.subscribe({ topics: ["account-events"], fromBeginning: true });
```

---

## 7. Performance Tuning

### Producer Tuning

```
┌────────────────────────────────────────────────────────────────────────┐
│                    PRODUCER PERFORMANCE TUNING                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BATCH SETTINGS                                                        │
│  ──────────────                                                        │
│                                                                         │
│  batch.size (default: 16384 bytes = 16KB)                              │
│  • Max bytes to batch before sending                                   │
│  • Larger = better throughput, higher latency                          │
│  • Recommended: 32KB - 64KB for high throughput                        │
│                                                                         │
│  linger.ms (default: 0)                                                │
│  • Time to wait for more messages before sending                       │
│  • 0 = send immediately (lowest latency)                               │
│  • 5-100ms = allows batching (higher throughput)                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                                                               │      │
│  │  linger.ms=0                    linger.ms=50                 │      │
│  │  ────────────                   ─────────────                │      │
│  │  Msg1 → Send                    Msg1 ─┐                      │      │
│  │  Msg2 → Send                    Msg2 ─┼─ Wait 50ms ─→ Send  │      │
│  │  Msg3 → Send                    Msg3 ─┘    (batched!)        │      │
│  │                                                               │      │
│  │  3 network calls                1 network call               │      │
│  │  Low throughput                 High throughput              │      │
│  │                                                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  COMPRESSION                                                           │
│  ───────────                                                           │
│                                                                         │
│  compression.type options:                                             │
│  • none (default) - No compression                                     │
│  • gzip - Best compression, highest CPU                                │
│  • snappy - Good balance (recommended)                                 │
│  • lz4 - Fastest compression/decompression                             │
│  • zstd - Best ratio with good speed (Kafka 2.1+)                     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │ Type    │ Compression Ratio │ CPU Usage │ Recommendation     │      │
│  ├──────────────────────────────────────────────────────────────┤      │
│  │ gzip    │ Best (60-70%)     │ Highest   │ Small messages     │      │
│  │ snappy  │ Good (50-60%)     │ Low       │ General use        │      │
│  │ lz4     │ OK (40-50%)       │ Lowest    │ Low latency        │      │
│  │ zstd    │ Great (55-65%)    │ Medium    │ Best overall       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  BUFFER MEMORY                                                         │
│  ─────────────                                                         │
│                                                                         │
│  buffer.memory (default: 32MB)                                         │
│  • Total memory for buffering records                                  │
│  • If full, send() blocks for max.block.ms                             │
│  • Increase for high-throughput producers                              │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Consumer Tuning

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CONSUMER PERFORMANCE TUNING                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FETCH SETTINGS                                                        │
│  ──────────────                                                        │
│                                                                         │
│  fetch.min.bytes (default: 1)                                          │
│  • Minimum data to fetch                                               │
│  • Higher = wait for more data, reduce requests                        │
│  • Recommended: 1KB - 1MB for batch processing                         │
│                                                                         │
│  fetch.max.wait.ms (default: 500ms)                                    │
│  • Max time to wait for fetch.min.bytes                                │
│  • Trade-off between latency and throughput                            │
│                                                                         │
│  max.partition.fetch.bytes (default: 1MB)                              │
│  • Max data per partition per fetch                                    │
│  • Increase if messages are large                                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │                                                               │      │
│  │  fetch.min.bytes=1           fetch.min.bytes=10000           │      │
│  │  ─────────────────           ────────────────────            │      │
│  │  Fetch: 1 message            Fetch: Wait for 10KB            │      │
│  │  Fetch: 1 message            └─ Or max.wait.ms               │      │
│  │  Fetch: 1 message                                            │      │
│  │  ...                         Fetch: Many messages (batched)  │      │
│  │                                                               │      │
│  │  Many small fetches          Few large fetches               │      │
│  │  Low latency                 High throughput                 │      │
│  │                                                               │      │
│  └──────────────────────────────────────────────────────────────┘      │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PROCESSING SETTINGS                                                   │
│  ───────────────────                                                   │
│                                                                         │
│  max.poll.records (default: 500)                                       │
│  • Max records returned per poll                                       │
│  • Lower if processing is slow (prevent timeout)                       │
│  • Higher for fast processing                                          │
│                                                                         │
│  max.poll.interval.ms (default: 300000 = 5 min)                        │
│  • Max time between poll() calls                                       │
│  • If exceeded, consumer kicked from group!                            │
│  • Increase for slow processing                                        │
│                                                                         │
│  ⚠️ COMMON ISSUE: Processing too slow                                  │
│  ──────────────────────────────────                                    │
│  Symptoms: Consumer keeps rebalancing                                  │
│  Solution: Reduce max.poll.records OR increase max.poll.interval.ms    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Tuning Cheat Sheet

```javascript
// High Throughput Producer Config
const highThroughputProducer = kafka.producer({
  allowAutoTopicCreation: false,
  idempotent: true,
  maxInFlightRequests: 5,
  // Batching
  batch: {
    size: 65536,  // 64KB batches
  },
});

// Send with compression and batching
await producer.send({
  topic: "high-volume-topic",
  compression: CompressionTypes.LZ4,
  messages: batchOfMessages,
});

// High Throughput Consumer Config
const highThroughputConsumer = kafka.consumer({
  groupId: "high-throughput-group",
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxBytesPerPartition: 1048576,  // 1MB per partition
  maxWaitTimeInMs: 100,
});

// Low Latency Producer Config
const lowLatencyProducer = kafka.producer({
  // Send immediately, no batching
  allowAutoTopicCreation: false,
});

// Low Latency Consumer Config  
const lowLatencyConsumer = kafka.consumer({
  groupId: "low-latency-group",
  maxWaitTimeInMs: 10,  // Don't wait long for data
});
```

---

## Summary: Key Takeaways

1. **Kafka = Append-only Log** - Sequential I/O makes it blazing fast
2. **Partitions = Parallelism** - More partitions = more consumers
3. **Keys = Ordering** - Same key → same partition → ordered
4. **Consumer Groups = Load Balancing** - Partitions distributed among consumers
5. **Replication = Fault Tolerance** - ISR ensures no data loss
6. **Offsets = Position** - Consumers track their position, can replay

Master these concepts and you'll ace any Kafka interview! 🎯

