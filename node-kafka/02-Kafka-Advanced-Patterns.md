# Kafka Advanced Patterns & Hands-On Exercises

## Table of Contents
1. [Delivery Semantics](#1-delivery-semantics)
2. [Idempotent Producers](#2-idempotent-producers)
3. [Transactions](#3-transactions)
4. [Error Handling & Retries](#4-error-handling--retries)
5. [Batch Processing](#5-batch-processing)
6. [Dead Letter Queues](#6-dead-letter-queues)
7. [Kafka Streams vs Consumer](#7-kafka-streams-vs-consumer)
8. [Schema Registry](#8-schema-registry)
9. [Hands-On Exercises](#9-hands-on-exercises)
10. [Common Pitfalls](#10-common-pitfalls)

---

## 1. Delivery Semantics

```
┌────────────────────────────────────────────────────────────────┐
│                    DELIVERY GUARANTEES                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AT-MOST-ONCE                                                   │
│  ─────────────                                                  │
│  • Commit offset BEFORE processing                              │
│  • Message may be lost if processing fails                      │
│  • No duplicates                                                │
│  • Use case: Logs, metrics (loss acceptable)                    │
│                                                                 │
│  AT-LEAST-ONCE (Most Common)                                    │
│  ──────────────────────────                                     │
│  • Commit offset AFTER processing                               │
│  • Message reprocessed if commit fails                          │
│  • May have duplicates                                          │
│  • Use case: Critical data with idempotent processing           │
│                                                                 │
│  EXACTLY-ONCE                                                   │
│  ────────────                                                   │
│  • Transactions + Idempotent producers                          │
│  • No loss, no duplicates                                       │
│  • Highest overhead                                             │
│  • Use case: Financial transactions                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Implementation Examples

```javascript
// AT-MOST-ONCE (Risky - may lose messages)
await consumer.run({
  eachMessage: async ({ message }) => {
    // Offset committed automatically before processing
    await processMessage(message); // If this fails, message lost!
  },
});

// AT-LEAST-ONCE (Your notification.consumer.js approach)
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ topic, partition, message }) => {
    await processMessage(message);  // Process first
    await consumer.commitOffsets([{  // Then commit
      topic,
      partition,
      offset: (parseInt(message.offset, 10) + 1).toString(),
    }]);
  },
});
```

---

## 2. Idempotent Producers

Idempotent producers ensure a message is written exactly once to a partition, even with retries.

```javascript
const producer = kafka.producer({
  idempotent: true,  // Enable idempotency
  maxInFlightRequests: 5,  // Max parallel requests (≤5 for idempotency)
});

await producer.connect();

// Even if network issues cause retries, message written only once
await producer.send({
  topic: 'order-topic',
  messages: [{ key: 'cust-1', value: JSON.stringify(order) }],
});
```

### How It Works

```
┌────────────────────────────────────────────────────────────────┐
│                  IDEMPOTENT PRODUCER                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Producer                              Broker                   │
│  ┌────────────┐                       ┌────────────┐           │
│  │ PID: 123   │──── Msg (seq=0) ─────▶│ Stores:    │           │
│  │ Epoch: 0   │                       │ PID=123    │           │
│  │            │◀─── ACK ──────────────│ seq=0 ✓    │           │
│  │            │                       │            │           │
│  │            │──── Msg (seq=0) ─────▶│ Duplicate! │           │
│  │            │◀─── DUPLICATE_SEQ ────│ Rejected   │           │
│  │            │                       │            │           │
│  │            │──── Msg (seq=1) ─────▶│ seq=1 ✓    │           │
│  │            │◀─── ACK ──────────────│            │           │
│  └────────────┘                       └────────────┘           │
│                                                                 │
│  PID = Producer ID (assigned by broker)                        │
│  Epoch = Generation number                                      │
│  seq = Sequence number per partition                           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Transactions

Transactions allow atomic writes across multiple topics/partitions.

```javascript
const producer = kafka.producer({
  transactionalId: 'order-transaction-producer',  // Required for transactions
  idempotent: true,
  maxInFlightRequests: 1,
});

await producer.connect();

const transaction = await producer.transaction();

try {
  // All or nothing - either all succeed or all fail
  await transaction.send({
    topic: 'orders',
    messages: [{ key: 'order-1', value: JSON.stringify({ orderId: 1 }) }],
  });
  
  await transaction.send({
    topic: 'inventory',
    messages: [{ key: 'product-1', value: JSON.stringify({ decrease: 1 }) }],
  });
  
  await transaction.commit();
  console.log('Transaction committed successfully');
} catch (error) {
  await transaction.abort();
  console.error('Transaction aborted:', error);
}
```

### Transaction Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    TRANSACTION FLOW                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. BEGIN TRANSACTION                                           │
│     └── Producer registers with Transaction Coordinator         │
│                                                                 │
│  2. SEND MESSAGES                                               │
│     └── Messages marked as "uncommitted" in partitions         │
│     └── Consumers with isolation.level=read_committed skip     │
│                                                                 │
│  3a. COMMIT                                                     │
│      └── All messages become visible                           │
│      └── Consumers can now read them                           │
│                                                                 │
│  3b. ABORT                                                      │
│      └── All messages discarded                                │
│      └── Like they were never sent                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Consumer Isolation Levels

```javascript
const consumer = kafka.consumer({
  groupId: 'my-group',
  // read_committed: Only see committed messages (for transactions)
  // read_uncommitted: See all messages (default)
  readUncommitted: false,  // Set to false for read_committed
});
```

---

## 4. Error Handling & Retries

### Producer Retries

```javascript
const producer = kafka.producer({
  retry: {
    retries: 5,           // Number of retries
    initialRetryTime: 100, // Initial delay (ms)
    maxRetryTime: 30000,   // Max delay (ms)
    factor: 2,             // Exponential backoff factor
  },
});
```

### Consumer Error Handling

```javascript
const { kafka } = require("./kafka");

const consumer = kafka.consumer({ groupId: "order-group" });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "order-topic", fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const order = JSON.parse(message.value.toString());
        await processOrder(order);
        
        // Commit only after successful processing
        await consumer.commitOffsets([{
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        }]);
        
      } catch (error) {
        console.error("Failed to process message:", error);
        
        // Option 1: Retry with backoff
        await retryWithBackoff(() => processOrder(order), 3);
        
        // Option 2: Send to Dead Letter Queue
        await sendToDeadLetterQueue(message, error);
        
        // Option 3: Skip and continue (commit anyway)
        await consumer.commitOffsets([{
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        }]);
      }
    },
  });
};

// Retry helper with exponential backoff
const retryWithBackoff = async (fn, maxRetries, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
};
```

---

## 5. Batch Processing

### Why Batch?
- Reduces network overhead
- Better throughput
- More efficient I/O

### Producer Batching

```javascript
const producer = kafka.producer({
  allowAutoTopicCreation: false,
  transactionTimeout: 30000,
});

// Send multiple messages at once
await producer.send({
  topic: 'order-topic',
  messages: [
    { key: 'cust-1', value: JSON.stringify({ orderId: 1 }) },
    { key: 'cust-2', value: JSON.stringify({ orderId: 2 }) },
    { key: 'cust-3', value: JSON.stringify({ orderId: 3 }) },
    // ... batch of messages
  ],
});

// Or use sendBatch for multiple topics
await producer.sendBatch({
  topicMessages: [
    {
      topic: 'orders',
      messages: [{ value: 'order1' }, { value: 'order2' }],
    },
    {
      topic: 'notifications',
      messages: [{ value: 'notify1' }],
    },
  ],
});
```

### Consumer Batch Processing

```javascript
await consumer.run({
  autoCommit: false,
  eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {
    console.log(`Received batch of ${batch.messages.length} messages`);
    
    for (const message of batch.messages) {
      // Process each message
      await processMessage(message);
      
      // Mark this message as processed
      resolveOffset(message.offset);
      
      // Send heartbeat to prevent session timeout
      await heartbeat();
    }
    
    // Commit all at once after batch processing
    await commitOffsetsIfNecessary();
  },
});
```

---

## 6. Dead Letter Queues

A DLQ stores messages that failed processing for later analysis.

```javascript
const { kafka } = require("./kafka");

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "order-group" });

const DLQ_TOPIC = "order-topic-dlq";

const sendToDeadLetterQueue = async (originalMessage, error) => {
  await producer.send({
    topic: DLQ_TOPIC,
    messages: [{
      key: originalMessage.key,
      value: JSON.stringify({
        originalMessage: JSON.parse(originalMessage.value.toString()),
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        originalTopic: "order-topic",
        originalPartition: originalMessage.partition,
        originalOffset: originalMessage.offset,
      }),
    }],
  });
};

const run = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topic: "order-topic", fromBeginning: true });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const order = JSON.parse(message.value.toString());
        await processOrder(order);
        
        await consumer.commitOffsets([{
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        }]);
        
      } catch (error) {
        console.error("Processing failed, sending to DLQ");
        
        // Send failed message to DLQ
        await sendToDeadLetterQueue(message, error);
        
        // Commit to move forward (don't block the queue)
        await consumer.commitOffsets([{
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        }]);
      }
    },
  });
};
```

### DLQ Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  DEAD LETTER QUEUE PATTERN                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌─────────────┐     ┌──────────┐            │
│  │ Producer │────▶│ order-topic │────▶│ Consumer │            │
│  └──────────┘     └─────────────┘     └────┬─────┘            │
│                                            │                   │
│                              ┌─────────────┼─────────────┐     │
│                              │             │             │     │
│                              ▼             ▼             ▼     │
│                          Success       Failure       Failure  │
│                              │             │             │     │
│                              ▼             ▼             ▼     │
│                          Process    ┌───────────┐   Retry 3x  │
│                           Done      │    DLQ    │      │      │
│                                     │order-dlq  │◀─────┘      │
│                                     └─────┬─────┘             │
│                                           │                    │
│                                           ▼                    │
│                                     ┌───────────┐             │
│                                     │  Manual   │             │
│                                     │  Review   │             │
│                                     └───────────┘             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Kafka Streams vs Consumer

```
┌────────────────────────────────────────────────────────────────┐
│              STREAMS vs CONSUMER API                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Consumer API (What you're using)                               │
│  ────────────────────────────────                               │
│  • Low-level control                                            │
│  • Simple consume-process patterns                              │
│  • Manual state management                                      │
│  • Node.js friendly                                             │
│                                                                 │
│  Kafka Streams (Java/Scala only)                                │
│  ───────────────────────────────                                │
│  • Built-in stateful processing                                 │
│  • Joins, aggregations, windowing                               │
│  • Exactly-once processing                                      │
│  • Auto state stores (RocksDB)                                  │
│                                                                 │
│  When to use what?                                              │
│  ─────────────────                                              │
│  Consumer API: Simple event handling, Node.js apps              │
│  Streams: Complex transformations, real-time analytics          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Schema Registry

Schema Registry ensures producers and consumers agree on message format.

```
┌────────────────────────────────────────────────────────────────┐
│                   SCHEMA REGISTRY                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐     ┌─────────────────┐     ┌──────────┐        │
│  │ Producer │────▶│ Schema Registry │◀────│ Consumer │        │
│  └────┬─────┘     │                 │     └────┬─────┘        │
│       │           │  ┌───────────┐  │          │              │
│       │           │  │ Schema v1 │  │          │              │
│       │           │  │ Schema v2 │  │          │              │
│       │           │  │ Schema v3 │  │          │              │
│       │           │  └───────────┘  │          │              │
│       │           └─────────────────┘          │              │
│       │                    │                    │              │
│       ▼                    ▼                    ▼              │
│  Validate schema     Store schemas      Validate schema       │
│  before sending      Ensure compat      when receiving        │
│                                                                 │
│  Benefits:                                                     │
│  • Prevent breaking changes                                    │
│  • Schema evolution support                                    │
│  • Smaller payloads (schema ID vs full schema)                │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Using with kafkajs (Avro example)

```javascript
// npm install @kafkajs/confluent-schema-registry

const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');

const registry = new SchemaRegistry({ host: 'http://localhost:8081' });

// Register a schema
const schema = {
  type: 'record',
  name: 'Order',
  fields: [
    { name: 'orderId', type: 'string' },
    { name: 'customerId', type: 'string' },
    { name: 'amount', type: 'double' },
  ],
};

const { id } = await registry.register({
  type: 'AVRO',
  schema: JSON.stringify(schema),
});

// Produce with schema
const encodedValue = await registry.encode(id, order);
await producer.send({
  topic: 'order-topic',
  messages: [{ value: encodedValue }],
});

// Consume with schema
await consumer.run({
  eachMessage: async ({ message }) => {
    const decodedOrder = await registry.decode(message.value);
    console.log(decodedOrder);
  },
});
```

---

## 9. Hands-On Exercises

### Exercise 1: Multi-Consumer Scaling

Test how Kafka distributes partitions across consumers.

```javascript
// Create topic with 4 partitions (run kafka.admin.js first)

// Terminal 1: Run consumer instance 1
// node notification.consumer.js

// Terminal 2: Run consumer instance 2
// node notification.consumer.js

// Terminal 3: Run producer
// node producer.js

// Observe: Each consumer handles different partitions!
```

### Exercise 2: Implement Consumer Lag Monitoring

```javascript
const { kafka } = require("./kafka");

const checkLag = async () => {
  const admin = kafka.admin();
  await admin.connect();

  const groupDescription = await admin.describeGroups(["notification-group"]);
  console.log("Group State:", groupDescription.groups[0].state);

  const offsets = await admin.fetchOffsets({ groupId: "notification-group", topics: ["order-topic"] });
  console.log("Current Offsets:", offsets);

  const topicOffsets = await admin.fetchTopicOffsets("order-topic");
  console.log("Topic End Offsets:", topicOffsets);

  // Calculate lag
  for (const partition of offsets[0].partitions) {
    const endOffset = topicOffsets.find(p => p.partition === partition.partition);
    const lag = parseInt(endOffset.high) - parseInt(partition.offset);
    console.log(`Partition ${partition.partition}: Lag = ${lag} messages`);
  }

  await admin.disconnect();
};

checkLag();
```

### Exercise 3: Implement Retry with DLQ

Create a complete error handling flow:

```javascript
// retry-consumer.js
const { kafka } = require("./kafka");

const MAX_RETRIES = 3;
const RETRY_TOPIC = "order-topic-retry";
const DLQ_TOPIC = "order-topic-dlq";

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "order-processor" });

const processOrder = async (order) => {
  // Simulate random failures
  if (Math.random() < 0.3) {
    throw new Error("Random processing failure");
  }
  console.log("✅ Processed:", order);
};

const run = async () => {
  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({ topics: ["order-topic", RETRY_TOPIC] });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      const headers = message.headers || {};
      const retryCount = parseInt(headers['retry-count']?.toString() || '0');
      
      try {
        const order = JSON.parse(message.value.toString());
        await processOrder(order);
        
      } catch (error) {
        console.log(`❌ Failed (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        if (retryCount < MAX_RETRIES - 1) {
          // Send to retry topic
          await producer.send({
            topic: RETRY_TOPIC,
            messages: [{
              key: message.key,
              value: message.value,
              headers: { 'retry-count': String(retryCount + 1) },
            }],
          });
        } else {
          // Max retries exceeded, send to DLQ
          console.log("💀 Max retries exceeded, sending to DLQ");
          await producer.send({
            topic: DLQ_TOPIC,
            messages: [{
              key: message.key,
              value: JSON.stringify({
                originalValue: JSON.parse(message.value.toString()),
                error: error.message,
                failedAt: new Date().toISOString(),
              }),
            }],
          });
        }
      }
      
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(message.offset, 10) + 1).toString(),
      }]);
    },
  });
};

