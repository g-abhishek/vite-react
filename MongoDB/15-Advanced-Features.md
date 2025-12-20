# Chapter 15: Advanced Features ⚡

MongoDB offers powerful advanced features for real-time data, file storage, time-series data, and full-text search.

---

## Change Streams

Real-time change notifications for collections, databases, or entire cluster.

### Basic Usage

```javascript
const { MongoClient } = require('mongodb');

const client = new MongoClient(uri);
await client.connect();

const collection = client.db('mydb').collection('orders');

// Watch collection for changes
const changeStream = collection.watch();

changeStream.on('change', (change) => {
    console.log('Change detected:', change);
});

// Change event structure:
{
    _id: { _data: '...' },  // Resume token
    operationType: 'insert', // insert, update, replace, delete, invalidate
    fullDocument: { ... },   // The document (for insert/replace/update)
    ns: { db: 'mydb', coll: 'orders' },
    documentKey: { _id: ObjectId('...') },
    updateDescription: {     // For updates
        updatedFields: { status: 'shipped' },
        removedFields: []
    }
}
```

### Filtering Changes

```javascript
// Watch with pipeline
const pipeline = [
    { 
        $match: { 
            operationType: { $in: ['insert', 'update'] },
            'fullDocument.status': 'pending'
        } 
    },
    {
        $project: {
            'fullDocument.orderId': 1,
            'fullDocument.total': 1,
            operationType: 1
        }
    }
];

const changeStream = collection.watch(pipeline);

// Watch specific operations
const changeStream = collection.watch([
    { $match: { operationType: 'delete' } }
]);
```

### Resume Tokens

```javascript
let resumeToken = null;

const changeStream = collection.watch();

changeStream.on('change', (change) => {
    // Save resume token
    resumeToken = change._id;
    processChange(change);
});

changeStream.on('error', async (error) => {
    // Resume from last token
    if (resumeToken) {
        const newStream = collection.watch([], {
            resumeAfter: resumeToken
        });
    }
});

// Start from specific time
const changeStream = collection.watch([], {
    startAtOperationTime: new Timestamp(1704067200, 1)
});
```

### Full Document Updates

```javascript
// Get full document on updates (not just changed fields)
const changeStream = collection.watch([], {
    fullDocument: 'updateLookup'
});

// For updates, fullDocument will contain the entire updated document
changeStream.on('change', (change) => {
    if (change.operationType === 'update') {
        console.log('Full document:', change.fullDocument);
    }
});
```

### Real-Time Notifications Example

```javascript
const express = require('express');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Watch orders collection
const changeStream = db.collection('orders').watch([
    { $match: { operationType: { $in: ['insert', 'update'] } } }
]);

changeStream.on('change', (change) => {
    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: change.operationType,
                orderId: change.fullDocument.orderId,
                status: change.fullDocument.status
            }));
        }
    });
});
```

---

## GridFS

Store files larger than 16MB document limit.

### How GridFS Works

```
┌─────────────────────────────────────────────────────────┐
│                       GridFS                             │
│  ┌──────────────────┐      ┌──────────────────────┐    │
│  │    fs.files      │      │     fs.chunks        │    │
│  │  (file metadata) │  1:N │  (file data chunks)  │    │
│  └──────────────────┘      └──────────────────────┘    │
│                                                          │
│  File split into 255KB chunks                           │
└─────────────────────────────────────────────────────────┘
```

### Upload Files

```javascript
const { GridFSBucket } = require('mongodb');
const fs = require('fs');

const bucket = new GridFSBucket(db);

// Upload from file
const uploadStream = bucket.openUploadStream('video.mp4', {
    metadata: {
        userId: 'user123',
        type: 'video'
    }
});

fs.createReadStream('./video.mp4')
    .pipe(uploadStream)
    .on('finish', () => {
        console.log('Upload complete:', uploadStream.id);
    });

// Upload from buffer
const buffer = fs.readFileSync('./image.png');
const uploadStream = bucket.openUploadStream('image.png');
uploadStream.write(buffer);
uploadStream.end();
```

### Download Files

