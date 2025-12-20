# Chapter 14: Mongoose ODM 🦁

Mongoose is the most popular MongoDB ODM (Object Document Mapper) for Node.js, providing schema validation, middleware, and a clean API.

---

## Getting Started

### Installation

```bash
npm install mongoose
```

### Connection

```javascript
const mongoose = require('mongoose');

// Basic connection
mongoose.connect('mongodb://localhost:27017/myapp');

// With options
mongoose.connect('mongodb://localhost:27017/myapp', {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

// Connection events
mongoose.connection.on('connected', () => console.log('Connected'));
mongoose.connection.on('error', (err) => console.error('Error:', err));
mongoose.connection.on('disconnected', () => console.log('Disconnected'));

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Async/await connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Connection error:', error);
        process.exit(1);
    }
}
```

---

## Schemas

### Basic Schema

```javascript
const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    name: String,
    email: String,
    age: Number,
    isActive: Boolean,
    createdAt: Date
});

const User = model('User', userSchema);
```

### Schema Types

```javascript
const productSchema = new Schema({
    // Basic types
    name: String,
    price: Number,
    inStock: Boolean,
    
    // With options
    sku: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    
    // Arrays
    tags: [String],
    ratings: [Number],
    
    // Nested object
    details: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        }
    },
    
    // Array of objects
    variants: [{
        color: String,
        size: String,
        stock: Number
    }],
    
    // ObjectId reference
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    
    // Mixed type (any)
    metadata: Schema.Types.Mixed,
    
    // Map
    attributes: {
        type: Map,
        of: String
    },
    
    // Decimal128 for precise decimals
    exactPrice: Schema.Types.Decimal128,
    
    // Buffer for binary
    image: Buffer,
    
    // UUID
    uuid: Schema.Types.UUID
});
```

### Schema Options

```javascript
const userSchema = new Schema({
    name: String,
    email: String
}, {
    timestamps: true,           // Adds createdAt, updatedAt
    collection: 'users',        // Collection name
    versionKey: '__v',          // Version key (default)
    strict: true,               // Only save defined fields
    strictQuery: true,          // Strict query filters
    toJSON: { virtuals: true }, // Include virtuals in JSON
    toObject: { virtuals: true }
});
```

---

## Validation

### Built-in Validators

```javascript
const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minlength: [2, 'Name too short'],
        maxlength: [100, 'Name too long'],
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    age: {
        type: Number,
        min: [0, 'Age must be positive'],
        max: [150, 'Age too high']
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user'
    },
    website: {
        type: String,
        validate: {
            validator: (v) => /^https?:\/\/.+/.test(v),
            message: 'Invalid URL'
        }
    }
});
```

### Custom Validators

```javascript
const productSchema = new Schema({
    price: {
        type: Number,
        validate: {
            validator: function(v) {
                return v > 0;
            },
            message: 'Price must be positive'
        }
    },
    salePrice: {
        type: Number,
        validate: {
            validator: function(v) {
                // Access other fields with 'this'
                return v < this.price;
            },
            message: 'Sale price must be less than regular price'
        }
    }
});

// Async validator
const userSchema = new Schema({
    email: {
        type: String,
        validate: {
            validator: async function(email) {
                const user = await this.constructor.findOne({ email });
                return !user || this._id.equals(user._id);
            },
            message: 'Email already exists'
        }
    }
});
```

---

## Middleware (Hooks)

### Document Middleware

```javascript
// Pre-save
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Post-save
userSchema.post('save', function(doc) {
    console.log('User saved:', doc._id);
});

// Pre-validate
userSchema.pre('validate', function(next) {
    if (!this.slug) {
        this.slug = slugify(this.name);
    }
    next();
});

// Error handling
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Duplicate key error'));
    } else {
        next(error);
    }
});
```

### Query Middleware

```javascript
// Pre-find
userSchema.pre('find', function() {
    this.where({ isActive: true });  // Auto-filter inactive
});

userSchema.pre('findOne', function() {
    this.where({ isActive: true });
});

// Pre-update
userSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

// Post-find
userSchema.post('find', function(docs) {
    console.log(`Found ${docs.length} users`);
});
```

### Aggregate Middleware

```javascript
userSchema.pre('aggregate', function() {
    this.pipeline().unshift({ $match: { isActive: true } });
});
```

---

## Instance Methods

```javascript
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
};

userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Usage
const user = await User.findOne({ email });
const isMatch = await user.comparePassword('password123');
const token = user.generateAuthToken();
```

---

## Static Methods

```javascript
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

userSchema.statics.getStats = async function() {
    return this.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
};

// Usage
const user = await User.findByEmail('john@example.com');
const activeUsers = await User.findActiveUsers();
const stats = await User.getStats();
```

---

## Virtuals

```javascript
// Virtual getter
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual setter
userSchema.virtual('fullName').set(function(name) {
    const [first, last] = name.split(' ');
    this.firstName = first;
    this.lastName = last;
});

// Virtual for populated count
userSchema.virtual('postCount', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author',
    count: true
});

// Usage
const user = await User.findById(id);
console.log(user.fullName);  // "John Doe"

user.fullName = "Jane Smith";
console.log(user.firstName);  // "Jane"
```

