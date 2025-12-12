# Chapter 10: Replication 🔄

Replication provides high availability and data redundancy through replica sets.

---

## Replica Set Basics

### What is a Replica Set?

```
┌─────────────────────────────────────────────────────────────────┐
│                        Replica Set                               │
│  ┌─────────┐       ┌─────────┐       ┌─────────┐               │
│  │ PRIMARY │ ───── │SECONDARY│ ───── │SECONDARY│               │
│  │  (R/W)  │ sync  │  (Read) │ sync  │  (Read) │               │
│  └─────────┘       └─────────┘       └─────────┘               │
│       │                │                  │                      │
│       └────────────────┴──────────────────┘                      │
│                    Election                                       │
└─────────────────────────────────────────────────────────────────┘
```

- **Primary**: Receives all write operations
- **Secondaries**: Replicate data from primary, can serve reads
- **Automatic Failover**: If primary fails, election occurs

---

## Setting Up Replica Set

### Docker Compose Example

```yaml
# docker-compose-replica.yml
version: '3.8'

services:
  mongo1:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo1_data:/data/db

  mongo2:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo2_data:/data/db

  mongo3:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo3_data:/data/db

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
```

### Initialize Replica Set

```javascript
// Connect to one node
mongosh "mongodb://localhost:27017"

// Initialize replica set
rs.initiate({
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", priority: 2 },
        { _id: 1, host: "mongo2:27017", priority: 1 },
        { _id: 2, host: "mongo3:27017", priority: 1 }
    ]
})

// Check status
rs.status()

// Check configuration
rs.conf()
```

### Connection String

```javascript
// Single node (development)
mongodb://localhost:27017

// Replica set (production)
mongodb://mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0

// With authentication
mongodb://user:pass@mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0&authSource=admin
```

---

## Replica Set Members

### Primary

```javascript
// Only member that accepts writes
// Elected by majority vote
// Records operations in oplog

db.isMaster()  // Check if connected to primary
// { "ismaster": true, "primary": "mongo1:27017", ... }
```

### Secondary

```javascript
// Replicates from primary's oplog
// Can serve read operations
// Participates in elections

// Force secondary to become primary
rs.stepDown()

// Prevent secondary from becoming primary
rs.reconfig({
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", priority: 2 },
        { _id: 1, host: "mongo2:27017", priority: 0 }  // Never primary
    ]
})
```

### Arbiter

```javascript
// Votes in elections but holds no data
// Use for odd number of voting members
// Minimal resource usage

rs.addArb("arbiter:27017")

// Or in config
{
    _id: 2,
    host: "arbiter:27017",
    arbiterOnly: true
}
```

### Hidden Members

```javascript
// Not visible to clients
// Won't become primary
// Used for reporting, backups

{
    _id: 3,
    host: "hidden1:27017",
    priority: 0,
    hidden: true
}
```

### Delayed Members

```javascript
// Replicates with delay
// Protection against human errors
// Can restore from point in time

{
    _id: 4,
    host: "delayed1:27017",
    priority: 0,
    hidden: true,
    secondaryDelaySecs: 3600  // 1 hour delay
}
```

---

## Oplog

### What is Oplog?

```javascript
// Capped collection storing operations
// Used for replication
// In local.oplog.rs

use local
db.oplog.rs.find().limit(5)

// Oplog entry example
{
    "ts": Timestamp(1704067200, 1),
    "t": NumberLong(1),
    "h": NumberLong("-5435823145725"),
    "v": 2,
    "op": "i",      // i=insert, u=update, d=delete
    "ns": "mydb.users",
    "o": { "_id": ObjectId("..."), "name": "John" }
}
```

### Oplog Size

```javascript
// Check oplog size
rs.printReplicationInfo()

// Output:
// configured oplog size:   990MB
// log length start to end: 176542secs (49.04hrs)
// oplog first event time:  Mon Jan 01 2024 00:00:00
// oplog last event time:   Tue Jan 02 2024 01:02:22
// now:                     Tue Jan 02 2024 01:02:22

// Resize oplog (MongoDB 4.0+)
db.adminCommand({replSetResizeOplog: 1, size: 2048})  // MB
```

---

## Read Preferences

### Read Preference Modes

```javascript
// primary (default)
// - Read from primary only
// - Strongest consistency
db.users.find().readPref('primary')

// primaryPreferred
// - Primary if available, otherwise secondary
db.users.find().readPref('primaryPreferred')

// secondary
// - Read from secondary only
db.users.find().readPref('secondary')

// secondaryPreferred
// - Secondary if available, otherwise primary
db.users.find().readPref('secondaryPreferred')

// nearest
// - Lowest network latency
db.users.find().readPref('nearest')
```

### With Tags

