const { Kafka } = require("kafkajs");

const pid = process.pid;
const kafka = new Kafka({
  clientId: `notification-service-${pid}`,
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "notification-group",
});

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "order-topic",
    fromBeginning: true,
  });

  await consumer.run({
    autoCommit: false, // Turn off automatic commit
    eachMessage: async ({ message, partition }) => {
      console.log("Notification Consuming Message...");
      console.log(
        `CONSUMER=${pid} ::: PARTITION=${partition}`,
        JSON.parse(message.value.toString())
      );

      // Commit the next offset (mark this message as processed)
      // Kafka expects next offset to consume, so you commit current offset + 1.
      await consumer.commitOffsets({
        topic,
        partition,
        offset: (parseInt(message.offset, 10) + 1).toString(),
      });
    },
  });
};

run().catch(console.error);