```javascript
// Download to file
bucket.openDownloadStreamByName('video.mp4')
    .pipe(fs.createWriteStream('./downloaded-video.mp4'))
    .on('finish', () => console.log('Download complete'));

// Download by ID
bucket.openDownloadStream(fileId)
    .pipe(fs.createWriteStream('./output.mp4'));

// Stream to HTTP response (Express)
app.get('/files/:filename', async (req, res) => {
    const files = await bucket.find({ filename: req.params.filename }).toArray();
    
    if (!files.length) {
        return res.status(404).send('File not found');
    }
    
    res.set('Content-Type', files[0].contentType);
    res.set('Content-Length', files[0].length);
    
    bucket.openDownloadStreamByName(req.params.filename)
        .pipe(res);
});
```

### Find and Delete

```javascript
// Find files
const files = await bucket.find({ 
    'metadata.userId': 'user123' 
}).toArray();

// Delete file
await bucket.delete(fileId);

// Rename file
await bucket.rename(fileId, 'new-name.mp4');
```

### With Mongoose

```javascript
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Or use mongoose-gridfs
const { createModel } = require('mongoose-gridfs');

const Attachment = createModel({
    modelName: 'Attachment',
    connection: mongoose.connection
});

// Upload
const readStream = fs.createReadStream('./file.pdf');
const options = { filename: 'file.pdf', contentType: 'application/pdf' };

Attachment.write(options, readStream, (error, file) => {
    console.log('Uploaded:', file._id);
});
```

---

## Time Series Collections

Optimized storage for time-series data (MongoDB 5.0+).

### Create Time Series Collection

```javascript
db.createCollection('sensorReadings', {
    timeseries: {
        timeField: 'timestamp',      // Required: Field containing timestamp
        metaField: 'sensorId',       // Optional: Field for grouping
        granularity: 'seconds'       // Optional: seconds, minutes, hours
    },
    expireAfterSeconds: 86400 * 30   // Optional: Auto-delete after 30 days
});
```

### Insert Data

```javascript
// Insert readings
db.sensorReadings.insertMany([
    {
        timestamp: new Date(),
        sensorId: 'sensor001',
        temperature: 23.5,
        humidity: 65
    },
    {
        timestamp: new Date(),
        sensorId: 'sensor002',
        temperature: 24.1,
        humidity: 62
    }
]);
```

### Query Time Series

```javascript
// Get readings for last hour
db.sensorReadings.find({
    timestamp: { $gte: new Date(Date.now() - 3600000) },
    sensorId: 'sensor001'
});

// Aggregate by time window
db.sensorReadings.aggregate([
    {
        $match: {
            timestamp: { $gte: new Date(Date.now() - 86400000) }
        }
    },
    {
        $group: {
            _id: {
                sensorId: '$sensorId',
                hour: { $hour: '$timestamp' }
            },
            avgTemp: { $avg: '$temperature' },
            maxTemp: { $max: '$temperature' },
            minTemp: { $min: '$temperature' },
            count: { $sum: 1 }
        }
    },
    { $sort: { '_id.hour': 1 } }
]);

// Using $dateTrunc (MongoDB 5.0+)
db.sensorReadings.aggregate([
    {
        $group: {
            _id: {
                sensor: '$sensorId',
                time: {
                    $dateTrunc: {
                        date: '$timestamp',
                        unit: 'hour'
                    }
                }
            },
            avgTemp: { $avg: '$temperature' }
        }
    }
]);
```

---

## Atlas Search

Full-text search powered by Apache Lucene (Atlas only).

### Create Search Index

```javascript
// In Atlas UI or via API
{
    "name": "default",
    "mappings": {
        "dynamic": true,
        "fields": {
            "title": {
                "type": "string",
                "analyzer": "lucene.standard"
            },
            "description": {
                "type": "string",
                "analyzer": "lucene.english"
            },
            "price": {
                "type": "number"
            }
        }
    }
}
```

### Basic Search

```javascript
db.products.aggregate([
    {
        $search: {
            index: 'default',
            text: {
                query: 'wireless headphones',
                path: ['title', 'description']
            }
        }
    },
    {
        $project: {
            title: 1,
            description: 1,
            score: { $meta: 'searchScore' }
        }
    }
]);
```

