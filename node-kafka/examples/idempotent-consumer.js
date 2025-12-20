/**
 * Idempotent Consumer Example
 * 
 * Demonstrates exactly-once processing using message deduplication.
 * Uses a simple in-memory store (use Redis in production).
 * 
 * Run: node examples/idempotent-consumer.js
 */

const { kafka } = require("../kafka");

const consumer = kafka.consumer({
  groupId: "idempotent-demo-group",
});

// In production, use Redis or a database
// This in-memory store is just for demo purposes
const processedMessages = new Map();
const MESSAGE_TTL = 60000; // Keep track of messages for 1 minute

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of processedMessages) {
    if (now - timestamp > MESSAGE_TTL) {
      processedMessages.delete(key);
    }
  }
}, 10000);

// Generate unique message ID
const getMessageId = (message) => {
  // Option 1: Use header if provided
  const headerId = message.headers?.["message-id"]?.toString();
  if (headerId) return headerId;

  // Option 2: Use key + offset as fallback
  const key = message.key?.toString() || "no-key";
  return `${key}-${message.offset}`;
};

// Check if message was already processed
const isDuplicate = (messageId) => {
  return processedMessages.has(messageId);
};

// Mark message as processed
const markProcessed = (messageId) => {
  processedMessages.set(messageId, Date.now());
};

// Simulated business logic
const processOrder = async (order) => {
  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 50));
  console.log(`  📦 Order processed: ${order.orderId}`);
  console.log(`     Customer: ${order.customerId}`);
  console.log(`     Amount: $${order.amount || "N/A"}`);
};

const run = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "order-topic",
    fromBeginning: false,
  });

  console.log("🚀 Idempotent Consumer Started");
  console.log("   Deduplication: In-memory (use Redis in production)");
  console.log("─".repeat(60));

  let totalReceived = 0;
  let duplicatesSkipped = 0;
  let processed = 0;

  await consumer.run({
    autoCommit: false,

    eachMessage: async ({ topic, partition, message }) => {
      totalReceived++;
      const messageId = getMessageId(message);

      console.log(`\n📥 Received message: ${messageId}`);

      // Check for duplicate
      if (isDuplicate(messageId)) {
        duplicatesSkipped++;
        console.log(`  ⏭️  SKIPPED: Duplicate message (already processed)`);
        
        // Still commit to move forward
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (parseInt(message.offset, 10) + 1).toString(),
          },
        ]);
        return;
      }

      try {
        // Process the message
        const order = JSON.parse(message.value.toString());
        await processOrder(order);

        // Mark as processed AFTER successful processing
        markProcessed(messageId);
        processed++;

        console.log(`  ✅ Successfully processed`);

      } catch (error) {
        console.error(`  ❌ Processing failed: ${error.message}`);
        // Don't mark as processed - will be retried
        throw error;
      }

      // Commit offset
      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        },
      ]);

      // Print stats periodically
      if (totalReceived % 5 === 0) {
        console.log("\n📊 Idempotency Stats:");
        console.log(`   Total received: ${totalReceived}`);
        console.log(`   Processed: ${processed}`);
        console.log(`   Duplicates skipped: ${duplicatesSkipped}`);
        console.log(`   Tracked messages: ${processedMessages.size}`);
      }
    },
  });
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down...");
  await consumer.disconnect();
  console.log("Final stats:");
  console.log(`   Total tracked messages: ${processedMessages.size}`);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(console.error);


