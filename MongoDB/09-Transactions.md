# Chapter 9: Transactions 🔐

MongoDB supports multi-document ACID transactions since version 4.0 (replica sets) and 4.2 (sharded clusters).

---

## ACID in MongoDB

### Single Document (Always ACID)

```javascript
// Single document operations are always atomic
db.accounts.updateOne(
    { _id: accountId },
    {
        $inc: { balance: -100 },
        $push: { 
            transactions: { 
                type: "withdrawal", 
                amount: 100, 
                date: new Date() 
            } 
        }
    }
)
// Both changes happen or neither happens
```

### Multi-Document Transactions

```javascript
// Required for atomic operations across multiple documents
const session = client.startSession();

try {
    session.startTransaction();
    
    // Debit account A
    await accounts.updateOne(
        { _id: accountA },
        { $inc: { balance: -100 } },
        { session }
    );
    
    // Credit account B
    await accounts.updateOne(
        { _id: accountB },
        { $inc: { balance: 100 } },
        { session }
    );
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}
```

---

## Transaction Basics

### Starting a Transaction

```javascript
// Node.js driver
const { MongoClient } = require('mongodb');

const client = new MongoClient(uri);
await client.connect();

const session = client.startSession();

session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary'
});
```

### Commit and Abort

```javascript
// Commit - save all changes
await session.commitTransaction();

// Abort - discard all changes
await session.abortTransaction();

// Always end session
session.endSession();
```

### Using with Callback API

```javascript
// Simpler callback-based API (handles retries)
await session.withTransaction(async () => {
    await accounts.updateOne(
        { _id: accountA },
        { $inc: { balance: -100 } },
        { session }
    );
    
    await accounts.updateOne(
        { _id: accountB },
        { $inc: { balance: 100 } },
        { session }
    );
});

session.endSession();
```

---

## Transaction Example: Money Transfer

```javascript
async function transferMoney(fromAccountId, toAccountId, amount) {
    const session = client.startSession();
    
    try {
        await session.withTransaction(async () => {
            const accounts = client.db('bank').collection('accounts');
            
            // Check source account has sufficient funds
            const sourceAccount = await accounts.findOne(
                { _id: fromAccountId },
                { session }
            );
            
            if (!sourceAccount || sourceAccount.balance < amount) {
                throw new Error('Insufficient funds');
            }
            
            // Debit source account
            await accounts.updateOne(
                { _id: fromAccountId },
                { 
                    $inc: { balance: -amount },
                    $push: {
                        transactions: {
                            type: 'transfer_out',
                            amount: -amount,
                            toAccount: toAccountId,
                            date: new Date()
                        }
                    }
                },
                { session }
            );
            
            // Credit destination account
            await accounts.updateOne(
                { _id: toAccountId },
                { 
                    $inc: { balance: amount },
                    $push: {
                        transactions: {
                            type: 'transfer_in',
                            amount: amount,
                            fromAccount: fromAccountId,
                            date: new Date()
                        }
                    }
                },
                { session }
            );
        });
        
        console.log('Transfer successful');
    } catch (error) {
        console.error('Transfer failed:', error.message);
        throw error;
    } finally {
        await session.endSession();
    }
}
```

---

## Read and Write Concerns

### Read Concern

```javascript
// Levels:
// "local"    - Most recent data (may be rolled back)
// "majority" - Data acknowledged by majority (durable)
// "snapshot" - Consistent point-in-time snapshot

session.startTransaction({
    readConcern: { level: 'snapshot' }
});

// For transactions, use "snapshot" for consistency
```

### Write Concern

```javascript
// Levels:
// { w: 0 }         - No acknowledgment
// { w: 1 }         - Acknowledged by primary
// { w: "majority" } - Acknowledged by majority

session.startTransaction({
    writeConcern: { w: 'majority' }
});

// For transactions, use "majority" for durability
```

### Read Preference

```javascript
// Where to read from:
// "primary"           - Only primary (default for transactions)
// "primaryPreferred"  - Primary, secondary if unavailable
// "secondary"         - Only secondaries
// "secondaryPreferred"- Secondaries, primary if unavailable
// "nearest"           - Lowest network latency

session.startTransaction({
    readPreference: 'primary'  // Required for transactions
});
```

---

## Error Handling

### Transient Errors

```javascript
// Transient errors are retry-safe
async function runTransactionWithRetry(txnFunc, session) {
    while (true) {
        try {
            await txnFunc(session);
            break;
        } catch (error) {
            if (
                error.hasErrorLabel &&
                error.hasErrorLabel('TransientTransactionError')
            ) {
                console.log('Transient error, retrying...');
                continue;
            }
            throw error;
        }
    }
}
```

### Commit Errors

```javascript
// Commit might need retry
async function commitWithRetry(session) {
    while (true) {
        try {
            await session.commitTransaction();
            console.log('Transaction committed');
            break;
        } catch (error) {
            if (
                error.hasErrorLabel &&
                error.hasErrorLabel('UnknownTransactionCommitResult')
            ) {
                console.log('Commit error, retrying...');
                continue;
            }
            throw error;
        }
    }
}
```

### Full Retry Pattern

```javascript
async function runTransaction(client, txnFunc) {
    const session = client.startSession();
    
    try {
        await session.withTransaction(txnFunc, {
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            maxCommitTimeMS: 1000
        });
    } finally {
        await session.endSession();
    }
}

// withTransaction automatically handles:
// - TransientTransactionError retries
// - UnknownTransactionCommitResult retries
```

---

## Transaction Limitations

### 16MB Document Size

