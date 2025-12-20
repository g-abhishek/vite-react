# Chapter 12: Security 🔒

Security is crucial for MongoDB deployments. This chapter covers authentication, authorization, encryption, and security best practices.

---

## Authentication

### Enable Authentication

```javascript
// mongod.conf
security:
  authorization: enabled

// Or command line
mongod --auth

// First, create admin user (before enabling auth)
use admin
db.createUser({
    user: "admin",
    pwd: "securePassword123",
    roles: ["root"]
})

// Connect with auth
mongosh -u admin -p securePassword123 --authenticationDatabase admin
```

### Authentication Methods

```javascript
// 1. SCRAM (Default) - Salted Challenge Response Authentication
// Most common for username/password

// 2. x.509 Certificate Authentication
// For internal cluster and client authentication

// 3. LDAP Authentication (Enterprise)
// Integrate with corporate directory

// 4. Kerberos Authentication (Enterprise)
// Single sign-on with Kerberos
```

### Creating Users

```javascript
// Create user with password
db.createUser({
    user: "appUser",
    pwd: "password123",        // Or use passwordPrompt()
    roles: [
        { role: "readWrite", db: "myapp" }
    ]
})

// Create user with multiple roles
db.createUser({
    user: "developer",
    pwd: passwordPrompt(),     // Interactive prompt
    roles: [
        { role: "readWrite", db: "development" },
        { role: "read", db: "production" }
    ],
    customData: {
        employeeId: "12345",
        department: "Engineering"
    }
})
```

### User Management

```javascript
// Update user
db.updateUser("appUser", {
    pwd: "newPassword",
    roles: [
        { role: "readWrite", db: "myapp" },
        { role: "read", db: "analytics" }
    ]
})

// Change password
db.changeUserPassword("appUser", "newSecurePassword")

// Grant additional roles
db.grantRolesToUser("appUser", [
    { role: "dbAdmin", db: "myapp" }
])

// Revoke roles
db.revokeRolesFromUser("appUser", [
    { role: "dbAdmin", db: "myapp" }
])

// List users
db.getUsers()

// Delete user
db.dropUser("appUser")
```

---

## Authorization (RBAC)

### Built-in Roles

```javascript
// Database User Roles
"read"              // Read all collections in database
"readWrite"         // Read and write all collections

// Database Admin Roles
"dbAdmin"           // Schema admin, indexing, statistics
"dbOwner"           // Combines readWrite, dbAdmin, userAdmin
"userAdmin"         // Create and manage users

// Cluster Admin Roles
"clusterAdmin"      // Highest cluster admin privilege
"clusterManager"    // Monitor and manage cluster
"clusterMonitor"    // Read-only access to monitoring tools
"hostManager"       // Monitor and manage servers

// Backup/Restore Roles
"backup"            // Backup data
"restore"           // Restore data

// All-Database Roles
"readAnyDatabase"   // Read on all databases
"readWriteAnyDatabase"
"userAdminAnyDatabase"
"dbAdminAnyDatabase"

// Superuser Roles
"root"              // Full access (use sparingly!)
```

### Custom Roles

```javascript
// Create custom role
db.createRole({
    role: "analyticsReader",
    privileges: [
        {
            resource: { db: "analytics", collection: "" },
            actions: ["find", "listCollections"]
        },
        {
            resource: { db: "analytics", collection: "reports" },
            actions: ["find", "aggregate"]
        }
    ],
    roles: []  // No inherited roles
})

// Create role with inheritance
db.createRole({
    role: "seniorDeveloper",
    privileges: [
        {
            resource: { db: "production", collection: "" },
            actions: ["createIndex", "dropIndex"]
        }
    ],
    roles: [
        { role: "readWrite", db: "production" },
        { role: "read", db: "logs" }
    ]
})

// Update role
db.updateRole("analyticsReader", {
    privileges: [
        {
            resource: { db: "analytics", collection: "" },
            actions: ["find", "listCollections", "aggregate"]
        }
    ]
})

// Grant privileges to role
db.grantPrivilegesToRole("analyticsReader", [
    {
        resource: { db: "analytics", collection: "metrics" },
        actions: ["find"]
    }
])

// Drop role
db.dropRole("analyticsReader")
```

### Available Actions

```javascript
// Query Actions
"find", "aggregate", "count", "distinct"

// Write Actions
"insert", "update", "remove"

// Index Actions
"createIndex", "dropIndex", "listIndexes"

// Collection Actions
"createCollection", "dropCollection", "listCollections"

// Database Actions
"dropDatabase", "enableSharding", "listDatabases"

// User Actions
"createUser", "dropUser", "grantRole", "revokeRole"

// Cluster Actions
"addShard", "removeShard", "serverStatus"
```

---

## Encryption

### Encryption at Rest

```javascript
// mongod.conf (Enterprise feature)
security:
  enableEncryption: true
  encryptionKeyFile: /path/to/keyfile

// Using KMIP (Key Management Interoperability Protocol)
security:
  kmip:
    serverName: kmip.example.com
    port: 5696
    clientCertificateFile: /path/to/client.pem
    serverCAFile: /path/to/ca.pem
```

### Encryption in Transit (TLS/SSL)

