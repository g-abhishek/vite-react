# Chapter 1: Introduction & Setup 🚀

## What is MongoDB?

MongoDB is a **document-oriented NoSQL database** designed for scalability, flexibility, and developer productivity. Key characteristics:

- **Document Model**: Stores data as JSON-like documents (BSON)
- **Schema Flexibility**: No rigid schema required
- **Horizontal Scaling**: Built-in sharding for distributed data
- **Rich Query Language**: Powerful queries and aggregations
- **High Availability**: Automatic failover with replica sets

### MongoDB vs Traditional RDBMS

| Aspect | MongoDB | RDBMS (PostgreSQL/MySQL) |
|--------|---------|--------------------------|
| Data Model | Documents (JSON) | Tables (Rows/Columns) |
| Schema | Flexible/Dynamic | Fixed/Rigid |
| Relationships | Embedded or Referenced | Foreign Keys |
| Scaling | Horizontal (Sharding) | Vertical (mostly) |
| Transactions | Multi-document (4.0+) | Full ACID |
| Query Language | MongoDB Query Language | SQL |
| Best For | Variable schema, rapid dev | Complex relations, strong consistency |

### When to Use MongoDB

✅ **Good fit:**
- Rapidly evolving schemas
- Content management systems
- Real-time analytics
- IoT and time-series data
- Catalog/Product data
- Mobile app backends

❌ **Consider alternatives:**
- Complex multi-table transactions
- Heavy relational data with many JOINs
- Strict schema requirements
- Strong ACID requirements across tables

---

## Installation

### macOS (using Homebrew)

```bash
# Tap the MongoDB formula
brew tap mongodb/brew

# Install MongoDB Community Edition
brew install mongodb-community@7.0

# Start MongoDB as a service
brew services start mongodb-community@7.0

# Connect to MongoDB
mongosh
```

### Ubuntu/Debian

```bash
# Import the public key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
   https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Connect
mongosh
```

### Windows

1. Download installer from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer (choose "Complete" setup)
3. Install MongoDB Compass (GUI) when prompted
4. MongoDB runs as a Windows service automatically

### Docker (Recommended for Development)

```bash
# Pull MongoDB image
docker pull mongo:7.0

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -v mongodb_data:/data/db \
  mongo:7.0

# Connect to the container
docker exec -it mongodb mongosh -u admin -p password123

# Or connect from host
mongosh "mongodb://admin:password123@localhost:27017"
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: myapp
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro

volumes:
  mongodb_data:
```

```javascript
// mongo-init.js - Initial setup script
db = db.getSiblingDB('myapp');

db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [{ role: 'readWrite', db: 'myapp' }]
});

db.createCollection('users');
```

```bash
# Start
docker-compose up -d

# Connect
mongosh "mongodb://appuser:apppassword@localhost:27017/myapp"
```

---

## MongoDB Atlas (Cloud)

MongoDB Atlas is the fully-managed cloud database service.

### Setting Up Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create a cluster (Free tier available)
4. Configure network access (allow your IP)
5. Create database user
6. Get connection string

```bash
# Connection string format
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/" --username myuser

# Or in application
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority
```

---

## MongoDB Shell (mongosh)

### Connecting

```bash
# Local connection (default)
mongosh

# With authentication
mongosh -u admin -p password123 --authenticationDatabase admin

# Remote connection
mongosh "mongodb://hostname:27017"

# Connection string
mongosh "mongodb://user:password@host:27017/database"

# Atlas connection
mongosh "mongodb+srv://cluster.xxxxx.mongodb.net/" --username myuser
```

### Basic Commands

```javascript
// Show all databases
show dbs

// Switch to database (creates if not exists)
use mydb

// Show current database
db

// Show collections in current database
show collections

// Get server status
db.serverStatus()

// Get database stats
db.stats()

// Help
help
db.help()
db.collection.help()

// Exit shell
exit
// or Ctrl+C twice
```

### CRUD Quick Start

```javascript
// Switch to test database
use testdb

// Insert a document
db.users.insertOne({
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    createdAt: new Date()
})

// Insert multiple documents
db.users.insertMany([
    { name: "Jane Smith", email: "jane@example.com", age: 25 },
    { name: "Bob Wilson", email: "bob@example.com", age: 35 }
])

// Find all documents
db.users.find()

// Find with pretty print
db.users.find().pretty()

// Find one document
db.users.findOne({ name: "John Doe" })

// Find with condition
db.users.find({ age: { $gt: 25 } })

// Update a document
db.users.updateOne(
    { name: "John Doe" },
    { $set: { age: 31 } }
)

// Delete a document
db.users.deleteOne({ name: "Bob Wilson" })

// Count documents
db.users.countDocuments()

// Drop collection
db.users.drop()

// Drop database
db.dropDatabase()
```

---

## MongoDB Compass (GUI)

MongoDB Compass is the official GUI for MongoDB.

### Features
- Visual query builder
- Schema visualization
- Index management
- Real-time performance monitoring
- Aggregation pipeline builder