```javascript
// Transaction size limit = 16MB total
// Large transactions should be split

// Instead of:
await session.withTransaction(async () => {
    for (let i = 0; i < 1000000; i++) {
        await collection.insertOne({ ... }, { session });
    }
});

// Do batch processing:
const BATCH_SIZE = 1000;
for (let batch = 0; batch < totalBatches; batch++) {
    await session.withTransaction(async () => {
        const docs = getBatch(batch, BATCH_SIZE);
        await collection.insertMany(docs, { session });
    });
}
```

### Time Limits

```javascript
// Default: 60 seconds max transaction lifetime
// Can be adjusted:
session.startTransaction({
    maxCommitTimeMS: 30000  // 30 seconds for commit
});

// Server-side limit (requires admin):
db.adminCommand({
    setParameter: 1,
    transactionLifetimeLimitSeconds: 120
});
```

### DDL Operations

```javascript
// Cannot run in transactions:
// - Creating collections
// - Creating indexes
// - Dropping collections/databases

// This will fail:
await session.withTransaction(async () => {
    await db.createCollection('newCollection');  // Error!
});
```

### Cross-Shard Transactions

```javascript
// Supported in MongoDB 4.2+
// Higher latency than single-shard
// Use with caution in high-throughput systems
```

---

## Mongoose Transactions

```javascript
const mongoose = require('mongoose');

// Method 1: Using session
const session = await mongoose.startSession();
session.startTransaction();

try {
    const user = await User.create([{ name: 'John' }], { session });
    await Account.create([{ userId: user[0]._id, balance: 100 }], { session });
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}

// Method 2: Using withTransaction
await mongoose.connection.transaction(async (session) => {
    const user = await User.create([{ name: 'John' }], { session });
    await Account.create([{ userId: user[0]._id, balance: 100 }], { session });
});

// Method 3: Using Connection.transaction
const session = await mongoose.startSession();

await session.withTransaction(async () => {
    await User.findByIdAndUpdate(userId, { $inc: { balance: -100 } }, { session });
    await User.findByIdAndUpdate(otherId, { $inc: { balance: 100 } }, { session });
});
```

---

## Practical Examples

### Order Processing

```javascript
async function processOrder(orderId) {
    const session = client.startSession();
    
    try {
        await session.withTransaction(async () => {
            const db = client.db('ecommerce');
            
            // Get order
            const order = await db.collection('orders').findOne(
                { _id: orderId, status: 'pending' },
                { session }
            );
            
            if (!order) {
                throw new Error('Order not found or already processed');
            }
            
            // Check and update inventory for each item
            for (const item of order.items) {
                const result = await db.collection('products').updateOne(
                    { 
                        _id: item.productId,
                        stock: { $gte: item.quantity }
                    },
                    { $inc: { stock: -item.quantity } },
                    { session }
                );
                
                if (result.modifiedCount === 0) {
                    throw new Error(`Insufficient stock for ${item.productId}`);
                }
            }
            
            // Update order status
            await db.collection('orders').updateOne(
                { _id: orderId },
                { 
                    $set: { 
                        status: 'confirmed',
                        confirmedAt: new Date()
                    }
                },
                { session }
            );
            
            // Create payment record
            await db.collection('payments').insertOne({
                orderId: orderId,
                amount: order.total,
                status: 'pending',
                createdAt: new Date()
            }, { session });
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await session.endSession();
    }
}
```

### User Registration with Profile

```javascript
async function registerUser(userData) {
    const session = client.startSession();
    
    try {
        let userId;
        
        await session.withTransaction(async () => {
            const db = client.db('app');
            
            // Check if email exists
            const existing = await db.collection('users').findOne(
                { email: userData.email },
                { session }
            );
            
            if (existing) {
                throw new Error('Email already exists');
            }
            
            // Create user
            const userResult = await db.collection('users').insertOne({
                email: userData.email,
                passwordHash: hashPassword(userData.password),
                createdAt: new Date()
            }, { session });
            
            userId = userResult.insertedId;
            
            // Create profile
            await db.collection('profiles').insertOne({
                userId: userId,
                name: userData.name,
                bio: '',
                avatar: null,
                createdAt: new Date()
            }, { session });
            
            // Create initial settings
            await db.collection('settings').insertOne({
                userId: userId,
                notifications: true,
                theme: 'light',
                language: 'en'
            }, { session });
        });
        
        return { success: true, userId };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        await session.endSession();
    }
}
```

---

## When to Use Transactions

### ✅ Use Transactions

```javascript
// Multi-document atomicity required
// - Financial transfers
// - Order processing with inventory
// - User registration with related data
// - Any operation that must be "all or nothing"
```

### ✗ Avoid When Possible

```javascript
// Design to avoid transactions:
// 1. Embed related data in single document
// 2. Use single document atomic operations
// 3. Accept eventual consistency where appropriate

// Example: Instead of transaction for order
// Embed order items in order document
{
    _id: ObjectId("..."),
    items: [...],  // All in one document
    total: 99.99,
    status: "pending"
}
// Single updateOne is atomic!
```

---

## Best Practices

```javascript
// 1. Keep transactions short
// - Long transactions hold locks
// - Risk of timeout

// 2. Limit operations per transaction
// - More operations = more lock contention
// - Consider batching

// 3. Use indexes
// - Transactions still need fast queries
// - Avoid collection scans in transactions

// 4. Handle errors properly
// - Use withTransaction for auto-retry
// - Implement proper cleanup

// 5. Test with replica set
// - Transactions require replica set
// - Use single-node replica set for development
```

---

## Summary

In this chapter, you learned:
- ✅ Single document atomicity in MongoDB
- ✅ Multi-document ACID transactions
- ✅ Transaction API (startSession, withTransaction)
- ✅ Read/Write concerns for durability
- ✅ Error handling and retries
- ✅ Limitations and best practices
- ✅ Mongoose transaction integration

---

**Next Chapter:** [Replication →](./10-Replication.md)