run().catch(console.error);
```

### Exercise 4: Message Compression

Test different compression algorithms:

```javascript
const { kafka } = require("./kafka");
const { CompressionTypes } = require("kafkajs");

const producer = kafka.producer();

const testCompression = async () => {
  await producer.connect();

  const largeMessage = { data: "x".repeat(10000) };

  // Test different compression types
  const compressionTypes = [
    { name: "None", type: CompressionTypes.None },
    { name: "GZIP", type: CompressionTypes.GZIP },
    { name: "Snappy", type: CompressionTypes.Snappy },
    { name: "LZ4", type: CompressionTypes.LZ4 },
  ];

  for (const { name, type } of compressionTypes) {
    const start = Date.now();
    
    await producer.send({
      topic: "compression-test",
      compression: type,
      messages: Array(1000).fill({ value: JSON.stringify(largeMessage) }),
    });
    
    console.log(`${name}: ${Date.now() - start}ms`);
  }

  await producer.disconnect();
};

testCompression();
```

---

## 10. Common Pitfalls

### ❌ Pitfall 1: Blocking in Message Handler

```javascript
// BAD - Blocks the entire consumer
await consumer.run({
  eachMessage: async ({ message }) => {
    await sleep(10000);  // 10 second sleep blocks everything!
    await processMessage(message);
  },
});