### Installation

1. Download from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
2. Install for your platform
3. Connect using connection string

### Connection String

```
# Local
mongodb://localhost:27017

# With auth
mongodb://user:password@localhost:27017/mydb?authSource=admin

# Atlas
mongodb+srv://user:password@cluster.xxxxx.mongodb.net/mydb
```

---

## Node.js Connection

### Native Driver

```javascript
// Install: npm install mongodb

const { MongoClient } = require('mongodb');

// Connection URI
const uri = "mongodb://localhost:27017";

// Create client
const client = new MongoClient(uri, {
    maxPoolSize: 10,           // Connection pool size
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

async function main() {
    try {
        // Connect
        await client.connect();
        console.log('Connected to MongoDB');

        // Get database and collection
        const db = client.db('myapp');
        const users = db.collection('users');

        // Insert
        const result = await users.insertOne({
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: new Date()
        });
        console.log('Inserted:', result.insertedId);

        // Find
        const user = await users.findOne({ name: 'John Doe' });
        console.log('Found:', user);

        // Find many
        const allUsers = await users.find({}).toArray();
        console.log('All users:', allUsers);

        // Update
        await users.updateOne(
            { name: 'John Doe' },
            { $set: { age: 30 } }
        );

        // Delete
        await users.deleteOne({ name: 'John Doe' });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

main();
```

### With Mongoose (Recommended)

```javascript
// Install: npm install mongoose

const mongoose = require('mongoose');

// Connect
mongoose.connect('mongodb://localhost:27017/myapp', {
    maxPoolSize: 10,
});

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

// Define schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number, min: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Create model
const User = mongoose.model('User', userSchema);

// CRUD operations
async function main() {
    // Create
    const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    });

    // Read
    const found = await User.findOne({ email: 'john@example.com' });
    const all = await User.find({ age: { $gte: 18 } });

    // Update
    await User.updateOne(
        { email: 'john@example.com' },
        { $set: { age: 31 } }
    );

    // Delete
    await User.deleteOne({ email: 'john@example.com' });
}

main();
```

---

## Configuration

### mongod.conf (Main Config File)

```yaml
# /etc/mongod.conf (Linux) or /usr/local/etc/mongod.conf (macOS)

# Storage settings
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2

# Network settings
net:
  port: 27017
  bindIp: 127.0.0.1  # localhost only
  # bindIp: 0.0.0.0  # all interfaces (use with auth!)

# Security
security:
  authorization: enabled

# Logging
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Process management
processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

# Replication (for replica sets)
#replication:
#  replSetName: rs0
```

### Important Settings

```javascript
// Check current settings in mongosh
db.adminCommand({ getCmdLineOpts: 1 })

// Runtime parameters
db.adminCommand({ getParameter: 1, allParameters: 1 })

// Key settings to consider:
// - storage.wiredTiger.engineConfig.cacheSizeGB (50% of RAM)
// - net.bindIp (security)
// - security.authorization (enable in production!)
// - operationProfiling (for debugging)
```

---

## Data Directory Structure

```
/var/lib/mongodb/
├── collection-*.wt       # Collection data files
├── index-*.wt            # Index data files
├── journal/              # Write-ahead log
│   └── WiredTigerLog.*
├── WiredTiger            # Storage engine metadata
├── WiredTiger.lock       # Lock file
├── WiredTiger.turtle     # Recovery file
└── diagnostic.data/      # Full-time diagnostic data
```

---

## Common Errors & Solutions

### Error: "Connection refused"
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# or
brew services list

# Start MongoDB
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### Error: "Authentication failed"
```javascript
// Ensure you're connecting to correct auth database
mongosh -u myuser -p mypassword --authenticationDatabase admin

// Or check user exists
use admin
db.getUsers()
```

### Error: "Address already in use"
```bash
# Find process using port 27017
lsof -i :27017
# or
netstat -tulpn | grep 27017

# Kill process if needed
kill -9 <PID>
```

### Error: "Insufficient permissions"
```bash
# Fix data directory permissions
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

---

## Practice Exercises

### Exercise 1: Setup
1. Install MongoDB on your system
2. Connect using mongosh
3. Create a database called `practice_db`

### Exercise 2: Basic Operations
1. Create a `books` collection
2. Insert 5 book documents with title, author, year, pages
3. Find all books published after 2000
4. Update a book's page count
5. Delete one book

### Exercise 3: GUI
1. Install MongoDB Compass
2. Connect to your local MongoDB
3. Explore the database visually
4. Build a query using the GUI

---

## Summary

In this chapter, you learned:
- ✅ What MongoDB is and when to use it
- ✅ Installing MongoDB (local, Docker, Atlas)
- ✅ Using mongosh (MongoDB Shell)
- ✅ Basic CRUD operations
- ✅ Connecting from Node.js
- ✅ Configuration basics

---

**Next Chapter:** [BSON & Data Types →](./02-BSON-Data-Types.md)




