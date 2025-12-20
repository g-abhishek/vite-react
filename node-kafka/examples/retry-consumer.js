/**
 * Consumer with Retry and Dead Letter Queue
 * 
 * Demonstrates proper error handling with retries and DLQ.
 * Run: node examples/retry-consumer.js
 */

const { kafka } = require("../kafka");

const MAX_RETRIES = 3;
const DLQ_TOPIC = "order-topic-dlq";
const FAILURE_RATE = 0.3; // 30% of messages will fail (for demo)

const producer = kafka.producer();
const consumer = kafka.consumer({ 
  groupId: "retry-demo-group",
  sessionTimeout: 30000,
});

// Simulated processing that sometimes fails
const processOrder = async (order) => {
  // Simulate random failures
  if (Math.random() < FAILURE_RATE) {
    throw new Error(`Processing failed for order ${order.orderId}`);
  }
  
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  return { success: true, orderId: order.orderId };
};

// Send failed message to DLQ
const sendToDeadLetterQueue = async (originalMessage, error, retryCount) => {
  const dlqPayload = {
    originalMessage: JSON.parse(originalMessage.value.toString()),
    error: {
      message: error.message,
      stack: error.stack,
    },
    metadata: {
      originalTopic: "order-topic",
      originalPartition: originalMessage.partition,
      originalOffset: originalMessage.offset,
      retryCount,
      failedAt: new Date().toISOString(),
    },
  };

  await producer.send({
    topic: DLQ_TOPIC,
    messages: [
      {
        key: originalMessage.key,
        value: JSON.stringify(dlqPayload),
        headers: {
          "original-topic": "order-topic",
          "failure-reason": error.message,
        },
      },
    ],
  });

  console.log(`💀 Sent to DLQ: ${dlqPayload.originalMessage.orderId}`);
};

// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`  ⚠️ Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms...
        console.log(`  ⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

const run = async () => {
  await producer.connect();
  await consumer.connect();

  // Subscribe to topic
  await consumer.subscribe({
    topic: "order-topic",
    fromBeginning: false,
  });

  console.log("🚀 Retry Consumer Started");
  console.log(`   Max retries: ${MAX_RETRIES}`);
  console.log(`   DLQ topic: ${DLQ_TOPIC}`);
  console.log(`   Simulated failure rate: ${FAILURE_RATE * 100}%`);
  console.log("─".repeat(60));

  let processed = 0;
  let succeeded = 0;
  let sentToDlq = 0;

  await consumer.run({
    autoCommit: false,

    eachMessage: async ({ topic, partition, message }) => {
      processed++;
      const order = JSON.parse(message.value.toString());
      
      console.log(`\n📥 Processing: ${order.orderId} (offset: ${message.offset})`);

      try {
        // Try processing with retries
        await retryWithBackoff(
          () => processOrder(order),
          MAX_RETRIES
        );

        succeeded++;
        console.log(`✅ Success: ${order.orderId}`);

      } catch (error) {
        // All retries exhausted, send to DLQ
        await sendToDeadLetterQueue(message, error, MAX_RETRIES);
        sentToDlq++;
      }

      // Commit offset (whether success or DLQ)
      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (parseInt(message.offset, 10) + 1).toString(),
        },
      ]);

      // Print stats
      if (processed % 10 === 0) {
        console.log("\n📊 Stats:");
        console.log(`   Processed: ${processed}`);
        console.log(`   Succeeded: ${succeeded} (${Math.round(succeeded/processed*100)}%)`);
        console.log(`   Sent to DLQ: ${sentToDlq} (${Math.round(sentToDlq/processed*100)}%)`);
      }
    },
  });
};

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🛑 Shutting down...");
  await consumer.disconnect();
  await producer.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

run().catch(console.error);