// GOOD - Use async processing or batch
await consumer.run({
  eachMessage: async ({ message }) => {
    // Quick ack, process async if needed
    setImmediate(() => processMessageAsync(message));
  },
});
```

### ❌ Pitfall 2: Not Handling Rebalances

```javascript
// Consumer may receive same messages after rebalance
// Always design for at-least-once processing

await consumer.run({
  eachMessage: async ({ message }) => {
    // Use idempotent keys
    const processed = await redis.get(`processed:${message.key}`);
    if (processed) return; // Skip duplicates
    
    await processMessage(message);
    await redis.set(`processed:${message.key}`, '1', 'EX', 3600);
  },
});
```

### ❌ Pitfall 3: Too Many/Few Partitions

```
Too Few Partitions:
- Limited parallelism
- Consumers sitting idle
- Can't scale beyond partition count

Too Many Partitions:
- Memory overhead per partition
- Slower leader elections
- Increased latency
- More open file handles

RULE OF THUMB:
- Start with #partitions = 2 × expected max consumers
- Can always add more later (but can't remove)
```

### ❌ Pitfall 4: Ignoring Consumer Lag

```javascript
// Monitor lag regularly
// Alert if lag exceeds threshold

const alertThreshold = 10000;  // messages

const checkLag = async () => {
  const lag = await calculateLag();
  if (lag > alertThreshold) {
    await sendAlert(`Consumer lag critical: ${lag} messages`);
  }
};

setInterval(checkLag, 60000);  // Check every minute
```

### ❌ Pitfall 5: Large Messages

```
Kafka is optimized for small messages (< 1MB)

SOLUTIONS:
1. Store in S3/blob storage, send reference in Kafka
2. Enable compression
3. Chunk large messages
4. Increase max.message.bytes (last resort)
```

```javascript
// Pattern: Store large payload externally
const processLargeFile = async (file) => {
  // Upload to S3
  const s3Key = await uploadToS3(file);
  
  // Send only reference to Kafka
  await producer.send({
    topic: 'file-processing',
    messages: [{
      value: JSON.stringify({
        s3Key,
        size: file.size,
        type: file.type,
      }),
    }],
  });
};
```

---

## Summary Checklist

Before your interview, make sure you can explain:

- [ ] Core components (broker, topic, partition, offset)
- [ ] Consumer groups and partition assignment
- [ ] Message ordering guarantees
- [ ] Delivery semantics (at-least-once, exactly-once)
- [ ] Replication and fault tolerance
- [ ] Producer acknowledgments (acks)
- [ ] Offset management (auto vs manual commit)
- [ ] Rebalancing triggers and impacts
- [ ] When to use Kafka vs other message queues
- [ ] Common failure scenarios and handling

Good luck! 🚀




