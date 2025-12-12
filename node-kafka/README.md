# Kafka Interview Preparation Guide 🎯

A comprehensive guide to learn Apache Kafka for interviews, with practical Node.js examples.

## 📚 Documentation

| File | Description |
|------|-------------|
| [01-Kafka-Fundamentals.md](./01-Kafka-Fundamentals.md) | Core concepts, architecture, components |
| [02-Kafka-Advanced-Patterns.md](./02-Kafka-Advanced-Patterns.md) | Advanced patterns, DLQ, transactions |
| [03-Kafka-Deep-Dive.md](./03-Kafka-Deep-Dive.md) | Internal workings, performance tuning |
| [04-Interview-QA-Detailed.md](./04-Interview-QA-Detailed.md) | 20+ interview questions with detailed answers |

## 🚀 Quick Start

### 1. Start Kafka (using Docker)

```bash
# Using your docker-compose file
docker-compose -f ../Docker/docker-compose.kafka.yml up -d
```

### 2. Create Topic with Partitions

```bash
node kafka.admin.js
```

### 3. Run Examples

```bash
# Terminal 1: Start a consumer
node notification.consumer.js

# Terminal 2: Start another consumer (same group - partitions will be split)
node notification.consumer.js

# Terminal 3: Start analytics consumer (different group - gets ALL messages)
node analytics.consumer.js

# Terminal 4: Produce messages
node producer.js
```

## 📁 File Structure

```
node-kafka/
├── kafka.js                    # Kafka client configuration
├── kafka.admin.js              # Topic creation and management
├── producer.js                 # Basic producer with key-based partitioning
├── notification.consumer.js    # Consumer with manual commit
├── analytics.consumer.js       # Consumer with auto commit
│
├── 01-Kafka-Fundamentals.md    # Learn fundamentals
├── 02-Kafka-Advanced-Patterns.md # Advanced patterns
├── 03-Kafka-Deep-Dive.md       # Deep dive internals
├── 04-Interview-QA-Detailed.md # Interview preparation
│
└── examples/
    ├── lag-monitor.js          # Monitor consumer lag
    ├── batch-producer.js       # Efficient batch producing
    ├── retry-consumer.js       # Retry with DLQ pattern
    ├── idempotent-consumer.js  # Exactly-once processing
    └── topic-admin.js          # Admin operations
```

## 🎓 Learning Path

### Week 1: Fundamentals
1. Read [01-Kafka-Fundamentals.md](./01-Kafka-Fundamentals.md)
2. Run `producer.js` and both consumers
3. Observe partition distribution with multiple consumer instances

### Week 2: Advanced Concepts
1. Read [02-Kafka-Advanced-Patterns.md](./02-Kafka-Advanced-Patterns.md)
2. Try `examples/retry-consumer.js` for error handling
3. Experiment with `examples/batch-producer.js`

### Week 3: Deep Dive
1. Read [03-Kafka-Deep-Dive.md](./03-Kafka-Deep-Dive.md)
2. Run `examples/lag-monitor.js` to understand consumer lag
3. Use `examples/topic-admin.js` to explore admin operations

### Week 4: Interview Prep
1. Review [04-Interview-QA-Detailed.md](./04-Interview-QA-Detailed.md)
2. Practice explaining concepts out loud
3. Draw architecture diagrams from memory

## 🔥 Key Concepts to Master

```
┌────────────────────────────────────────────────────────────────┐
│                    MUST-KNOW CONCEPTS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Topic, Partition, Offset                                   │
│  ✅ Consumer Groups & Rebalancing                              │
│  ✅ Producer ACKs (0, 1, -1)                                   │
│  ✅ Key-based Partitioning                                     │
│  ✅ Replication & ISR                                          │
│  ✅ At-least-once vs Exactly-once                              │
│  ✅ Manual vs Auto Commit                                      │
│  ✅ Idempotent Producers                                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 📝 Common Interview Questions

1. **What is Kafka and why use it?**
2. **Explain Consumer Groups**
3. **How does Kafka ensure ordering?**
4. **What is an ISR?**
5. **Explain ACKs (0, 1, -1)**
6. **How would you handle exactly-once processing?**
7. **What causes consumer lag?**
8. **How would you scale Kafka?**

See [04-Interview-QA-Detailed.md](./04-Interview-QA-Detailed.md) for detailed answers.

## 🛠️ Example Exercises

### Exercise 1: Observe Partition Distribution
```bash
# Terminal 1
node notification.consumer.js

# Terminal 2 (different instance)
node notification.consumer.js

# Observe: Partitions are split between consumers!
```

### Exercise 2: Test Consumer Lag
```bash
# Produce many messages
node examples/batch-producer.js

# Check lag
node examples/lag-monitor.js
```

### Exercise 3: Test Retry & DLQ
```bash
# Start retry consumer (30% failure rate)
node examples/retry-consumer.js

# Produce messages
node producer.js

# Watch retries and DLQ in action!
```

## 📊 Quick Reference

| Concept | Value |
|---------|-------|
| Max partitions/broker | ~4000 |
| Typical throughput | 1-2M msgs/sec |
| Default retention | 7 days |
| Recommended replication | 3 |
| min.insync.replicas | 2 |

## 🔗 Useful Commands

```bash
# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Describe topic
kafka-topics.sh --describe --topic order-topic --bootstrap-server localhost:9092

# Check consumer group lag
kafka-consumer-groups.sh --describe --group notification-group --bootstrap-server localhost:9092

# Reset offsets to earliest
kafka-consumer-groups.sh --reset-offsets --to-earliest --group notification-group --topic order-topic --execute --bootstrap-server localhost:9092
```

## 📖 Additional Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Confluent Developer](https://developer.confluent.io/)

---

Good luck with your interviews! 🎉



