# Apache Kafka - Interview Preparation Guide

## Table of Contents
1. [What is Kafka?](#1-what-is-kafka)
2. [Core Components](#2-core-components)
3. [Topics & Partitions](#3-topics--partitions)
4. [Producers](#4-producers)
5. [Consumers & Consumer Groups](#5-consumers--consumer-groups)
6. [Offsets & Commits](#6-offsets--commits)
7. [Replication & Fault Tolerance](#7-replication--fault-tolerance)
8. [Zookeeper vs KRaft](#8-zookeeper-vs-kraft)
9. [Message Ordering Guarantees](#9-message-ordering-guarantees)
10. [Interview Questions](#10-interview-questions)

---

## 1. What is Kafka?

**Apache Kafka** is a distributed, fault-tolerant, high-throughput **event streaming platform** used for:
- Real-time data pipelines
- Event-driven architectures
- Log aggregation
- Messaging systems
- Stream processing

### Why Kafka Over Traditional Message Queues?

| Feature | Kafka | Traditional MQ (RabbitMQ, ActiveMQ) |
|---------|-------|-------------------------------------|
| Message Persistence | Messages stored on disk | Messages deleted after consumption |
| Throughput | Millions of msgs/sec | Thousands of msgs/sec |
| Replay | Yes (offset-based) | No |
| Ordering | Per partition | FIFO per queue |
| Consumer Model | Pull-based | Push-based |
| Scaling | Horizontal (partitions) | Limited |

### Key Characteristics
```
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA CHARACTERISTICS                     │
├─────────────────────────────────────────────────────────────┤
│  📝 Persistent Storage    - Messages saved to disk          │
│  ⚡ High Throughput       - Millions of messages/second     │
│  📊 Scalable              - Add more brokers/partitions     │
│  🔄 Fault Tolerant        - Replication across brokers      │
│  ⏮️  Replayable           - Consume from any offset         │
│  🔌 Decoupled             - Producers/Consumers independent │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KAFKA ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐        ┌─────────────────────────────────────┐       │
│   │ Producer │───────▶│           KAFKA CLUSTER             │       │
│   └──────────┘        │  ┌─────────┐ ┌─────────┐ ┌─────────┐│       │
│   ┌──────────┐        │  │ Broker 1│ │ Broker 2│ │ Broker 3││       │
│   │ Producer │───────▶│  │         │ │         │ │         ││       │
│   └──────────┘        │  │ Topic A │ │ Topic A │ │ Topic B ││       │
│                       │  │ (P0,P1) │ │ (P2)    │ │ (P0-P2) ││       │
│                       │  └─────────┘ └─────────┘ └─────────┘│       │
│                       └─────────────────────────────────────┘       │
│                                       │                              │
│                                       ▼                              │
│                       ┌───────────────────────────────┐             │
│                       │      Consumer Groups          │             │
│                       │  ┌──────────┐ ┌──────────┐   │             │
│                       │  │Consumer 1│ │Consumer 2│   │             │
│                       │  └──────────┘ └──────────┘   │             │
│                       └───────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.1 Broker
- A single Kafka server
- Stores data and serves client requests
- Each broker identified by unique ID
- Cluster typically has 3+ brokers

```javascript
// Your broker configuration
const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:9092"], // Can specify multiple: ["broker1:9092", "broker2:9092"]
});
```

### 2.2 Topic
- Logical channel/category for messages
- Similar to a database table
- Topics are split into **partitions**

### 2.3 Partition
- Ordered, immutable sequence of messages
- Each message has a unique **offset** within partition
- Enables parallelism and scalability

### 2.4 Producer
- Publishes messages to topics
- Can specify partition or let Kafka decide

### 2.5 Consumer
- Reads messages from topics
- Part of a **Consumer Group**
- Tracks position via **offsets**

---

## 3. Topics & Partitions

### Topic Structure
```
┌──────────────────────────────────────────────────────────────┐
│                    TOPIC: order-topic                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Partition 0: [0][1][2][3][4][5][6] ──────▶ (oldest → newest)│
│                                                               │
│  Partition 1: [0][1][2][3][4] ────────────▶                  │
│                                                               │
│  Partition 2: [0][1][2][3][4][5][6][7] ───▶                  │
│                                                               │
│  Partition 3: [0][1][2] ──────────────────▶                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
         ▲                        ▲
         │                        │
     Offset                   Messages are APPENDED
                              (immutable log)
```

### Creating Topics with Partitions

```javascript
// From your kafka.admin.js
const createTopic = async () => {
  const kafkaAdmin = kafka.admin();
  await kafkaAdmin.connect();

  await kafkaAdmin.createTopics({
    topics: [
      {
        topic: "order-topic",
        numPartitions: 2,          // Number of partitions
        replicationFactor: 1,      // How many copies (for fault tolerance)
      },
    ],
  });

  await kafkaAdmin.disconnect();
};
```

### Adding Partitions (Scale Up)

```javascript
// You can ONLY increase partitions, never decrease!
const addPartition = async () => {
  const kafkaAdmin = kafka.admin();
  await kafkaAdmin.connect();

  await kafkaAdmin.createPartitions({
    topicPartitions: [
      {
        topic: "order-topic",
        count: 4, // Total partitions wanted (NOT how many more to add)
      },
    ],
  });

  await kafkaAdmin.disconnect();
};
```

### 🚨 Important: Partition Count Rules
1. **Cannot decrease** partition count
2. Increasing partitions **breaks key-based ordering** for existing data
3. Messages with same key may go to different partitions after resize

---

## 4. Producers

### Message Structure
```javascript
{
  topic: "order-topic",        // Which topic
  messages: [
    {
      key: "cust-1",           // Routing key (optional)
      value: JSON.stringify({  // Actual payload
        orderId: "order-1",
        customerId: "cust-1"
      }),
      headers: {               // Metadata (optional)
        "correlation-id": "abc123"
      },
      partition: 0,            // Explicit partition (optional)
      timestamp: Date.now()    // Message timestamp (optional)
    }
  ]
}
```

### Partitioning Strategies

```
┌───────────────────────────────────────────────────────────────────┐
│                    PARTITIONING STRATEGIES                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. KEY-BASED (Your approach - RECOMMENDED)                       │
│     ┌────────────────────────────────────────────────────┐        │
│     │ hash(key) % numPartitions = targetPartition        │        │
│     │                                                    │        │
│     │ "cust-1" ──hash──▶ 12345 % 4 = 1 ──▶ Partition 1  │        │
│     │ "cust-2" ──hash──▶ 67890 % 4 = 2 ──▶ Partition 2  │        │
│     └────────────────────────────────────────────────────┘        │
│     ✅ Same key always goes to same partition                     │
│     ✅ Guarantees ordering for same key                           │
│                                                                    │
│  2. ROUND-ROBIN (No key specified)                                │
│     Messages distributed evenly across partitions                 │
│     ❌ No ordering guarantee                                      │
│                                                                    │
│  3. MANUAL PARTITION                                              │
│     Explicitly specify partition number                           │
│     Use when you need custom logic                                │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### Producer Code Examples

```javascript
// 1. Key-based partitioning (from your producer.js)
await producer.send({
  topic: "order-topic",
  messages: [
    {
      key: order.customerId,  // All orders for same customer → same partition
      value: JSON.stringify(order),
    },
  ],
});

// 2. Round-robin (no key)
await producer.send({
  topic: "order-topic",
  messages: [
    {
      value: JSON.stringify(order),  // No key = round-robin
    },
  ],
});

// 3. Manual partition
await producer.send({
  topic: "order-topic",
  messages: [
    {
      partition: 2,  // Explicitly send to partition 2
      value: JSON.stringify(order),
    },
  ],
});
```

### Producer Acknowledgments (acks)

```javascript
const producer = kafka.producer({
  // acks configuration
  // 0 = Fire and forget (fastest, least reliable)
  // 1 = Leader acknowledged (balanced)
  // -1/all = All replicas acknowledged (slowest, most reliable)
});
```

```
┌────────────────────────────────────────────────────────────────┐
│                      ACKS COMPARISON                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  acks=0 (Fire & Forget)                                        │
│  ┌─────────┐      ┌─────────┐                                  │
│  │Producer │─────▶│ Broker  │  No response waited              │
│  └─────────┘      └─────────┘  ⚡ Fastest, 💀 May lose msgs    │
│                                                                 │
│  acks=1 (Leader Only)                                          │
│  ┌─────────┐      ┌─────────┐                                  │
│  │Producer │◀────▶│ Leader  │  Leader confirms                 │
│  └─────────┘      └─────────┘  ⚖️ Balanced                     │
│                                                                 │
│  acks=-1/all (All Replicas)                                    │
│  ┌─────────┐      ┌─────────┐                                  │
│  │Producer │◀────▶│ Leader  │───▶│Replica│                    │
│  └─────────┘      └─────────┘    │ ISR   │  All ISR confirm   │
│                                  └───────┘  🐢 Slowest, ✅ Safe│
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Consumers & Consumer Groups

### What is a Consumer Group?

A **Consumer Group** is a set of consumers that cooperatively consume messages from topics. Kafka ensures:
- Each partition is consumed by **only ONE consumer** within a group
- Different groups receive **all messages** independently

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CONSUMER GROUPS                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Topic: order-topic (4 partitions)                                 │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                       │
│   │  P0    │ │  P1    │ │  P2    │ │  P3    │                       │
│   └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘                       │
│       │          │          │          │                             │
│       ▼          ▼          ▼          ▼                             │
│   ┌──────────────────────────────────────────┐                      │
│   │    Consumer Group: notification-group    │                      │
│   │  ┌─────────┐  ┌─────────┐                │                      │
│   │  │Consumer1│  │Consumer2│                │                      │
│   │  │ P0, P1  │  │ P2, P3  │                │  2 consumers,        │
│   │  └─────────┘  └─────────┘                │  4 partitions        │
│   └──────────────────────────────────────────┘  = 2 partitions each │
│       │          │          │          │                             │
│       ▼          ▼          ▼          ▼                             │
│   ┌──────────────────────────────────────────┐                      │
│   │    Consumer Group: analytics-group       │                      │
│   │  ┌─────────┐                             │                      │
│   │  │Consumer1│                             │                      │
│   │  │P0,P1,P2,│                             │  1 consumer,         │
│   │  │   P3    │                             │  4 partitions        │
│   │  └─────────┘                             │  = all partitions    │
│   └──────────────────────────────────────────┘                      │
│                                                                      │
│   ⚠️ Both groups receive ALL messages independently!                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Consumer Group Rules

```
┌────────────────────────────────────────────────────────────────┐
│               PARTITION ASSIGNMENT RULES                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Consumers < Partitions                                         │
│  ────────────────────                                           │
│  4 Partitions, 2 Consumers → Each consumer gets 2 partitions   │
│                                                                 │
│  Consumers = Partitions                                         │
│  ──────────────────────                                         │
│  4 Partitions, 4 Consumers → Each consumer gets 1 partition    │
│  ✅ OPTIMAL configuration                                       │
│                                                                 │
│  Consumers > Partitions                                         │
│  ──────────────────────                                         │
│  4 Partitions, 6 Consumers → 2 consumers will be IDLE!         │
│  ❌ Wasteful                                                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Consumer Code Examples

```javascript
// From your analytics.consumer.js
const consumer = kafka.consumer({
  groupId: "analytics-group",  // Consumer Group ID
});

const run = async () => {
  await consumer.connect();
  
  await consumer.subscribe({
    topic: "order-topic",
    fromBeginning: true,  // Start from offset 0 (or use false for latest)
  });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        value: JSON.parse(message.value.toString()),
      });
    },
  });
};
```

### Rebalancing

When consumers join/leave a group, Kafka **rebalances** partition assignments:

```
┌────────────────────────────────────────────────────────────────┐
│                    REBALANCING TRIGGERS                         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Consumer JOINS the group                                    │
│     Before: C1 → [P0, P1, P2, P3]                              │
│     After:  C1 → [P0, P1], C2 → [P2, P3]                       │
│                                                                 │
│  2. Consumer LEAVES/CRASHES                                     │
│     Before: C1 → [P0, P1], C2 → [P2, P3]                       │
│     After:  C1 → [P0, P1, P2, P3]                              │
│                                                                 │
│  3. New partitions ADDED                                        │
│     Existing partitions redistributed                           │
│                                                                 │
│  ⚠️ During rebalance, consumption PAUSES!                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Offsets & Commits

### What is an Offset?

An **offset** is a unique, sequential ID for each message within a partition.

```
Partition 0: [0][1][2][3][4][5][6][7][8][9]
                           ▲
                           │
                   Current Consumer Offset
                   (Last committed: 5)
                   (Next to read: 6)
```

### Commit Strategies

```
┌────────────────────────────────────────────────────────────────┐
│                    COMMIT STRATEGIES                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. AUTO-COMMIT (Default)                                       │
│     ─────────────────────                                       │
│     Kafka commits periodically (every 5 seconds by default)    │
│     ✅ Simple, no code needed                                   │
│     ❌ May lose messages on crash                               │
│     ❌ May duplicate on restart                                 │
│                                                                 │
│  2. MANUAL COMMIT                                               │
│     ───────────────────                                         │
│     You control when to commit                                  │
│     ✅ At-least-once guarantee                                  │
│     ✅ Better control                                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Manual Commit Example

```javascript
// From your notification.consumer.js
await consumer.run({
  autoCommit: false,  // ⬅️ Disable auto-commit
  
  eachMessage: async ({ topic, partition, message }) => {
    // 1. Process the message
    console.log("Processing:", JSON.parse(message.value.toString()));
    
    // 2. Commit AFTER successful processing
    await consumer.commitOffsets([{
      topic,
      partition,
      offset: (parseInt(message.offset, 10) + 1).toString(),  // Next offset
    }]);
  },
});
```

### Offset Reset Policies

```javascript
await consumer.subscribe({
  topic: "order-topic",
  fromBeginning: true,   // 'earliest' - start from beginning
  // fromBeginning: false // 'latest' - start from newest messages
});
```

| Policy | Behavior |
|--------|----------|
| `earliest` | Read from beginning (offset 0) |
| `latest` | Read only new messages |
| `none` | Throw error if no committed offset |

---

## 7. Replication & Fault Tolerance

### Replication Factor

Each partition can have **replicas** across different brokers:

```
┌────────────────────────────────────────────────────────────────┐
│              REPLICATION (replication-factor=3)                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Topic: order-topic, Partition 0                               │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  Broker 1   │   │  Broker 2   │   │  Broker 3   │          │
│   │             │   │             │   │             │          │
│   │  P0 LEADER  │   │  P0 REPLICA │   │  P0 REPLICA │          │
│   │  ┌───────┐  │   │  ┌───────┐  │   │  ┌───────┐  │          │
│   │  │[0][1] │  │   │  │[0][1] │  │   │  │[0][1] │  │          │
│   │  │[2][3] │◀─┼───┼──│[2][3] │  │   │  │[2][3] │  │          │
│   │  └───────┘  │   │  └───────┘  │   │  └───────┘  │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│         ▲                 │                 │                   │
│         │                 │                 │                   │
│    Producers/         Replicas SYNC from Leader                 │
│    Consumers                                                    │
│    connect here                                                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Key Concepts

| Term | Description |
|------|-------------|
| **Leader** | Primary replica that handles all reads/writes |
| **Follower** | Replica that syncs from leader |
| **ISR** | In-Sync Replicas - followers caught up with leader |
| **Min ISR** | Minimum replicas that must acknowledge (for acks=all) |

### Fault Tolerance Scenario

```
┌────────────────────────────────────────────────────────────────┐
│                    LEADER ELECTION                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. Normal Operation                                           │
│      Broker 1 (Leader) ──▶ Broker 2, 3 (Followers)             │
│                                                                 │
│   2. Broker 1 FAILS 💥                                          │
│      ❌ Broker 1 ──▶ Broker 2, 3                                │
│                                                                 │
│   3. Election (Automatic)                                       │
│      Broker 2 becomes NEW LEADER ✓                              │
│      Broker 3 follows Broker 2                                  │
│                                                                 │
│   4. Recovery                                                   │
│      Broker 1 comes back as FOLLOWER                           │
│                                                                 │
│   ✅ No data loss if ISR had caught up                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Zookeeper vs KRaft

### Traditional: Zookeeper

```
┌────────────────────────────────────────────────────────────────┐
│                 ZOOKEEPER ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│        ┌─────────────────────┐                                  │
│        │     ZOOKEEPER       │                                  │
│        │   ENSEMBLE (3+)     │                                  │
│        │  ┌───┐ ┌───┐ ┌───┐  │                                  │
│        │  │ZK1│ │ZK2│ │ZK3│  │                                  │
│        │  └───┘ └───┘ └───┘  │                                  │
│        └──────────┬──────────┘                                  │
│                   │ Stores:                                     │
│                   │ • Broker membership                         │
│                   │ • Topic metadata                            │
│                   │ • Leader elections                          │
│                   │ • ACLs                                      │
│                   ▼                                             │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│   │ Broker 1│ │ Broker 2│ │ Broker 3│                          │
│   └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### New: KRaft Mode (Kafka 3.0+)

```
┌────────────────────────────────────────────────────────────────┐
│                    KRAFT ARCHITECTURE                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────┐          │
│   │              KAFKA CLUSTER                       │          │
│   │  ┌───────────┐ ┌───────────┐ ┌───────────┐     │          │
│   │  │ Broker 1  │ │ Broker 2  │ │ Broker 3  │     │          │
│   │  │           │ │           │ │           │     │          │
│   │  │ Controller│ │ Controller│ │ Controller│     │          │
│   │  │  (Voter)  │ │ (Leader)  │ │  (Voter)  │     │          │
│   │  └───────────┘ └───────────┘ └───────────┘     │          │
│   │                                                  │          │
│   │  ✅ No Zookeeper dependency                     │          │
│   │  ✅ Faster startup & recovery                   │          │
│   │  ✅ Simpler architecture                        │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Comparison

| Feature | Zookeeper | KRaft |
|---------|-----------|-------|
| External Dependency | Yes | No |
| Scaling Limit | ~200K partitions | Millions |
| Recovery Time | Slow | Fast |
| Operational Complexity | High | Low |
| Production Ready | Yes | Yes (3.3+) |

---

## 9. Message Ordering Guarantees

### Ordering Rules

```
┌────────────────────────────────────────────────────────────────┐
│                   ORDERING GUARANTEES                           │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ WITHIN a partition: GUARANTEED ordering                    │
│     Messages processed in exact order they were produced        │
│                                                                 │
│  ❌ ACROSS partitions: NO ordering guarantee                   │
│     Messages may be processed out of order                      │
│                                                                 │
│  Example with key-based partitioning:                           │
│                                                                 │
│  Producer sends:                                                │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Order 1 (cust-1) │ Order 2 (cust-2) │ Order 3 (cust-1)│     │
│  └──────────────────────────────────────────────────────┘      │
│                 │              │               │                │
│                 ▼              ▼               ▼                │
│           Partition 0     Partition 1    Partition 0           │
│           [Order 1] ─────────────────── [Order 3]              │
│                            [Order 2]                            │
│                                                                 │
│  ✅ cust-1 orders (1, 3) processed in order                    │
│  ✅ cust-2 orders processed independently                      │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Your Code Ensures Ordering!

```javascript
// From your producer.js
await producer.send({
  topic: "order-topic",
  messages: [
    {
      key: order.customerId,  // Same customer → same partition → ordered!
      value: JSON.stringify(order),
    },
  ],
});
```

---

## 10. Interview Questions

### Basic Questions

**Q1: What is Apache Kafka?**
> A distributed event streaming platform for building real-time data pipelines and streaming applications. It's fault-tolerant, scalable, and provides durable message storage.

**Q2: Explain Kafka's core components.**
> - **Producer**: Publishes messages to topics
> - **Consumer**: Reads messages from topics
> - **Broker**: Kafka server that stores data
> - **Topic**: Category/channel for messages
> - **Partition**: Ordered, immutable message log within a topic
> - **Consumer Group**: Set of consumers sharing workload

**Q3: What is a partition and why is it important?**
> A partition is an ordered, immutable sequence of messages. Partitions enable:
> - Parallelism (multiple consumers)
> - Scalability (distribute across brokers)
> - Ordering (guaranteed within partition)

**Q4: Explain Consumer Groups.**
> A consumer group is a set of consumers that share the same group ID. Kafka ensures each partition is consumed by only one consumer in the group, enabling load balancing.

### Intermediate Questions

**Q5: How does Kafka ensure message ordering?**
> Kafka guarantees ordering within a partition only. Use message keys to ensure related messages go to the same partition.

**Q6: What are offsets and how do they work?**
> Offsets are sequential IDs for messages within a partition. Consumers track their position using offsets. They can be auto-committed or manually committed after processing.

**Q7: Explain the difference between acks=0, 1, and -1.**
> - `acks=0`: Fire and forget, no acknowledgment
> - `acks=1`: Leader acknowledges receipt
> - `acks=-1/all`: All in-sync replicas acknowledge

**Q8: What happens when more consumers than partitions exist in a group?**
> Extra consumers remain idle. Number of active consumers ≤ number of partitions.

**Q9: What is rebalancing?**
> When consumers join/leave a group, Kafka redistributes partitions among remaining consumers. During rebalancing, consumption pauses temporarily.

### Advanced Questions

**Q10: What is ISR (In-Sync Replicas)?**
> ISR is the set of replicas that are fully caught up with the leader. When acks=-1, all ISR members must acknowledge before producer gets confirmation.

**Q11: How would you handle exactly-once semantics?**
> - Use idempotent producers (`enable.idempotence=true`)
> - Use transactions for atomic writes
> - Implement idempotent consumers (deduplication)

**Q12: What is the difference between Zookeeper and KRaft?**
> Zookeeper is an external coordination service. KRaft (Kafka Raft) is built into Kafka, eliminating external dependency, improving scalability, and simplifying operations.

**Q13: How would you design a system for processing 1M events/second?**
> - Multiple partitions for parallelism
> - Multiple consumer instances
> - Appropriate replication factor
> - Tune batch size and linger.ms
> - Use compression

**Q14: What causes consumer lag and how to handle it?**
> Lag occurs when consumers can't keep up with producers. Solutions:
> - Add more partitions and consumers
> - Optimize consumer processing
> - Increase consumer resources
> - Use batch processing

**Q15: Explain the difference between pub-sub and queue in Kafka.**
> - **Pub-Sub**: Multiple consumer groups each receive all messages
> - **Queue**: Single consumer group shares messages (each message processed once)

### Scenario-Based Questions

**Q16: Design an order processing system with Kafka.**
> ```
> Producer (Order Service) → order-topic (partitioned by customer_id)
>     ↓
> Consumer Group 1: Payment Processing
> Consumer Group 2: Inventory Update  
> Consumer Group 3: Notification Service
> ```

**Q17: How would you ensure a message is processed at least once?**
> - Set acks=-1 for producers
> - Disable auto-commit for consumers
> - Commit offset only after successful processing
> - Handle duplicates in application logic

**Q18: A consumer crashed. What happens to its messages?**
> - Consumer's partitions are reassigned to other consumers (rebalancing)
> - Messages from last committed offset are reprocessed
> - May cause duplicate processing (at-least-once semantics)

---

## Quick Reference Cheat Sheet

```
┌────────────────────────────────────────────────────────────────┐
│                    KAFKA CHEAT SHEET                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TERMINOLOGY                                                    │
│  ───────────                                                    │
│  Broker       = Kafka server                                    │
│  Topic        = Message category                                │
│  Partition    = Ordered log within topic                        │
│  Offset       = Message position in partition                   │
│  Consumer Group = Consumers sharing workload                    │
│  ISR          = In-Sync Replicas                               │
│  Leader       = Primary partition replica                       │
│                                                                 │
│  KEY FORMULAS                                                   │
│  ────────────                                                   │
│  Max Parallelism = Number of Partitions                        │
│  Partition = hash(key) % numPartitions                         │
│  Throughput ∝ Partitions × Consumers                           │
│                                                                 │
│  GUARANTEES                                                     │
│  ──────────                                                     │
│  ✅ Ordering within partition                                   │
│  ✅ At-least-once delivery                                     │
│  ✅ Exactly-once (with transactions)                           │
│  ❌ Ordering across partitions                                 │
│                                                                 │
│  BEST PRACTICES                                                 │
│  ──────────────                                                 │
│  • Partitions = 3× expected consumers                          │
│  • Replication factor = 3 (production)                         │
│  • Use keys for related messages                               │
│  • Manual commit for critical data                             │
│  • Monitor consumer lag                                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Practice with your existing code** - Run the producer and consumers
2. **Experiment** - Change partition counts, add consumers
3. **Monitor** - Use Kafka tools to check lag, offsets
4. **Advanced Topics** - Kafka Streams, Connect, Schema Registry

Happy learning! 🎉