```javascript
// mongod.conf
net:
  ssl:
    mode: requireSSL
    PEMKeyFile: /path/to/server.pem
    CAFile: /path/to/ca.pem
    clusterFile: /path/to/cluster.pem

// Connection with TLS
mongosh --tls \
  --tlsCAFile /path/to/ca.pem \
  --tlsCertificateKeyFile /path/to/client.pem \
  mongodb://host:27017

// Node.js connection
const client = new MongoClient(uri, {
    tls: true,
    tlsCAFile: '/path/to/ca.pem',
    tlsCertificateKeyFile: '/path/to/client.pem'
});
```

### Client-Side Field Level Encryption

```javascript
// MongoDB 4.2+ - Encrypt specific fields

// Create encryption keys
const keyVaultClient = new MongoClient(uri);
const keyVaultDB = keyVaultClient.db('encryption');
const keyVaultColl = keyVaultDB.collection('__keyVault');

// Create data encryption key
const clientEncryption = new ClientEncryption(keyVaultClient, {
    keyVaultNamespace: 'encryption.__keyVault',
    kmsProviders: {
        local: { key: localMasterKey }
    }
});

const dataKeyId = await clientEncryption.createDataKey('local');

// Encrypt a field
const encrypted = await clientEncryption.encrypt(
    'sensitive-data',
    {
        keyId: dataKeyId,
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
    }
);

// Schema with auto encryption
const schema = {
    'mydb.users': {
        bsonType: 'object',
        encryptMetadata: {
            keyId: [dataKeyId]
        },
        properties: {
            ssn: {
                encrypt: {
                    bsonType: 'string',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
                }
            },
            medicalRecords: {
                encrypt: {
                    bsonType: 'object',
                    algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
                }
            }
        }
    }
};
```

---

## Network Security

### Bind IP

```javascript
// mongod.conf - Restrict network interfaces
net:
  bindIp: 127.0.0.1          // localhost only
  // bindIp: 0.0.0.0         // all interfaces (use with firewall!)
  port: 27017
```

### Firewall Rules

```bash
# Allow MongoDB only from app servers
sudo ufw allow from 10.0.0.0/24 to any port 27017

# Or with iptables
sudo iptables -A INPUT -p tcp -s 10.0.0.0/24 --dport 27017 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 27017 -j DROP
```

### IP Whitelisting (Atlas)

```javascript
// In MongoDB Atlas:
// Network Access -> Add IP Address
// - Add specific IPs
// - Or use VPC Peering for private connectivity
```

---

## Auditing (Enterprise)

```javascript
// mongod.conf
auditLog:
  destination: file
  format: JSON
  path: /var/log/mongodb/audit.json
  filter: '{ atype: { $in: ["authenticate", "createUser", "dropUser"] } }'

// Audit event types
// authenticate - Login attempts
// authCheck - Authorization checks
// createUser/dropUser - User management
// createCollection/dropCollection - Collection operations
// insert/update/remove - CRUD operations (use carefully!)
```

---

## Security Checklist

```markdown
## Pre-Production Security Checklist

### Authentication
□ Enable authentication
□ Create admin user with strong password
□ Create application-specific users
□ Remove default/test users

### Authorization
□ Apply principle of least privilege
□ Use role-based access control
□ Create custom roles for specific needs
□ Review roles periodically

### Network Security
□ Bind to specific IP addresses
□ Configure firewall rules
□ Enable TLS/SSL
□ Use VPC/private networking

### Encryption
□ Enable encryption at rest (Enterprise)
□ Enable TLS for connections
□ Consider client-side encryption for sensitive data

### Monitoring & Auditing
□ Enable audit logging
□ Monitor access patterns
□ Set up alerts for suspicious activity
□ Regular security reviews

### Operations
□ Regular backups
□ Secure backup storage
□ Update to latest stable version
□ Security patches applied promptly
```

---

## Secure Connection Strings

```javascript
// Never expose credentials in code
// Use environment variables

// Bad
const uri = "mongodb://admin:password@host:27017";

// Good
const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}`;

// Or use connection string from environment
const uri = process.env.MONGODB_URI;

// With options
const client = new MongoClient(uri, {
    authSource: 'admin',
    authMechanism: 'SCRAM-SHA-256',
    tls: true,
    tlsCAFile: process.env.TLS_CA_FILE
});
```

---

## Common Security Issues

### 1. No Authentication

```javascript
// CRITICAL: Always enable authentication in production!
security:
  authorization: enabled
```

### 2. Exposed to Internet

```javascript
// Don't bind to 0.0.0.0 without firewall
net:
  bindIp: 127.0.0.1,10.0.0.5  // Only localhost and internal IP
```

### 3. Weak Passwords

```javascript
// Use strong passwords
// Implement password policies
db.createUser({
    user: "appUser",
    pwd: passwordPrompt(),  // Don't hardcode!
    roles: [...]
})
```

### 4. Excessive Privileges

```javascript
// Don't use root for applications
// Create specific users with minimal privileges
db.createUser({
    user: "appUser",
    roles: [{ role: "readWrite", db: "myapp" }]  // Not "root"!
})
```

---

## Summary

In this chapter, you learned:
- ✅ Enabling and configuring authentication
- ✅ SCRAM and certificate authentication
- ✅ User management
- ✅ Role-based access control
- ✅ Built-in and custom roles
- ✅ Encryption at rest and in transit
- ✅ Client-side field level encryption
- ✅ Network security and firewalls
- ✅ Security best practices

---

**Next Chapter:** [Performance →](./13-Performance.md)




