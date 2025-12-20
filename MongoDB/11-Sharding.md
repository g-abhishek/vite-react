# Chapter 11: Sharding 📊

Sharding is MongoDB's approach to horizontal scaling, distributing data across multiple servers.

---

## Sharding Basics

### Why Shard?

```
Single Server:
┌────────────────────────────┐
│    All Data (100TB)        │
│    All Queries             │
│    Single Point of Failure │
└────────────────────────────┘

Sharded Cluster:
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Shard 1  │  │ Shard 2  │  │ Shard 3  │
│  (33TB)  │  │  (33TB)  │  │  (33TB)  │
└──────────┘  └──────────┘  └──────────┘
     ▲              ▲             ▲
     └──────────────┼─────────────┘
                    │
             ┌──────────┐
             │  Router  │
             │ (mongos) │
             └──────────┘
```

### When to Shard

```javascript
// Consider sharding when:
// - Single server can't handle data volume
// - Query throughput exceeds single server capacity
// - Geographic distribution required
// - Need to scale writes horizontally

// Don't shard too early:
// - Adds complexity
// - Need to choose shard key carefully
// - Harder to change later
```

---

## Sharded Cluster Components

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    mongos (Router)                           │
│              Routes queries to shards                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Shard 1     │   │   Shard 2     │   │   Shard 3     │
│ (Replica Set) │   │ (Replica Set) │   │ (Replica Set) │
└───────────────┘   └───────────────┘   └───────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Config Servers (Replica Set)                    │
│         Stores metadata and cluster configuration            │
└─────────────────────────────────────────────────────────────┘
```

### mongos (Query Router)

```javascript
// Routes client requests to appropriate shards
// Merges results from multiple shards
// Stateless - can run multiple for high availability
// Connect application to mongos, not directly to shards
```

### Config Servers

```javascript
// Stores cluster metadata:
// - Shard key ranges (chunks)
// - Shard locations
// - Authentication config

// Deployed as replica set (CSRS)
// Require 3+ members for production
```

### Shards

```javascript
// Each shard is a replica set
// Stores subset of sharded data
// Handles local queries
// Participates in distributed queries
```

---

## Shard Key

### What is a Shard Key?

```javascript
// Field(s) that determine data distribution
// Immutable after creation
// Included in every document

// Example: Shard by customerId
sh.shardCollection("mydb.orders", { customerId: 1 })

// Compound shard key
sh.shardCollection("mydb.orders", { customerId: 1, orderDate: 1 })
```

### Choosing a Shard Key

```javascript
// Good shard key properties:
// 1. High cardinality (many unique values)
// 2. Even distribution
// 3. Query isolation (queries hit single shard)
// 4. Write distribution (writes spread across shards)

// Bad shard keys:
// - Boolean (only 2 values)
// - Monotonically increasing (like ObjectId, timestamps)
// - Low cardinality (status: "active"/"inactive")
```

### Shard Key Strategies

```javascript
// 1. Ranged Sharding
// Data ranges on different shards
// Good for range queries
sh.shardCollection("mydb.users", { lastName: 1 })

// 2. Hashed Sharding
// Even distribution via hash
// Good for monotonic keys
sh.shardCollection("mydb.logs", { timestamp: "hashed" })

// 3. Zone Sharding
// Control data placement by region
sh.addShardToZone("shard1", "US")
sh.addShardToZone("shard2", "EU")
sh.updateZoneKeyRange(
    "mydb.users",
    { region: "US" },
    { region: "US" + "\uffff" },
    "US"
)
```

---

## Setting Up Sharded Cluster

### Docker Compose Example

```yaml
# docker-compose-sharded.yml
version: '3.8'

services:
  # Config servers
  config1:
    image: mongo:7.0
    command: mongod --configsvr --replSet configRS --bind_ip_all
    
  config2:
    image: mongo:7.0
    command: mongod --configsvr --replSet configRS --bind_ip_all
    
  config3:
    image: mongo:7.0
    command: mongod --configsvr --replSet configRS --bind_ip_all

  # Shard 1
  shard1a:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard1RS --bind_ip_all
    
  shard1b:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard1RS --bind_ip_all

  # Shard 2
  shard2a:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard2RS --bind_ip_all
    
  shard2b:
    image: mongo:7.0
    command: mongod --shardsvr --replSet shard2RS --bind_ip_all

  # Mongos router
  mongos:
    image: mongo:7.0
    command: mongos --configdb configRS/config1:27019,config2:27019,config3:27019 --bind_ip_all
    ports:
      - "27017:27017"
```

### Initialize Cluster

```javascript
// 1. Initialize config servers
mongosh --port 27019
rs.initiate({
    _id: "configRS",
    configsvr: true,
    members: [
        { _id: 0, host: "config1:27019" },
        { _id: 1, host: "config2:27019" },
        { _id: 2, host: "config3:27019" }
    ]
})

// 2. Initialize shard replica sets
mongosh --port 27018  // shard1
rs.initiate({
    _id: "shard1RS",
    members: [
        { _id: 0, host: "shard1a:27018" },
        { _id: 1, host: "shard1b:27018" }
    ]
})

// 3. Connect to mongos and add shards
mongosh --port 27017  // mongos
sh.addShard("shard1RS/shard1a:27018,shard1b:27018")
sh.addShard("shard2RS/shard2a:27018,shard2b:27018")