---

## Population (Joins)

### Basic Population

```javascript
// Define relationship
const postSchema = new Schema({
    title: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Populate author
const post = await Post.findById(id).populate('author');
// post.author is now the full User document

// Select specific fields
const post = await Post.findById(id)
    .populate('author', 'name email');

// Multiple populations
const post = await Post.findById(id)
    .populate('author')
    .populate('category');
```

### Nested Population

```javascript
// Post -> Author -> Company
const post = await Post.findById(id)
    .populate({
        path: 'author',
        populate: {
            path: 'company',
            select: 'name'
        }
    });
```

### Conditional Population

```javascript
const post = await Post.findById(id).populate({
    path: 'comments',
    match: { isApproved: true },
    select: 'text author',
    options: { 
        sort: { createdAt: -1 },
        limit: 10
    }
});
```

### Virtual Population

```javascript
// On User schema - get user's posts
userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author'
});

const user = await User.findById(id).populate('posts');
// user.posts contains all posts by this user
```

---

## CRUD Operations

### Create

```javascript
// Method 1: new + save
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

// Method 2: create
const user = await User.create({ name: 'John', email: 'john@example.com' });

// Method 3: insertMany
const users = await User.insertMany([
    { name: 'John', email: 'john@example.com' },
    { name: 'Jane', email: 'jane@example.com' }
]);
```

### Read

```javascript
// Find all
const users = await User.find();

// Find with conditions
const users = await User.find({ isActive: true });

// Find one
const user = await User.findOne({ email: 'john@example.com' });

// Find by ID
const user = await User.findById(id);

// With query builder
const users = await User.find()
    .where('age').gte(18)
    .where('role').equals('user')
    .select('name email')
    .sort('-createdAt')
    .limit(10)
    .lean();  // Return plain objects

// Exists check
const exists = await User.exists({ email: 'john@example.com' });

// Count
const count = await User.countDocuments({ isActive: true });
```

### Update

```javascript
// Update and return updated doc
const user = await User.findByIdAndUpdate(
    id,
    { $set: { name: 'New Name' } },
    { new: true, runValidators: true }
);

// Update one
await User.updateOne(
    { _id: id },
    { $set: { name: 'New Name' } }
);

// Update many
await User.updateMany(
    { isActive: false },
    { $set: { deletedAt: new Date() } }
);

// Document save (triggers middleware)
const user = await User.findById(id);
user.name = 'New Name';
await user.save();
```

### Delete

```javascript
// Delete and return
const user = await User.findByIdAndDelete(id);

// Delete one
await User.deleteOne({ _id: id });

// Delete many
await User.deleteMany({ createdAt: { $lt: oldDate } });

// Soft delete pattern
userSchema.add({ deletedAt: Date });

userSchema.methods.softDelete = function() {
    this.deletedAt = new Date();
    return this.save();
};

userSchema.pre('find', function() {
    this.where({ deletedAt: null });
});
```

---

## Transactions

```javascript
const session = await mongoose.startSession();

try {
    session.startTransaction();
    
    const user = await User.create([{ name: 'John' }], { session });
    
    await Account.create([{
        userId: user[0]._id,
        balance: 0
    }], { session });
    
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
    throw error;
} finally {
    session.endSession();
}

// Using withTransaction
await session.withTransaction(async () => {
    await User.create([{ name: 'John' }], { session });
    await Account.create([{ userId: user._id }], { session });
});
```

---

## Plugins

### Creating Plugins

```javascript
// Timestamp plugin
function timestampPlugin(schema) {
    schema.add({
        createdAt: { type: Date, default: Date.now },
        updatedAt: Date
    });
    
    schema.pre('save', function(next) {
        this.updatedAt = new Date();
        next();
    });
}

// Apply to schema
userSchema.plugin(timestampPlugin);

// Apply globally
mongoose.plugin(timestampPlugin);
```

### Popular Plugins

```javascript
// mongoose-paginate-v2
const mongoosePaginate = require('mongoose-paginate-v2');
userSchema.plugin(mongoosePaginate);

const result = await User.paginate({}, { page: 1, limit: 10 });
// { docs, totalDocs, limit, page, totalPages, ... }

// mongoose-unique-validator
const uniqueValidator = require('mongoose-unique-validator');
userSchema.plugin(uniqueValidator, { message: '{PATH} already exists' });
```

---

## Best Practices

### Schema Organization

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // ... fields
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// Methods
userSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

// Statics
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Middleware
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Export
module.exports = mongoose.model('User', userSchema);
```

### Connection Management

```javascript
// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
```

---

## Summary

In this chapter, you learned:
- ✅ Mongoose connection and configuration
- ✅ Schema definition and types
- ✅ Validation (built-in and custom)
- ✅ Middleware (pre/post hooks)
- ✅ Instance and static methods
- ✅ Virtuals for computed properties
- ✅ Population for joins
- ✅ CRUD operations
- ✅ Transactions
- ✅ Plugins and best practices

---

**Next Chapter:** [Advanced Features →](./15-Advanced-Features.md)




