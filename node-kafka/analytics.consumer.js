const { kafka } = require("./kafka");

const consumer = kafka.consumer({
  groupId: "analytics-group",
});

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "order-topic",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message, partition }) => {
      console.log("Analytics Consuming Message...");
      console.log(
        `PARTITION=${partition}`,
        JSON.parse(message.value.toString())
      );
    },
  });
};

run().catch(console.error);