### Advanced Search

```javascript
// Compound query
db.products.aggregate([
    {
        $search: {
            compound: {
                must: [
                    { text: { query: 'laptop', path: 'title' } }
                ],
                should: [
                    { text: { query: 'gaming', path: 'description', score: { boost: { value: 2 } } } }
                ],
                filter: [
                    { range: { path: 'price', gte: 500, lte: 2000 } }
                ]
            }
        }
    }
]);

// Autocomplete
db.products.aggregate([
    {
        $search: {
            autocomplete: {
                query: 'lapt',
                path: 'title'
            }
        }
    },
    { $limit: 10 },
    { $project: { title: 1 } }
]);

// Fuzzy search
db.products.aggregate([
    {
        $search: {
            text: {
                query: 'wireles',  // Typo
                path: 'title',
                fuzzy: {
                    maxEdits: 1
                }
            }
        }
    }
]);
```

### Faceted Search

```javascript
db.products.aggregate([
    {
        $searchMeta: {
            index: 'default',
            facet: {
                operator: {
                    text: { query: 'laptop', path: 'title' }
                },
                facets: {
                    categoryFacet: {
                        type: 'string',
                        path: 'category'
                    },
                    priceFacet: {
                        type: 'number',
                        path: 'price',
                        boundaries: [0, 500, 1000, 2000]
                    }
                }
            }
        }
    }
]);

// Result:
{
    count: { lowerBound: 100 },
    facet: {
        categoryFacet: {
            buckets: [
                { _id: 'Electronics', count: 50 },
                { _id: 'Computers', count: 30 }
            ]
        },
        priceFacet: {
            buckets: [
                { _id: 0, count: 20 },
                { _id: 500, count: 45 },
                { _id: 1000, count: 35 }
            ]
        }
    }
}
```

---

## Capped Collections

Fixed-size collections that automatically remove oldest documents.

```javascript
// Create capped collection
db.createCollection('logs', {
    capped: true,
    size: 10485760,     // 10MB max size (required)
    max: 10000          // Optional: max number of documents
});

// Tailable cursor (like tail -f)
const cursor = db.logs.find().tailable().awaitData();

cursor.on('data', (doc) => {
    console.log('New log:', doc);
});

// Use cases:
// - Log data
// - Caching
// - Real-time messaging
// - Event streaming
```

---

## Text Indexes

Built-in full-text search (alternative to Atlas Search).

```javascript
// Create text index
db.articles.createIndex({ title: 'text', content: 'text' });

// Search
db.articles.find({ $text: { $search: 'mongodb tutorial' } });

// With score
db.articles.find(
    { $text: { $search: 'mongodb tutorial' } },
    { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });

// Phrase search
db.articles.find({ $text: { $search: '"mongodb tutorial"' } });

// Exclude terms
db.articles.find({ $text: { $search: 'mongodb -tutorial' } });

// Language-specific
db.articles.find({
    $text: {
        $search: 'café',
        $language: 'french'
    }
});
```

---

## Collation

Language-specific string comparison.

```javascript
// Create collection with collation
db.createCollection('users', {
    collation: { locale: 'en', strength: 2 }  // Case-insensitive
});

// Or per-query
db.users.find({ name: 'john' })
    .collation({ locale: 'en', strength: 2 });

// Collation options:
// locale: 'en', 'fr', 'de', etc.
// strength: 1 (base chars only) to 5 (identical)
// caseLevel: boolean
// numericOrdering: boolean (sort "10" after "2")

// Sort numbers in strings correctly
db.products.find()
    .collation({ locale: 'en', numericOrdering: true })
    .sort({ version: 1 });
// Sorts: 1.0, 2.0, 10.0 (not 1.0, 10.0, 2.0)
```

---

## Summary

In this chapter, you learned:
- ✅ Change Streams for real-time updates
- ✅ GridFS for large file storage
- ✅ Time Series Collections for IoT/metrics
- ✅ Atlas Search for full-text search
- ✅ Capped Collections for fixed-size logs
- ✅ Text Indexes for basic search
- ✅ Collation for language-aware sorting

---

**Next Chapter:** [Interview Questions →](./16-Interview-Questions.md)




