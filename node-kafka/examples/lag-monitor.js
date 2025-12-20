/**
 * Kafka Consumer Lag Monitor
 * 
 * This script monitors consumer lag for a given consumer group.
 * Run: node examples/lag-monitor.js
 */

const { kafka } = require("../kafka");

const ALERT_THRESHOLD = 100; // Alert if lag > 100 messages

const checkLag = async () => {
  const admin = kafka.admin();
  await admin.connect();

  try {
    // Get all consumer groups
    const groups = await admin.listGroups();
    console.log("\n📊 Consumer Groups Found:", groups.groups.map(g => g.groupId));

    // Check lag for notification-group
    const groupId = "notification-group";
    
    // Get group description
    const groupDesc = await admin.describeGroups([groupId]);
    console.log(`\n🔍 Group "${groupId}" State:`, groupDesc.groups[0]?.state || "NOT FOUND");

    // Get current consumer offsets
    const offsets = await admin.fetchOffsets({
      groupId,
      topics: ["order-topic"],
    });

    // Get latest offsets (log end)
    const topicOffsets = await admin.fetchTopicOffsets("order-topic");

    console.log("\n📈 Lag Report for", groupId);
    console.log("═".repeat(70));
    console.log(
      "Partition".padEnd(12) +
      "Consumer Offset".padEnd(18) +
      "Log End Offset".padEnd(18) +
      "Lag".padEnd(10) +
      "Status"
    );
    console.log("─".repeat(70));

    let totalLag = 0;

    for (const topicData of offsets) {
      for (const partition of topicData.partitions) {
        const endOffset = topicOffsets.find(
          (p) => p.partition === partition.partition
        );

        const consumerOffset = parseInt(partition.offset) || 0;
        const logEndOffset = parseInt(endOffset?.high) || 0;
        const lag = Math.max(0, logEndOffset - consumerOffset);
        totalLag += lag;

        const status = lag > ALERT_THRESHOLD ? "⚠️ HIGH" : "✅ OK";

        console.log(
          `P${partition.partition}`.padEnd(12) +
          consumerOffset.toString().padEnd(18) +
          logEndOffset.toString().padEnd(18) +
          lag.toString().padEnd(10) +
          status
        );
      }
    }

    console.log("═".repeat(70));
    console.log(`Total Lag: ${totalLag} messages`);

    if (totalLag > ALERT_THRESHOLD * topicOffsets.length) {
      console.log("\n🚨 ALERT: High consumer lag detected!");
      console.log("Recommendations:");
      console.log("  1. Scale up consumers (run more instances)");
      console.log("  2. Check if consumers are healthy");
      console.log("  3. Optimize message processing time");
    } else {
      console.log("\n✅ Lag is within acceptable limits");
    }

  } catch (error) {
    console.error("Error checking lag:", error.message);
  } finally {
    await admin.disconnect();
  }
};

// Run once
checkLag();

// Or run periodically (uncomment below):
// console.log("Starting lag monitor (checking every 10 seconds)...");
// setInterval(checkLag, 10000);


