/**
 * Kafka Admin Operations
 * 
 * Demonstrates common admin operations for managing topics.
 * Run: node examples/topic-admin.js
 */

const { kafka } = require("../kafka");

const admin = kafka.admin();

// List all topics
const listTopics = async () => {
  const topics = await admin.listTopics();
  console.log("\n📋 All Topics:");
  topics.forEach((topic) => {
    const isInternal = topic.startsWith("__");
    console.log(`   ${isInternal ? "🔒" : "📁"} ${topic}`);
  });
  return topics;
};

// Get topic details
const describeTopics = async (topicNames) => {
  const metadata = await admin.fetchTopicMetadata({ topics: topicNames });

  console.log("\n📊 Topic Details:");
  console.log("═".repeat(70));

  for (const topic of metadata.topics) {
    console.log(`\n📁 Topic: ${topic.name}`);
    console.log("─".repeat(50));
    console.log(`   Partitions: ${topic.partitions.length}`);

    console.log("\n   Partition Distribution:");
    for (const partition of topic.partitions) {
      console.log(
        `   P${partition.partitionId}: ` +
        `Leader=B${partition.leader}, ` +
        `Replicas=[${partition.replicas.join(",")}], ` +
        `ISR=[${partition.isr.join(",")}]`
      );
    }
  }
};

// Create a new topic
const createTopic = async (topicName, numPartitions = 3, replicationFactor = 1) => {
  console.log(`\n🆕 Creating topic: ${topicName}`);
  console.log(`   Partitions: ${numPartitions}`);
  console.log(`   Replication Factor: ${replicationFactor}`);

  try {
    const result = await admin.createTopics({
      topics: [
        {
          topic: topicName,
          numPartitions,
          replicationFactor,
          configEntries: [
            { name: "retention.ms", value: "604800000" }, // 7 days
            { name: "cleanup.policy", value: "delete" },
          ],
        },
      ],
    });

    if (result) {
      console.log(`   ✅ Topic created successfully`);
    } else {
      console.log(`   ⚠️ Topic already exists`);
    }
  } catch (error) {
    console.error(`   ❌ Failed to create topic: ${error.message}`);
  }
};

// Delete a topic
const deleteTopic = async (topicName) => {
  console.log(`\n🗑️ Deleting topic: ${topicName}`);

  try {
    await admin.deleteTopics({
      topics: [topicName],
      timeout: 5000,
    });
    console.log(`   ✅ Topic deleted successfully`);
  } catch (error) {
    console.error(`   ❌ Failed to delete topic: ${error.message}`);
  }
};

// Add partitions to existing topic
const addPartitions = async (topicName, totalPartitions) => {
  console.log(`\n📈 Adding partitions to: ${topicName}`);
  console.log(`   New total partitions: ${totalPartitions}`);

  try {
    await admin.createPartitions({
      topicPartitions: [
        {
          topic: topicName,
          count: totalPartitions,
        },
      ],
    });
    console.log(`   ✅ Partitions added successfully`);
    console.log(`   ⚠️ Warning: Key-based ordering may be affected!`);
  } catch (error) {
    console.error(`   ❌ Failed to add partitions: ${error.message}`);
  }
};

// Get topic offsets
const getTopicOffsets = async (topicName) => {
  console.log(`\n📍 Offsets for topic: ${topicName}`);
  console.log("─".repeat(50));

  const offsets = await admin.fetchTopicOffsets(topicName);

  let totalMessages = 0;
  for (const partition of offsets) {
    const low = parseInt(partition.low);
    const high = parseInt(partition.high);
    const messages = high - low;
    totalMessages += messages;

    console.log(
      `   P${partition.partition}: ` +
      `Low=${low}, High=${high}, ` +
      `Messages=${messages}`
    );
  }

  console.log("─".repeat(50));
  console.log(`   Total messages in topic: ${totalMessages}`);
};

// List consumer groups
const listConsumerGroups = async () => {
  const groups = await admin.listGroups();

  console.log("\n👥 Consumer Groups:");
  console.log("─".repeat(50));

  for (const group of groups.groups) {
    console.log(`   ${group.groupId} (${group.protocolType})`);
  }

  return groups.groups;
};

// Describe consumer group
const describeConsumerGroup = async (groupId) => {
  console.log(`\n🔍 Consumer Group: ${groupId}`);
  console.log("─".repeat(50));

  try {
    const description = await admin.describeGroups([groupId]);
    const group = description.groups[0];

    console.log(`   State: ${group.state}`);
    console.log(`   Protocol: ${group.protocol}`);
    console.log(`   Members: ${group.members.length}`);

    for (const member of group.members) {
      console.log(`\n   Member: ${member.memberId.substring(0, 30)}...`);
      console.log(`   Client: ${member.clientId}`);
      console.log(`   Host: ${member.clientHost}`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
};

// Reset consumer group offsets
const resetOffsets = async (groupId, topicName, toEarliest = true) => {
  console.log(`\n🔄 Resetting offsets for: ${groupId}`);
  console.log(`   Topic: ${topicName}`);
  console.log(`   To: ${toEarliest ? "earliest" : "latest"}`);

  try {
    await admin.resetOffsets({
      groupId,
      topic: topicName,
      earliest: toEarliest,
    });
    console.log(`   ✅ Offsets reset successfully`);
    console.log(`   ⚠️ Note: Consumer group must be stopped first!`);
  } catch (error) {
    console.error(`   ❌ Failed to reset offsets: ${error.message}`);
  }
};

// Main demo function
const runDemo = async () => {
  await admin.connect();
  console.log("✅ Admin connected\n");

  // List existing topics
  const topics = await listTopics();

  // Describe order-topic if it exists
  if (topics.includes("order-topic")) {
    await describeTopics(["order-topic"]);
    await getTopicOffsets("order-topic");
  }

  // List consumer groups
  const groups = await listConsumerGroups();

  // Describe notification-group if it exists
  if (groups.some((g) => g.groupId === "notification-group")) {
    await describeConsumerGroup("notification-group");
  }

  // Demo: Create a test topic
  await createTopic("test-admin-topic", 3, 1);

  // Describe the new topic
  await describeTopics(["test-admin-topic"]);

  // Clean up: Delete test topic
  await deleteTopic("test-admin-topic");

  await admin.disconnect();
  console.log("\n✅ Admin disconnected");
};

runDemo().catch(console.error);


