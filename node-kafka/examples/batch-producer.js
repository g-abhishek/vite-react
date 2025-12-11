/**
 * Batch Producer Example
 * 
 * Demonstrates efficient batch message production with different strategies.
 * Run: node examples/batch-producer.js
 */

const { kafka } = require("../kafka");
const { CompressionTypes } = require("kafkajs");

const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
});

// Generate sample orders
const generateOrders = (count) => {
  const customers = ["cust-1", "cust-2", "cust-3", "cust-4", "cust-5"];
  const products = ["laptop", "phone", "tablet", "watch", "headphones"];
  
  return Array.from({ length: count }, (_, i) => ({
    orderId: `order-${Date.now()}-${i}`,
    customerId: customers[Math.floor(Math.random() * customers.length)],
    product: products[Math.floor(Math.random() * products.length)],
    amount: Math.floor(Math.random() * 1000) + 100,
    timestamp: new Date().toISOString(),
  }));
};

const runExamples = async () => {
  await producer.connect();
  console.log("✅ Producer connected\n");

  // Example 1: Simple batch send
  console.log("📤 Example 1: Simple Batch Send");
  console.log("─".repeat(50));
  
  const orders = generateOrders(10);
  const start1 = Date.now();
  
  await producer.send({
    topic: "order-topic",
    messages: orders.map((order) => ({
      key: order.customerId,
      value: JSON.stringify(order),
    })),
  });
  
  console.log(`Sent ${orders.length} messages in ${Date.now() - start1}ms`);
  console.log(`Customer distribution:`);
  const customerCounts = orders.reduce((acc, o) => {
    acc[o.customerId] = (acc[o.customerId] || 0) + 1;
    return acc;
  }, {});
  Object.entries(customerCounts).forEach(([cust, count]) => {
    console.log(`  ${cust}: ${count} orders (same partition)`);
  });

  // Example 2: Send with compression
  console.log("\n📤 Example 2: Compressed Batch Send");
  console.log("─".repeat(50));
  
  const largeOrders = generateOrders(100);
  const start2 = Date.now();
  
  await producer.send({
    topic: "order-topic",
    compression: CompressionTypes.GZIP,
    messages: largeOrders.map((order) => ({
      key: order.customerId,
      value: JSON.stringify(order),
    })),
  });
  
  console.log(`Sent ${largeOrders.length} compressed messages in ${Date.now() - start2}ms`);

  // Example 3: Send to multiple topics atomically
  console.log("\n📤 Example 3: Multi-Topic Batch Send");
  console.log("─".repeat(50));
  
  const order = generateOrders(1)[0];
  const start3 = Date.now();
  
  await producer.sendBatch({
    topicMessages: [
      {
        topic: "order-topic",
        messages: [{ key: order.customerId, value: JSON.stringify(order) }],
      },
      {
        topic: "order-topic", // Same topic, different message type
        messages: [{
          key: order.customerId,
          value: JSON.stringify({
            type: "ORDER_CREATED_EVENT",
            orderId: order.orderId,
            timestamp: new Date().toISOString(),
          }),
          headers: { "event-type": "ORDER_CREATED" },
        }],
      },
    ],
  });
  
  console.log(`Sent to multiple topics in ${Date.now() - start3}ms`);

  // Example 4: High-volume parallel send
  console.log("\n📤 Example 4: Parallel High-Volume Send");
  console.log("─".repeat(50));
  
  const batchCount = 5;
  const messagesPerBatch = 100;
  const start4 = Date.now();
  
  const promises = Array.from({ length: batchCount }, (_, batchIndex) => {
    const batchOrders = generateOrders(messagesPerBatch);
    return producer.send({
      topic: "order-topic",
      messages: batchOrders.map((order) => ({
        key: order.customerId,
        value: JSON.stringify(order),
      })),
    });
  });
  
  await Promise.all(promises);
  
  const totalMessages = batchCount * messagesPerBatch;
  const duration = Date.now() - start4;
  console.log(`Sent ${totalMessages} messages in ${duration}ms`);
  console.log(`Throughput: ${Math.round(totalMessages / (duration / 1000))} msgs/sec`);

  await producer.disconnect();
  console.log("\n✅ Producer disconnected");
};

runExamples().catch(console.error);

