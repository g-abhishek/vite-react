const { kafka } = require("./kafka");

const createTopic = async () => {
  const kafkaAdmin = kafka.admin();
  await kafkaAdmin.connect();

  const res = await kafkaAdmin.createTopics({
    topics: [
      {
        topic: "order-topic",
        numPartitions: 2,
      },
    ],
  });

  console.log(res ? "Topic created successfully" : "Topic already exists");

  await kafkaAdmin.disconnect();
};

const addPartition = async () => {
  const kafkaAdmin = kafka.admin();
  await kafkaAdmin.connect();

  await kafkaAdmin.createPartitions({
    topicPartitions: [
      {
        topic: "order-topic",
        count: 4, // Total number of partitions you want (NOT how many more)
      },
    ],
  });
  console.log("Partitions updated successfully");

  await kafkaAdmin.disconnect();
};

// createTopic();
addPartition();