// 4. Enable sharding on database
sh.enableSharding("mydb")

// 5. Shard a collection
sh.shardCollection("mydb.orders", { customerId: "hashed" })
```

---

## Chunk Management

### What are Chunks?

```javascript
// Data divided into contiguous ranges (chunks)
// Default chunk size: 128MB
// Balancer moves chunks between shards

// View chunks
use config
db.chunks.find({ ns: "mydb.orders" })

// Chunk distribution
db.chunks.aggregate([
    { $match: { ns: "mydb.orders" } },
    { $group: { _id: "$shard", count: { $sum: 1 } } }
])
```

### Chunk Splitting

```javascript
// Automatic when chunk exceeds size
// Manual split
sh.splitAt("mydb.orders", { customerId: "C50000" })

// Split at midpoint
sh.splitFind("mydb.orders", { customerId: "C25000" })
```

### Balancer

```javascript
// Automatically balances chunks across shards

// Check balancer status
sh.getBalancerState()
sh.isBalancerRunning()

// Enable/disable balancer
sh.startBalancer()
sh.stopBalancer()

// Set balancing window
use config
db.settings.update(
    { _id: "balancer" },
    { $set: { 
        activeWindow: { 
            start: "02:00", 
            stop: "06:00" 
        } 
    }},
    { upsert: true }
)
```

---

## Query Routing

### Targeted Queries

```javascript
// Query includes shard key - routed to single shard
db.orders.find({ customerId: "C12345" })
// Fast: Only queries one shard

// With shard key prefix (compound key)
// Shard key: { customerId: 1, orderDate: 1 }
db.orders.find({ customerId: "C12345" })
// Also targeted to single shard
```

### Scatter-Gather Queries

```javascript
// Query doesn't include shard key
db.orders.find({ status: "pending" })
// Slow: Queries ALL shards, merges results

// Avoid scatter-gather for frequent queries
// Create indexes on non-shard-key fields
```

### Explain Sharded Query

```javascript
db.orders.find({ customerId: "C12345" }).explain()

// Look for:
// "winningPlan.shards" - which shards were queried
// "executionStats.nReturned" - per shard
```

---

## Zones (Tag-Aware Sharding)

```javascript
// Assign shards to zones
sh.addShardToZone("shard1", "US-EAST")
sh.addShardToZone("shard2", "US-WEST")
sh.addShardToZone("shard3", "EU")

// Assign key ranges to zones
sh.updateZoneKeyRange(
    "mydb.users",
    { region: "US-EAST", _id: MinKey },
    { region: "US-EAST", _id: MaxKey },
    "US-EAST"
)

// View zone assignments
sh.status()

// Use cases:
// - Geographic data locality
// - Tiered storage (hot/cold data)
// - Hardware-based routing (SSD vs HDD)
```

---

## Monitoring Sharded Clusters

### Cluster Status

```javascript
// Overall status
sh.status()

// Detailed output
sh.status({ verbose: true })

// Shard distribution
db.orders.getShardDistribution()
```

### Key Metrics

```javascript
// Per-shard operations
db.adminCommand({ serverStatus: 1 }).opcounters

// Chunk distribution
use config
db.chunks.aggregate([
    { $group: { 
        _id: { ns: "$ns", shard: "$shard" }, 
        count: { $sum: 1 } 
    }}
])

// Jumbo chunks (chunks that can't be split)
db.chunks.find({ jumbo: true })
```

---

## Common Issues

### Jumbo Chunks

```javascript
// Chunks exceeding max size that can't be split
// Caused by low-cardinality shard key

// Find jumbo chunks
use config
db.chunks.find({ jumbo: true })

// Clear jumbo flag after fixing data
db.chunks.update(
    { _id: chunkId },
    { $unset: { jumbo: 1 } }
)
```

### Uneven Distribution

```javascript
// Causes:
// - Poor shard key choice
// - Monotonically increasing keys
// - Zone configuration issues

// Solutions:
// - Use hashed shard key
// - Compound shard key with high cardinality
// - Pre-split chunks before bulk insert
```

### Performance Issues

```javascript
// Scatter-gather queries
// Solution: Include shard key in queries

// Chunk migrations during peak
// Solution: Schedule balancer window

// Hot shards
// Solution: Better shard key distribution
```

---

## Best Practices

```javascript
// 1. Choose shard key carefully
//    - Can't change after creation
//    - High cardinality + even distribution

// 2. Pre-split for bulk imports
sh.splitAt("mydb.collection", { key: value })

// 3. Monitor balancer
//    - Set maintenance windows
//    - Watch for failed migrations

// 4. Index shard key
//    - Improves query routing
//    - Required for hashed keys

// 5. Plan for growth
//    - Add shards before capacity issues
//    - Monitor storage and throughput
```

---

## Summary

In this chapter, you learned:
- ✅ Sharded cluster architecture
- ✅ mongos, config servers, shards
- ✅ Shard key selection strategies
- ✅ Setting up sharded cluster
- ✅ Chunk management and balancing
- ✅ Query routing (targeted vs scatter-gather)
- ✅ Zone-based sharding
- ✅ Monitoring and troubleshooting

---

**Next Chapter:** [Security →](./12-Security.md)




