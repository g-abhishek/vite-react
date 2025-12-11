# Kafka Interview Questions & Answers - Detailed Guide

## Table of Contents
1. [Conceptual Questions](#1-conceptual-questions)
2. [Architecture Questions](#2-architecture-questions)
3. [Producer Questions](#3-producer-questions)
4. [Consumer Questions](#4-consumer-questions)
5. [Partitioning & Ordering](#5-partitioning--ordering)
6. [Fault Tolerance & Replication](#6-fault-tolerance--replication)
7. [Performance & Scaling](#7-performance--scaling)
8. [Scenario-Based Questions](#8-scenario-based-questions)
9. [Troubleshooting Questions](#9-troubleshooting-questions)
10. [Comparison Questions](#10-comparison-questions)

---

## 1. Conceptual Questions

### Q1: What is Apache Kafka and why would you use it?

**Answer:**
Apache Kafka is a distributed event streaming platform designed for high-throughput, fault-tolerant, publish-subscribe messaging.

**Key Use Cases:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                         KAFKA USE CASES                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. MESSAGING                                                        │
│     └── Decoupling microservices                                    │
│     └── Async communication between systems                          │
│                                                                      │
│  2. ACTIVITY TRACKING                                                │
│     └── Clickstream data                                            │
│     └── User behavior analytics                                      │
│                                                                      │
│  3. LOG AGGREGATION                                                  │
│     └── Collect logs from multiple services                         │
│     └── Feed to ELK stack or similar                                │
│                                                                      │
│  4. STREAM PROCESSING                                                │
│     └── Real-time data transformation                               │
│     └── Event-driven architectures                                  │
│                                                                      │
│  5. EVENT SOURCING                                                   │
│     └── Store all state changes as events                           │
│     └── Rebuild state by replaying events                           │
│                                                                      │
│  6. COMMIT LOG                                                       │
│     └── Database replication                                        │
│     └── Distributed systems coordination                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Kafka over alternatives:**
- **Durability**: Messages persisted to disk, survives restarts
- **Scalability**: Horizontal scaling via partitions
- **Performance**: Millions of messages per second
- **Replay**: Consumers can re-read old messages
- **Ecosystem**: Connect, Streams, Schema Registry

---

### Q2: Explain Kafka's architecture in detail.

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KAFKA ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         PRODUCERS                                   │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │ │
│  │  │Producer 1│  │Producer 2│  │Producer 3│                          │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                          │ │
│  └───────┼─────────────┼─────────────┼────────────────────────────────┘ │
│          │             │             │                                   │
│          ▼             ▼             ▼                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      KAFKA CLUSTER                                  │ │
│  │                                                                     │ │
│  │    ┌─────────────────────────────────────────────────────────┐    │ │
│  │    │                TOPIC: orders                             │    │ │
│  │    │                                                          │    │ │
│  │    │   Partition 0    Partition 1    Partition 2              │    │ │
│  │    │   ┌─────────┐    ┌─────────┐    ┌─────────┐             │    │ │
│  │    │   │ Broker1 │    │ Broker2 │    │ Broker3 │  (Leaders)  │    │ │
│  │    │   │ [0,1,2] │    │ [0,1,2] │    │ [0,1,2] │             │    │ │
│  │    │   └─────────┘    └─────────┘    └─────────┘             │    │ │
│  │    │        │              │              │                   │    │ │
│  │    │   ┌────┴────┐    ┌───┴────┐    ┌───┴────┐              │    │ │
│  │    │   │Replicas │    │Replicas│    │Replicas│  (Followers) │    │ │
│  │    │   │B2, B3   │    │B1, B3  │    │B1, B2  │              │    │ │
│  │    │   └─────────┘    └────────┘    └────────┘              │    │ │
│  │    └──────────────────────────────────────────────────────────┘    │ │
│  │                                                                     │ │
│  │    ┌─────────────────────────────────────────────────────────┐    │ │
│  │    │           ZOOKEEPER / KRAFT CONTROLLER                   │    │ │
│  │    │  • Broker membership       • Leader election             │    │ │
│  │    │  • Topic configuration     • Access control              │    │ │
│  │    └─────────────────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│          │             │             │                                   │
│          ▼             ▼             ▼                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        CONSUMERS                                    │ │
│  │                                                                     │ │
│  │   Consumer Group A              Consumer Group B                   │ │
│  │   ┌──────┐ ┌──────┐            ┌──────┐                           │ │
│  │   │ C1   │ │ C2   │            │ C1   │                           │ │
│  │   │P0,P1 │ │ P2   │            │P0-P2 │                           │ │
│  │   └──────┘ └──────┘            └──────┘                           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Components Explained:**

| Component | Description |
|-----------|-------------|
| **Broker** | Kafka server that stores data and serves clients |
| **Topic** | Logical channel for organizing messages |
| **Partition** | Ordered, immutable sequence of messages within a topic |
| **Producer** | Client that publishes messages to topics |
| **Consumer** | Client that reads messages from topics |
| **Consumer Group** | Set of consumers that share work |
| **Zookeeper/KRaft** | Cluster coordination and metadata management |

---

### Q3: What is a Kafka Topic?

**Answer:**
A Topic is a category or feed name to which messages are published. Think of it as a table in a database or a folder in a filesystem.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KAFKA TOPIC                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Topic: "user-activity"                                                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  Configuration:                                                   │  │
│  │  ├── partitions: 6                                               │  │
│  │  ├── replication.factor: 3                                       │  │
│  │  ├── retention.ms: 604800000 (7 days)                            │  │
│  │  ├── retention.bytes: -1 (unlimited)                             │  │
│  │  ├── cleanup.policy: delete                                      │  │
│  │  └── min.insync.replicas: 2                                      │  │
│  │                                                                    │  │
│  │  Partitions (each is independent log):                            │  │
│  │                                                                    │  │
│  │  P0: [0][1][2][3][4][5] ─────────────────▶                       │  │
│  │  P1: [0][1][2][3][4] ────────────────────▶                       │  │
│  │  P2: [0][1][2][3][4][5][6][7] ───────────▶                       │  │
│  │  P3: [0][1][2][3] ───────────────────────▶                       │  │
│  │  P4: [0][1][2][3][4][5][6] ──────────────▶                       │  │
│  │  P5: [0][1][2] ──────────────────────────▶                       │  │
│  │          ↑                                                        │  │
│  │      Offsets (unique per partition)                              │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  KEY POINTS:                                                            │
│  • Messages are APPEND-ONLY (immutable once written)                    │
│  • Each partition can be on different broker                            │
│  • Partitions enable parallelism                                        │
│  • Order guaranteed ONLY within a partition                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Topic Naming Best Practices:**
```
✅ Good: user-events, order-created, payment-processed
❌ Bad: topic1, my_topic, UserEvents (avoid caps)

Convention: <domain>-<action> or <domain>.<subdomain>.<action>
Examples:
  - orders.created
  - orders.payment.completed
  - user-profile-updated
```

---

### Q4: What is a Partition and why do we need it?

**Answer:**

Partitions are the fundamental unit of parallelism in Kafka.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WHY PARTITIONS?                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WITHOUT PARTITIONS (Single queue):                                     │
│  ──────────────────────────────────                                     │
│                                                                          │
│  Producer ───▶ [msg1][msg2][msg3][msg4] ───▶ Consumer                   │
│                                                                          │
│  Problems:                                                               │
│  • Single consumer bottleneck                                           │
│  • No parallel processing                                               │
│  • Single point of failure                                              │
│  • Limited throughput                                                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  WITH PARTITIONS:                                                       │
│  ────────────────                                                       │
│                                                                          │
│                  ┌─▶ P0: [m1][m4][m7] ───▶ Consumer 1                  │
│  Producer ───────┼─▶ P1: [m2][m5][m8] ───▶ Consumer 2                  │
│                  └─▶ P2: [m3][m6][m9] ───▶ Consumer 3                  │
│                                                                          │
│  Benefits:                                                               │
│  ✅ Parallel processing (3 consumers)                                   │
│  ✅ Higher throughput                                                   │
│  ✅ Horizontal scaling                                                  │
│  ✅ Distributed across brokers                                          │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  PARTITION PROPERTIES:                                                  │
│                                                                          │
│  1. Ordered within partition                                            │
│     P0: [m1] → [m4] → [m7]  (m1 always before m4 before m7)            │
│                                                                          │
│  2. No ordering across partitions                                       │
│     m2 might be processed before m1!                                    │
│                                                                          │
│  3. Each partition is an independent log                                │
│     Own offset sequence, own leader                                     │
│                                                                          │
│  4. Partitions are distributed across brokers                           │
│     P0 → Broker 1, P1 → Broker 2, P2 → Broker 3                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**How many partitions should I create?**

```javascript
// Rule of thumb calculation
const targetThroughput = 100000;  // msgs/sec
const singlePartitionThroughput = 10000;  // msgs/sec (benchmark this!)
const expectedMaxConsumers = 10;

const partitionsForThroughput = Math.ceil(targetThroughput / singlePartitionThroughput);
const partitionsForParallelism = expectedMaxConsumers;

const recommendedPartitions = Math.max(partitionsForThroughput, partitionsForParallelism);
// Result: max(10, 10) = 10 partitions

// Add 50% buffer for growth
const finalPartitions = Math.ceil(recommendedPartitions * 1.5);
// Result: 15 partitions
```

---

### Q5: What is an Offset?

**Answer:**

An offset is a unique, sequential identifier for each message within a partition.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFSET EXPLAINED                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Partition 0:                                                           │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐         │
│  │  0  │  1  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │  9  │         │
│  │ msg │ msg │ msg │ msg │ msg │ msg │ msg │ msg │ msg │ msg │         │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘         │
│     ▲                             ▲                       ▲             │
│     │                             │                       │             │
│  Earliest                    Committed              Log End             │
│  Offset (0)                  Offset (5)             Offset (10)         │
│                                  │                                      │
│                          Consumer's position                            │
│                          (will read 6 next)                             │
│                                                                          │
│  OFFSET TYPES:                                                          │
│  ─────────────                                                          │
│                                                                          │
│  • Log Start Offset: Earliest available message (may not be 0!)        │
│    └── Older messages deleted by retention policy                       │
│                                                                          │
│  • Current Offset: Next message to be fetched                           │
│    └── Tracked by consumer in poll()                                    │
│                                                                          │
│  • Committed Offset: Last successfully processed message                │
│    └── Stored in __consumer_offsets topic                              │
│    └── Used for recovery after restart                                  │
│                                                                          │
│  • Log End Offset (LEO): Next offset to be written                      │
│    └── Also called High Watermark for replicas                         │
│                                                                          │
│  OFFSET STORAGE:                                                        │
│  ───────────────                                                        │
│                                                                          │
│  __consumer_offsets (internal topic)                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Key: [group-id, topic, partition]                                │   │
│  │ Value: [offset, metadata, timestamp]                             │   │
│  │                                                                   │   │
│  │ Example:                                                          │   │
│  │ ["notification-group", "orders", 0] → [5, null, 1699234567890]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Example - Working with Offsets:**

```javascript
// Your notification.consumer.js demonstrates manual offset management
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    console.log(`Processing offset ${message.offset}`);
    
    // Process message...
    await processMessage(message);
    
    // Commit the NEXT offset (current + 1)
    await consumer.commitOffsets([{
      topic,
      partition,
      offset: (parseInt(message.offset, 10) + 1).toString(),
    }]);
  },
});

// Seek to specific offset (useful for replay)
await consumer.seek({
  topic: "order-topic",
  partition: 0,
  offset: "100",  // Start reading from offset 100
});

// Seek to beginning
await consumer.seek({
  topic: "order-topic", 
  partition: 0,
  offset: "earliest",  // Or "latest" for newest
});
```

---

## 2. Architecture Questions

### Q6: Explain Consumer Groups in detail.

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONSUMER GROUPS DEEP DIVE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Topic: order-topic (6 partitions)                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                             │
│  │ P0 │ │ P1 │ │ P2 │ │ P3 │ │ P4 │ │ P5 │                             │
│  └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘                             │
│     │      │      │      │      │      │                                │
│     └──────┴──────┴──────┴──────┴──────┘                                │
│                    │                                                     │
│     ┌──────────────┴──────────────┐                                     │
│     │                              │                                     │
│     ▼                              ▼                                     │
│  ┌─────────────────────────┐   ┌─────────────────────────┐             │
│  │ Consumer Group:         │   │ Consumer Group:         │             │
│  │ "payment-service"       │   │ "analytics-service"     │             │
│  │                         │   │                         │             │
│  │ ┌─────────┐ ┌─────────┐│   │ ┌─────────┐             │             │
│  │ │Consumer1│ │Consumer2││   │ │Consumer1│             │             │
│  │ │P0,P1,P2 │ │P3,P4,P5 ││   │ │P0-P5    │ (all!)     │             │
│  │ └─────────┘ └─────────┘│   │ └─────────┘             │             │
│  └─────────────────────────┘   └─────────────────────────┘             │
│                                                                          │
│  KEY RULES:                                                             │
│  ──────────                                                             │
│  1. Each partition → exactly 1 consumer (within a group)                │
│  2. Each consumer → 0 to many partitions                                │
│  3. Different groups → completely independent                           │
│  4. All groups receive ALL messages                                     │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  CONSUMER COUNT SCENARIOS:                                              │
│  ─────────────────────────                                              │
│                                                                          │
│  Scenario A: 2 consumers, 6 partitions                                  │
│  ┌─────────┐      ┌─────────┐                                          │
│  │   C1    │      │   C2    │                                          │
│  │P0,P1,P2 │      │P3,P4,P5 │   ← Each handles 3 partitions            │
│  └─────────┘      └─────────┘                                          │
│                                                                          │
│  Scenario B: 6 consumers, 6 partitions (OPTIMAL)                        │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐                                  │
│  │ C1 ││ C2 ││ C3 ││ C4 ││ C5 ││ C6 │                                  │
│  │ P0 ││ P1 ││ P2 ││ P3 ││ P4 ││ P5 │   ← 1:1 mapping                  │
│  └────┘└────┘└────┘└────┘└────┘└────┘                                  │
│                                                                          │
│  Scenario C: 8 consumers, 6 partitions                                  │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐                      │
│  │ C1 ││ C2 ││ C3 ││ C4 ││ C5 ││ C6 ││ C7 ││ C8 │                      │
│  │ P0 ││ P1 ││ P2 ││ P3 ││ P4 ││ P5 ││IDLE││IDLE│  ← 2 wasted!        │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘└────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Your Code Example:**

```javascript
// analytics.consumer.js - Consumer Group "analytics-group"
const consumer = kafka.consumer({
  groupId: "analytics-group",  // This identifies the group
});

// notification.consumer.js - Consumer Group "notification-group"  
const consumer = kafka.consumer({
  groupId: "notification-group",
});

// Both groups receive ALL messages from order-topic independently!
// Run multiple instances of notification.consumer.js to see partitions distributed
```

---

### Q7: What is Rebalancing and when does it occur?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REBALANCING                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WHEN REBALANCING OCCURS:                                               │
│  ────────────────────────                                               │
│                                                                          │
│  1. Consumer JOINS the group                                            │
│     └── New instance started                                            │
│                                                                          │
│  2. Consumer LEAVES the group                                           │
│     └── Graceful shutdown                                               │
│     └── consumer.disconnect() called                                    │
│                                                                          │
│  3. Consumer FAILS (crash/network)                                      │
│     └── Missed heartbeats > session.timeout.ms                          │
│     └── poll() not called within max.poll.interval.ms                   │
│                                                                          │
│  4. Topic CHANGES                                                       │
│     └── New partitions added                                            │
│     └── Subscribed topic created/deleted                                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  REBALANCING PROCESS:                                                   │
│  ────────────────────                                                   │
│                                                                          │
│  Phase 1: STOP THE WORLD                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  All consumers stop processing                                   │   │
│  │  Pending commits may fail                                        │   │
│  │  ⚠️ CONSUMPTION PAUSED                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Phase 2: JOIN GROUP                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  All consumers send JoinGroup request                           │   │
│  │  Coordinator selects a LEADER (usually first member)            │   │
│  │  Leader receives member list                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Phase 3: SYNC GROUP                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Leader computes partition assignment                            │   │
│  │  Leader sends assignment to coordinator                          │   │
│  │  Coordinator distributes to all members                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Phase 4: RESUME                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Each consumer receives its partitions                           │   │
│  │  Consumers seek to last committed offset                         │   │
│  │  ✅ CONSUMPTION RESUMES                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  MINIMIZING REBALANCE IMPACT:                                           │
│  ────────────────────────────                                           │
│                                                                          │
│  1. Use static membership (group.instance.id)                           │
│     └── Consumer can rejoin without full rebalance                      │
│                                                                          │
│  2. Tune timeouts appropriately                                         │
│     └── session.timeout.ms: 30-45 seconds                               │
│     └── heartbeat.interval.ms: 1/3 of session timeout                   │
│                                                                          │
│  3. Use cooperative rebalancing (incremental)                           │
│     └── Only affected partitions are redistributed                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Producer Questions

### Q8: Explain the different acknowledgment modes (acks).

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCER ACKS EXPLAINED                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ACKS = 0 (Fire and Forget)                                             │
│  ──────────────────────────                                             │
│                                                                          │
│  Producer                    Leader                 Followers            │
│     │                          │                       │                │
│     │────── Message ──────────▶│                       │                │
│     │    (no wait)             │                       │                │
│     │                          │                       │                │
│     ▼                          ▼                       ▼                │
│  Continue                   May or may             May not              │
│  immediately               not persist             receive              │
│                                                                          │
│  Pros: Fastest, highest throughput                                      │
│  Cons: May lose messages                                                │
│  Use: Metrics, logs (loss acceptable)                                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ACKS = 1 (Leader Only)                                                 │
│  ──────────────────────                                                 │
│                                                                          │
│  Producer                    Leader                 Followers            │
│     │                          │                       │                │
│     │────── Message ──────────▶│                       │                │
│     │                          │──── Replicating ─────▶│                │
│     │◀───── ACK ───────────────│                       │                │
│     │                          │                       │                │
│     ▼                          ▼                       ▼                │
│  Continue                   Persisted              May lag              │
│  after ACK                  locally               behind                │
│                                                                          │
│  Pros: Good balance of speed and safety                                 │
│  Cons: May lose if leader fails before replication                      │
│  Use: Most production workloads                                         │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ACKS = -1 / ALL (All In-Sync Replicas)                                 │
│  ──────────────────────────────────────                                 │
│                                                                          │
│  Producer                    Leader                 Followers (ISR)     │
│     │                          │                       │                │
│     │────── Message ──────────▶│                       │                │
│     │                          │──── Replicating ─────▶│                │
│     │                          │◀──── Confirmed ───────│                │
│     │◀───── ACK ───────────────│                       │                │
│     │                          │                       │                │
│     ▼                          ▼                       ▼                │
│  Continue                   Persisted              Persisted            │
│  after ALL ACK              locally               on ALL ISR            │
│                                                                          │
│  Pros: Strongest durability guarantee                                   │
│  Cons: Highest latency                                                  │
│  Use: Financial transactions, critical data                             │
│                                                                          │
│  ⚠️ IMPORTANT: Combine with min.insync.replicas = 2                     │
│     Otherwise, if ISR = [leader only], acks=all = acks=1               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Example:**

```javascript
// Your producer uses default (acks=1 in kafkajs)
// For critical data, configure explicitly:

const criticalProducer = kafka.producer({
  idempotent: true,  // Enables exactly-once per partition
  maxInFlightRequests: 5,
  // acks is typically configured at broker level in kafkajs
  // or use transactions for strongest guarantees
});

// For fire-and-forget (logs/metrics):
const metricsProducer = kafka.producer({
  allowAutoTopicCreation: false,
  // kafkajs doesn't expose acks=0 directly, 
  // but you can not await the send() call
});

// Fire and forget pattern:
producer.send({
  topic: 'metrics',
  messages: [{ value: JSON.stringify(metric) }],
}).catch(console.error);  // Don't await, just log errors
```

---

### Q9: What is an Idempotent Producer?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IDEMPOTENT PRODUCER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PROBLEM: Duplicate Messages                                            │
│  ────────────────────────────                                           │
│                                                                          │
│  Normal Producer:                                                       │
│  ┌────────────┐                      ┌────────────┐                     │
│  │  Producer  │──── Message A ──────▶│   Broker   │                     │
│  │            │                      │   ✓ wrote  │                     │
│  │            │◀─────── ACK ─────────│            │                     │
│  │            │     (network fail!)  │            │                     │
│  │            │          ✗          │            │                     │
│  │   Timeout! │                      │            │                     │
│  │   Retry... │──── Message A ──────▶│   ✓ wrote  │  DUPLICATE!        │
│  │            │◀─────── ACK ─────────│            │                     │
│  └────────────┘                      └────────────┘                     │
│                                                                          │
│  Result: Message A written TWICE!                                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  SOLUTION: Idempotent Producer                                          │
│  ─────────────────────────────                                          │
│                                                                          │
│  ┌────────────┐                      ┌────────────┐                     │
│  │  Producer  │                      │   Broker   │                     │
│  │  PID: 123  │──── (PID=123,       │            │                     │
│  │  Seq: 0    │      Seq=0, MsgA) ──▶│   ✓ wrote  │                     │
│  │            │      Seq=0           │   PID=123  │                     │
│  │            │◀─────── ACK ─────────│   Seq=0 ✓  │                     │
│  │            │     (network fail!)  │            │                     │
│  │   Timeout! │                      │            │                     │
│  │   Retry... │──── (PID=123,       │            │                     │
│  │            │      Seq=0, MsgA) ──▶│   Seq=0    │                     │
│  │            │◀─── DUPLICATE! ──────│   already  │  REJECTED!         │
│  │            │                      │   seen!    │                     │
│  │   Move on  │──── (PID=123,       │            │                     │
│  │            │      Seq=1, MsgB) ──▶│   ✓ wrote  │                     │
│  └────────────┘                      └────────────┘                     │
│                                                                          │
│  Result: Each message written EXACTLY ONCE per partition!               │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  HOW IT WORKS:                                                          │
│  ─────────────                                                          │
│                                                                          │
│  • PID (Producer ID): Unique ID assigned by broker on connect           │
│  • Epoch: Generation number (increments on producer restart)            │
│  • Sequence Number: Per-partition, per-producer counter                 │
│                                                                          │
│  Broker tracks: Map<(PID, Partition) → LastSequenceNumber>             │
│  If incoming seq ≤ tracked seq → DUPLICATE, reject                     │
│  If incoming seq > tracked seq + 1 → OUT OF ORDER, error               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Example:**

```javascript
// Enable idempotent producer
const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,  // Must be ≤ 5 for idempotency
});

await producer.connect();

// Now retries are safe - no duplicates!
await producer.send({
  topic: 'orders',
  messages: [{ key: 'order-1', value: JSON.stringify(order) }],
});
```

---

## 4. Consumer Questions

### Q10: Explain the difference between auto-commit and manual commit.

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                AUTO-COMMIT vs MANUAL COMMIT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  AUTO-COMMIT (Default)                                                  │
│  ─────────────────────                                                  │
│                                                                          │
│  ┌─────────┐                                                            │
│  │ Message │─────▶ Process ─────▶ ✅ Success                            │
│  │   (0)   │                                                            │
│  └─────────┘                                                            │
│                    (5 seconds later, auto-commit offset=1)              │
│  ┌─────────┐                                                            │
│  │ Message │─────▶ Process ─────▶ 💥 CRASH!                            │
│  │   (1)   │                                                            │
│  └─────────┘                                                            │
│                                                                          │
│  After restart:                                                         │
│  - Last committed: 1                                                    │
│  - But message 1 wasn't fully processed!                                │
│  - ⚠️ MESSAGE 1 IS LOST (not reprocessed)                               │
│                                                                          │
│  OR opposite scenario:                                                  │
│  - Process succeeds                                                     │
│  - Crash BEFORE auto-commit                                             │
│  - ⚠️ MESSAGE REPROCESSED (duplicate)                                   │
│                                                                          │
│  Pros: Simple, no extra code                                            │
│  Cons: May lose or duplicate messages                                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  MANUAL COMMIT (Your notification.consumer.js)                          │
│  ─────────────────────────────────────────────                          │
│                                                                          │
│  ┌─────────┐                                                            │
│  │ Message │─────▶ Process ─────▶ ✅ Success ─────▶ Commit              │
│  │   (0)   │                                       (offset=1)           │
│  └─────────┘                                                            │
│                                                                          │
│  ┌─────────┐                                                            │
│  │ Message │─────▶ Process ─────▶ 💥 CRASH!                            │
│  │   (1)   │                                                            │
│  └─────────┘                                                            │
│                    (commit never happened)                              │
│                                                                          │
│  After restart:                                                         │
│  - Last committed: 1                                                    │
│  - Message 1 WILL be reprocessed                                        │
│  - ✅ AT-LEAST-ONCE guarantee                                           │
│                                                                          │
│  Pros: Control over exactly when to commit                              │
│  Cons: More code, need to handle duplicates                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Comparison:**

```javascript
// AUTO-COMMIT (simple but risky)
const consumer = kafka.consumer({ groupId: 'my-group' });
await consumer.run({
  autoCommit: true,           // Default
  autoCommitInterval: 5000,   // Commit every 5 seconds
  autoCommitThreshold: 100,   // Or every 100 messages
  
  eachMessage: async ({ message }) => {
    await processMessage(message);
    // Offset committed automatically in background
  },
});

// MANUAL COMMIT (your approach - safer)
const consumer = kafka.consumer({ groupId: 'my-group' });
await consumer.run({
  autoCommit: false,  // ⬅️ Disable auto-commit
  
  eachMessage: async ({ topic, partition, message }) => {
    try {
      // 1. Process message
      await processMessage(message);
      
      // 2. Commit AFTER successful processing
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(message.offset, 10) + 1).toString(),
      }]);
    } catch (error) {
      // Don't commit - message will be reprocessed
      console.error('Processing failed:', error);
      throw error;
    }
  },
});
```

---

## 5. Partitioning & Ordering

### Q11: How do you ensure message ordering in Kafka?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MESSAGE ORDERING IN KAFKA                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RULE: Ordering is ONLY guaranteed WITHIN a partition                   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  PROBLEM: Multiple partitions, no ordering                              │
│  ────────────────────────────────────────                               │
│                                                                          │
│  Producer sends: Order1, Order2, Order3 (for same customer)             │
│                                                                          │
│  Without key (round-robin):                                             │
│  P0: [Order1]                                                           │
│  P1: [Order2]                                                           │
│  P2: [Order3]                                                           │
│                                                                          │
│  Consumer might process: Order3, Order1, Order2 ❌ OUT OF ORDER!        │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  SOLUTION: Key-based partitioning (your approach!)                      │
│  ────────────────────────────────────────────────                       │
│                                                                          │
│  Producer sends with key = customerId:                                  │
│  Order1 (cust-1) ─────────┐                                             │
│  Order2 (cust-1) ─────────┼───▶ hash("cust-1") % 4 = 2 ───▶ P2         │
│  Order3 (cust-1) ─────────┘                                             │
│                                                                          │
│  P2: [Order1] [Order2] [Order3]                                         │
│                                                                          │
│  Consumer processes: Order1, Order2, Order3 ✅ ORDERED!                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  YOUR CODE (producer.js):                                               │
│  ────────────────────────                                               │
│                                                                          │
│  await producer.send({                                                  │
│    topic: "order-topic",                                                │
│    messages: [{                                                         │
│      key: order.customerId,  // ← All orders for same customer         │
│      value: JSON.stringify(order),                                      │
│    }],                       //   go to SAME partition!                 │
│  });                                                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  CAVEATS:                                                               │
│  ─────────                                                              │
│                                                                          │
│  1. Adding partitions BREAKS existing key mappings!                     │
│     hash("cust-1") % 4 = 2                                              │
│     hash("cust-1") % 6 = 4  ← Different partition!                      │
│                                                                          │
│  2. Single partition = bottleneck                                       │
│     If ALL messages need ordering → single partition → single consumer  │
│                                                                          │
│  3. Consumer parallelism limited                                        │
│     Can't parallelize within a partition                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Fault Tolerance & Replication

### Q12: Explain how Kafka achieves fault tolerance.

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KAFKA FAULT TOLERANCE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MECHANISM 1: REPLICATION                                               │
│  ────────────────────────                                               │
│                                                                          │
│  Each partition has multiple copies (replicas):                         │
│                                                                          │
│  Partition 0 (replication-factor=3):                                    │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │   Broker 1              Broker 2              Broker 3            │ │
│  │   ┌─────────┐          ┌─────────┐          ┌─────────┐          │ │
│  │   │  P0     │          │  P0     │          │  P0     │          │ │
│  │   │ LEADER  │◀────────▶│ FOLLOWER│◀────────▶│ FOLLOWER│          │ │
│  │   │[0,1,2,3]│  sync    │[0,1,2,3]│  sync    │[0,1,2,3]│          │ │
│  │   └─────────┘          └─────────┘          └─────────┘          │ │
│  │                                                                    │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  • All writes go to LEADER                                              │
│  • Followers continuously PULL from leader                              │
│  • ISR (In-Sync Replicas) = replicas that are caught up                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  MECHANISM 2: LEADER ELECTION                                           │
│  ───────────────────────────                                            │
│                                                                          │
│  Scenario: Broker 1 (Leader) fails                                      │
│                                                                          │
│  Before failure:                                                        │
│  ISR = [Broker1, Broker2, Broker3]                                      │
│  Leader = Broker1                                                       │
│                                                                          │
│  After failure:                                                         │
│  ISR = [Broker2, Broker3]                                               │
│  New Leader = Broker2 (automatic election!)                             │
│                                                                          │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐                 │
│  │  P0     │          │  P0     │          │  P0     │                 │
│  │ (DEAD)  │    💥    │ LEADER  │◀────────▶│ FOLLOWER│                 │
│  │   ❌    │          │[0,1,2,3]│  sync    │[0,1,2,3]│                 │
│  └─────────┘          └─────────┘          └─────────┘                 │
│                                                                          │
│  ✅ NO DATA LOSS (if follower was in ISR)                               │
│  ✅ AUTOMATIC failover                                                  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  MECHANISM 3: MIN.INSYNC.REPLICAS                                       │
│  ─────────────────────────────────                                      │
│                                                                          │
│  Configuration: min.insync.replicas = 2                                 │
│  Combined with: acks = -1 (all)                                         │
│                                                                          │
│  Scenario A: 3 replicas, 2 in ISR                                       │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐                 │
│  │ LEADER  │          │ FOLLOWER│          │ FOLLOWER│                 │
│  │  ISR ✓  │          │  ISR ✓  │          │  SLOW   │                 │
│  └─────────┘          └─────────┘          └─────────┘                 │
│                                                                          │
│  Producer with acks=-1: ✅ SUCCEEDS (2 ≥ min.insync.replicas)          │
│                                                                          │
│  Scenario B: 3 replicas, only 1 in ISR                                  │
│  ┌─────────┐          ┌─────────┐          ┌─────────┐                 │
│  │ LEADER  │          │  SLOW   │          │  SLOW   │                 │
│  │  ISR ✓  │          │  (lag)  │          │  (lag)  │                 │
│  └─────────┘          └─────────┘          └─────────┘                 │
│                                                                          │
│  Producer with acks=-1: ❌ FAILS! (1 < min.insync.replicas)            │
│  Error: NOT_ENOUGH_REPLICAS                                             │
│                                                                          │
│  Why fail? Better to reject than risk data loss if leader fails!       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Performance & Scaling

### Q13: How would you scale Kafka to handle more throughput?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SCALING KAFKA                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LEVEL 1: ADD PARTITIONS                                                │
│  ────────────────────────                                               │
│                                                                          │
│  Before: 4 partitions, 4 consumers → 100K msgs/sec                      │
│  After:  8 partitions, 8 consumers → 200K msgs/sec                      │
│                                                                          │
│  ⚠️ CAVEAT: Can't reduce partitions later!                              │
│  ⚠️ CAVEAT: Breaks key-based ordering for existing data                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  LEVEL 2: ADD CONSUMERS (within partition limit)                        │
│  ──────────────────────────────────────────────                         │
│                                                                          │
│  Before: 4 partitions, 2 consumers → each handles 2 partitions          │
│  After:  4 partitions, 4 consumers → each handles 1 partition           │
│                                                                          │
│  ✅ Quick win, no configuration change                                  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  LEVEL 3: ADD BROKERS                                                   │
│  ────────────────────                                                   │
│                                                                          │
│  Before: 3 brokers, 12 partitions → 4 partitions/broker                 │
│  After:  6 brokers, 12 partitions → 2 partitions/broker                 │
│                                                                          │
│  Benefits:                                                               │
│  • Better disk I/O distribution                                         │
│  • More network bandwidth                                               │
│  • Better fault tolerance                                               │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  LEVEL 4: PRODUCER OPTIMIZATION                                         │
│  ──────────────────────────────                                         │
│                                                                          │
│  const producer = kafka.producer({                                      │
│    // Batch settings                                                    │
│    batch: { size: 65536 },  // 64KB batches                            │
│    // linger equivalent in kafkajs is handled internally               │
│  });                                                                    │
│                                                                          │
│  // Use compression                                                     │
│  await producer.send({                                                  │
│    topic: 'high-volume',                                                │
│    compression: CompressionTypes.LZ4,                                   │
│    messages: batchOfMessages,                                           │
│  });                                                                    │
│                                                                          │
│  // Send in parallel                                                    │
│  await Promise.all([                                                    │
│    producer.send({ topic: 't1', messages: batch1 }),                    │
│    producer.send({ topic: 't2', messages: batch2 }),                    │
│  ]);                                                                    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  LEVEL 5: CONSUMER OPTIMIZATION                                         │
│  ──────────────────────────────                                         │
│                                                                          │
│  // Batch processing instead of one-by-one                              │
│  await consumer.run({                                                   │
│    eachBatch: async ({ batch, commitOffsetsIfNecessary }) => {         │
│      // Process entire batch                                            │
│      await processBatch(batch.messages);                                │
│      await commitOffsetsIfNecessary();                                  │
│    },                                                                   │
│  });                                                                    │
│                                                                          │
│  // Increase fetch size                                                 │
│  const consumer = kafka.consumer({                                      │
│    groupId: 'my-group',                                                 │
│    maxBytesPerPartition: 1048576,  // 1MB per partition                │
│  });                                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Scenario-Based Questions

### Q14: Design a notification system using Kafka.

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM DESIGN                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  REQUIREMENTS:                                                          │
│  • Send email, SMS, push notifications                                  │
│  • Handle millions of notifications/day                                 │
│  • Ensure delivery (at-least-once)                                      │
│  • Rate limiting per user                                               │
│  • Priority handling (urgent vs normal)                                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ARCHITECTURE:                                                          │
│                                                                          │
│  ┌──────────────┐                                                       │
│  │ Application  │                                                       │
│  │ Services     │                                                       │
│  └──────┬───────┘                                                       │
│         │                                                                │
│         │ notification.requested                                        │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ KAFKA: notification-requests                                     │   │
│  │ Partitions: 12 (key: userId for rate limiting)                  │   │
│  │ Priority topics: notification-requests-urgent                    │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  NOTIFICATION ROUTER                             │   │
│  │                  (Consumer Group)                                │   │
│  │                                                                   │   │
│  │  • Validate notification                                         │   │
│  │  • Apply rate limits (Redis)                                     │   │
│  │  • Check user preferences                                        │   │
│  │  • Route to appropriate channel                                  │   │
│  └─────────────────────────┬────────────────────────────────────────┘   │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                        │
│         │                  │                  │                        │
│         ▼                  ▼                  ▼                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │email-pending│    │ sms-pending │    │push-pending │                │
│  │  (topic)    │    │   (topic)   │    │  (topic)    │                │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│         │                  │                  │                        │
│         ▼                  ▼                  ▼                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │Email Sender │    │ SMS Sender  │    │Push Sender  │                │
│  │  (Group)    │    │   (Group)   │    │  (Group)    │                │
│  │             │    │             │    │             │                │
│  │ SendGrid/   │    │  Twilio/    │    │  FCM/APNS   │                │
│  │ SES         │    │  Vonage     │    │             │                │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                │
│         │                  │                  │                        │
│         └──────────────────┼──────────────────┘                        │
│                            │                                            │
│                            ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ KAFKA: notification-status                                       │   │
│  │ (delivered, failed, bounced)                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                            │                                            │
│                            ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Analytics Service  │  Retry Handler  │  DLQ Processor           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Implementation:**

```javascript
// notification-router.js
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_NOTIFICATIONS_PER_HOUR = 10;

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    const notification = JSON.parse(message.value.toString());
    
    try {
      // 1. Rate limit check
      const count = await redis.incr(`rate:${notification.userId}`);
      if (count === 1) {
        await redis.expire(`rate:${notification.userId}`, RATE_LIMIT_WINDOW);
      }
      if (count > MAX_NOTIFICATIONS_PER_HOUR) {
        console.log(`Rate limited: ${notification.userId}`);
        // Still commit - we're dropping this notification
        await commitOffset();
        return;
      }
      
      // 2. Check user preferences
      const prefs = await getUserPreferences(notification.userId);
      
      // 3. Route to appropriate channel topic
      const targetTopics = [];
      if (prefs.email && notification.channels.includes('email')) {
        targetTopics.push('email-pending');
      }
      if (prefs.sms && notification.channels.includes('sms')) {
        targetTopics.push('sms-pending');
      }
      if (prefs.push && notification.channels.includes('push')) {
        targetTopics.push('push-pending');
      }
      
      // 4. Send to channel-specific topics
      await producer.sendBatch({
        topicMessages: targetTopics.map(topic => ({
          topic,
          messages: [{
            key: notification.userId,
            value: JSON.stringify(notification),
          }],
        })),
      });
      
      // 5. Commit after successful routing
      await consumer.commitOffsets([{
        topic, partition,
        offset: (parseInt(message.offset) + 1).toString(),
      }]);
      
    } catch (error) {
      console.error('Routing failed:', error);
      // Don't commit - will be retried
      throw error;
    }
  },
});
```

---

### Q15: How would you handle exactly-once processing?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXACTLY-ONCE PROCESSING                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CHALLENGE: "Exactly-once" is hard in distributed systems              │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  APPROACH 1: Idempotent Consumers                                       │
│  ─────────────────────────────────                                      │
│                                                                          │
│  Store processed message IDs and skip duplicates:                       │
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Kafka     │───▶│  Consumer   │───▶│  Database   │                 │
│  │  Message    │    │             │    │             │                 │
│  │  (msgId:X)  │    │ Check if X  │    │ processed:  │                 │
│  │             │    │ processed   │    │ [A,B,C,X]   │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                            │                                            │
│                     Already processed?                                  │
│                     ├── Yes → Skip                                      │
│                     └── No → Process, then add to set                  │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  APPROACH 2: Transactional Outbox Pattern                               │
│  ────────────────────────────────────────                               │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     SINGLE DATABASE TRANSACTION                  │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ 1. Process business logic                                │    │   │
│  │  │ 2. Update business tables                                │    │   │
│  │  │ 3. Write to outbox table                                 │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Outbox Table                                                    │   │
│  │  ┌──────────┬───────────┬──────────┬─────────┐                  │   │
│  │  │    id    │   topic   │  payload │ status  │                  │   │
│  │  ├──────────┼───────────┼──────────┼─────────┤                  │   │
│  │  │    1     │  orders   │  {...}   │ pending │                  │   │
│  │  │    2     │  orders   │  {...}   │  sent   │                  │   │
│  │  └──────────┴───────────┴──────────┴─────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                       │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Outbox Processor (polls outbox, sends to Kafka)                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  APPROACH 3: Kafka Transactions (strongest guarantee)                   │
│  ────────────────────────────────────────────────────                   │
│                                                                          │
│  Read from Kafka → Process → Write to Kafka (all atomic!)              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code Example - Idempotent Consumer:**

```javascript
// Using Redis for deduplication
const processedKey = (msgId) => `processed:${msgId}`;

await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    const msgId = message.headers['message-id']?.toString() 
                  || `${topic}-${partition}-${message.offset}`;
    
    // Check if already processed
    const alreadyProcessed = await redis.get(processedKey(msgId));
    if (alreadyProcessed) {
      console.log(`Skipping duplicate: ${msgId}`);
      await commitOffset();
      return;
    }
    
    // Process message
    const order = JSON.parse(message.value.toString());
    await processOrder(order);
    
    // Mark as processed with TTL (e.g., 24 hours)
    await redis.set(processedKey(msgId), '1', 'EX', 86400);
    
    // Commit offset
    await consumer.commitOffsets([{
      topic, partition,
      offset: (parseInt(message.offset) + 1).toString(),
    }]);
  },
});
```

---

## 9. Troubleshooting Questions

### Q16: How would you debug consumer lag?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEBUGGING CONSUMER LAG                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  WHAT IS LAG?                                                           │
│  ────────────                                                           │
│                                                                          │
│  Lag = Latest Offset - Consumer's Committed Offset                      │
│                                                                          │
│  Example:                                                               │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ Partition 0: [0][1][2][3][4][5][6][7][8][9]                    │    │
│  │                              ▲              ▲                   │    │
│  │                              │              │                   │    │
│  │                        Committed       Log End                  │    │
│  │                        Offset (5)     Offset (10)              │    │
│  │                                                                 │    │
│  │              LAG = 10 - 5 = 5 messages                         │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  COMMON CAUSES:                                                         │
│  ──────────────                                                         │
│                                                                          │
│  1. Slow Processing                                                     │
│     • Each message takes too long                                       │
│     • Solution: Optimize processing, add consumers                      │
│                                                                          │
│  2. Too Few Consumers                                                   │
│     • Not enough parallelism                                            │
│     • Solution: Add more consumer instances                             │
│                                                                          │
│  3. Frequent Rebalances                                                 │
│     • Consumers keep joining/leaving                                    │
│     • Solution: Stabilize deployments, tune timeouts                    │
│                                                                          │
│  4. Network Issues                                                      │
│     • Slow fetches from broker                                          │
│     • Solution: Check network, increase fetch size                      │
│                                                                          │
│  5. Producer Burst                                                      │
│     • Sudden spike in messages                                          │
│     • Solution: Scale consumers, implement backpressure                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  MONITORING COMMANDS:                                                   │
│  ────────────────────                                                   │
│                                                                          │
│  # Check consumer group lag                                             │
│  kafka-consumer-groups.sh --bootstrap-server localhost:9092 \           │
│    --describe --group notification-group                                │
│                                                                          │
│  Output:                                                                │
│  GROUP             TOPIC        PARTITION  CURRENT-OFFSET  LOG-END  LAG │
│  notification-grp  order-topic  0          100             150      50  │
│  notification-grp  order-topic  1          200             220      20  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code to Monitor Lag:**

```javascript
// lag-monitor.js
const { kafka } = require("./kafka");

const checkLag = async () => {
  const admin = kafka.admin();
  await admin.connect();

  // Get current consumer offsets
  const offsets = await admin.fetchOffsets({ 
    groupId: "notification-group", 
    topics: ["order-topic"] 
  });

  // Get latest offsets (log end)
  const topicOffsets = await admin.fetchTopicOffsets("order-topic");

  console.log("Consumer Lag Report:");
  console.log("─".repeat(60));

  let totalLag = 0;
  
  for (const topicData of offsets) {
    for (const partition of topicData.partitions) {
      const endOffset = topicOffsets.find(
        p => p.partition === partition.partition
      );
      
      const consumerOffset = parseInt(partition.offset) || 0;
      const logEndOffset = parseInt(endOffset?.high) || 0;
      const lag = logEndOffset - consumerOffset;
      totalLag += lag;

      console.log(
        `Partition ${partition.partition}: ` +
        `Consumer=${consumerOffset}, End=${logEndOffset}, Lag=${lag}`
      );
    }
  }

  console.log("─".repeat(60));
  console.log(`Total Lag: ${totalLag} messages`);
  
  // Alert if lag is too high
  if (totalLag > 10000) {
    console.warn("⚠️ HIGH LAG ALERT! Consider scaling consumers.");
  }

  await admin.disconnect();
};

// Check every 30 seconds
setInterval(checkLag, 30000);
checkLag();
```

---

## 10. Comparison Questions

### Q17: When would you choose Kafka over RabbitMQ?

**Answer:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KAFKA vs RABBITMQ                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Feature            │ KAFKA                │ RABBITMQ                   │
│  ───────────────────┼──────────────────────┼────────────────────────────│
│  Model              │ Distributed log      │ Message broker             │
│  Delivery           │ Pull-based           │ Push-based                 │
│  Message Retention  │ Configurable (days)  │ Until consumed             │
│  Replay             │ ✅ Yes               │ ❌ No                       │
│  Ordering           │ Per partition        │ Per queue                  │
│  Throughput         │ Millions/sec         │ Thousands/sec              │
│  Routing            │ Topic/Partition      │ Exchanges/Bindings         │
│  Protocols          │ Kafka protocol       │ AMQP, MQTT, STOMP          │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  CHOOSE KAFKA WHEN:                                                     │
│  ──────────────────                                                     │
│                                                                          │
│  ✅ High throughput (millions of events/sec)                            │
│  ✅ Need message replay/audit trail                                     │
│  ✅ Event sourcing architecture                                         │
│  ✅ Real-time stream processing                                         │
│  ✅ Multiple consumers need same data                                   │
│  ✅ Log aggregation                                                     │
│                                                                          │
│  CHOOSE RABBITMQ WHEN:                                                  │
│  ────────────────────                                                   │
│                                                                          │
│  ✅ Complex routing logic (exchanges, bindings)                         │
│  ✅ Need priority queues                                                │
│  ✅ Request-reply pattern                                               │
│  ✅ Guaranteed delivery matters more than throughput                    │
│  ✅ Need multiple protocols (AMQP, MQTT)                                │
│  ✅ Simpler setup for small scale                                       │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  EXAMPLE SCENARIOS:                                                     │
│                                                                          │
│  Scenario                          │ Best Choice                        │
│  ──────────────────────────────────┼────────────────────────────────────│
│  IoT sensor data (1M events/sec)   │ Kafka                              │
│  Order processing system           │ Both work, Kafka for scale         │
│  Task queue for workers            │ RabbitMQ                           │
│  Real-time analytics pipeline      │ Kafka                              │
│  Email sending queue               │ RabbitMQ                           │
│  Event sourcing microservices      │ Kafka                              │
│  Chat message routing              │ RabbitMQ                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Interview Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTERVIEW CHEAT SHEET                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  MUST KNOW NUMBERS:                                                     │
│  • Throughput: 1-2 million msgs/sec per broker                          │
│  • Latency: 2-10ms typical                                              │
│  • Max partitions: ~4000 per broker, 200K per cluster                   │
│  • Retention default: 7 days                                            │
│  • Segment size default: 1GB                                            │
│                                                                          │
│  COMMON CONFIGURATIONS:                                                 │
│  • replication.factor: 3 (production)                                   │
│  • min.insync.replicas: 2                                               │
│  • acks: -1 (all) for durability                                        │
│  • session.timeout.ms: 30000                                            │
│  • heartbeat.interval.ms: 10000                                         │
│                                                                          │
│  KEY FORMULAS:                                                          │
│  • Partitions needed = max(throughput/single_partition, max_consumers)  │
│  • Partition = hash(key) % num_partitions                               │
│  • Lag = log_end_offset - consumer_offset                               │
│                                                                          │
│  GUARANTEES:                                                            │
│  • Ordering: Within partition only                                      │
│  • Delivery: At-least-once (default), Exactly-once (with transactions) │
│  • Durability: Based on replication factor and acks                     │
│                                                                          │
│  RED FLAGS TO MENTION:                                                  │
│  ❌ More consumers than partitions = wasted consumers                   │
│  ❌ Can't decrease partition count                                      │
│  ❌ Adding partitions breaks key-based ordering                         │
│  ❌ Large messages (>1MB) hurt performance                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

Good luck with your interviews! 🎯