```javascript
// Configure member tags
{
    _id: 1,
    host: "us-east-1:27017",
    tags: { region: "us-east", dc: "dc1" }
}

// Read from specific region
db.users.find().readPref('secondary', [{ region: 'us-east' }])
```

### In Connection String

```javascript
// Read preference in URI
mongodb://host1,host2,host3/?replicaSet=rs0&readPreference=secondaryPreferred

// Node.js driver
const client = new MongoClient(uri, {
    readPreference: 'secondaryPreferred'
});
```

---

## Write Concern

### Write Concern Levels

```javascript
// w: 0 - No acknowledgment
db.users.insertOne({ name: 'John' }, { writeConcern: { w: 0 } })

// w: 1 - Acknowledged by primary (default)
db.users.insertOne({ name: 'John' }, { writeConcern: { w: 1 } })

// w: "majority" - Acknowledged by majority
db.users.insertOne({ name: 'John' }, { writeConcern: { w: 'majority' } })

// w: <number> - Acknowledged by n members
db.users.insertOne({ name: 'John' }, { writeConcern: { w: 2 } })
```

### Journal Concern

```javascript
// j: true - Wait for journal write
db.users.insertOne(
    { name: 'John' },
    { writeConcern: { w: 'majority', j: true } }
)

// Ensures durability even after crash
```

### Timeout

```javascript
// wtimeout - Max wait time for write concern
db.users.insertOne(
    { name: 'John' },
    { writeConcern: { w: 'majority', wtimeout: 5000 } }  // 5 seconds
)
```

---

## Failover and Elections

### Election Process

```javascript
// Election triggered when:
// 1. Primary becomes unavailable
// 2. Primary steps down
// 3. Member priority changes

// Priority determines election preference
// Higher priority = more likely to be primary
// Priority 0 = never primary

// Vote weight (default 1)
// Total votes must be odd for majority
```

### Force Election

```javascript
// Step down current primary
rs.stepDown()

// Step down for specific duration
rs.stepDown(60)  // 60 seconds

// Freeze secondary (prevent from becoming primary)
rs.freeze(300)  // 5 minutes
```

### Check Member States

```javascript
rs.status().members.forEach(m => {
    print(`${m.name}: ${m.stateStr}`);
});

// States:
// PRIMARY - Current primary
// SECONDARY - Replicating secondary
// ARBITER - Arbiter node
// STARTUP/STARTUP2 - Starting up
// RECOVERING - Recovering from error
// ROLLBACK - Rolling back writes
// DOWN - Not reachable
```

---

## Monitoring Replication

### Replication Lag

```javascript
// Check replication lag
rs.printSecondaryReplicationInfo()

// Output:
// source: mongo2:27017
//     syncedTo: Tue Jan 02 2024 01:02:22 GMT+0000
//     0 secs (0 hrs) behind the primary

// In status
rs.status().members.forEach(m => {
    if (m.state === 2) {  // Secondary
        const lag = new Date() - m.optimeDate;
        print(`${m.name}: ${lag/1000}s lag`);
    }
});
```

### Oplog Window

```javascript
// How far back can a new member sync?
rs.printReplicationInfo()

// If oplog window < sync time, full resync needed
```

---

## Adding/Removing Members

### Add Member

```javascript
// Add secondary
rs.add("mongo4:27017")

// Add with configuration
rs.add({
    host: "mongo4:27017",
    priority: 1,
    votes: 1
})

// Add arbiter
rs.addArb("arbiter:27017")
```

### Remove Member

```javascript
// Remove member
rs.remove("mongo4:27017")
```

### Reconfigure

```javascript
// Get current config
const config = rs.conf()

// Modify config
config.members[1].priority = 2

// Apply new config
rs.reconfig(config)

// Force reconfig (use carefully!)
rs.reconfig(config, { force: true })
```

---

## Best Practices

### Recommended Topology

```javascript
// 3 data-bearing members minimum
// Odd number for elections
// Geographic distribution for disaster recovery

// Production example:
// - Primary in DC1
// - Secondary in DC1
// - Secondary in DC2
// - Maybe arbiter in DC3
```

### Monitoring

```javascript
// Key metrics to monitor:
// 1. Replication lag
// 2. Oplog size and window
// 3. Member states
// 4. Network latency between members
// 5. Storage capacity
```

### Backup Strategy

```javascript
// Use hidden/delayed member for backups
// Point-in-time recovery with oplog
// Regular consistency checks
```

---

## Summary

In this chapter, you learned:
- ✅ Replica set architecture
- ✅ Primary, secondary, arbiter roles
- ✅ Setting up replica sets
- ✅ Oplog and replication
- ✅ Read preferences
- ✅ Write concerns
- ✅ Failover and elections
- ✅ Monitoring and management

---

**Next Chapter:** [Sharding →](./11-Sharding.md)



