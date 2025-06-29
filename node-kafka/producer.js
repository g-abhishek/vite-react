const { kafka } = require("./kafka");

const init = async () => {
  const producer = kafka.producer();
  await producer.connect();

  const orders = [
    { customerId: "cust-1", orderId: "order-1" },
    { customerId: "cust-2", orderId: "order-2" },
    { customerId: "cust-1", orderId: "order-3" },
    { customerId: "cust-3", orderId: "order-4" },
    { customerId: "cust-2", orderId: "order-5" },
  ];

  for (const order of orders) {
    await producer.send({
      topic: "order-topic",
      messages: [
        {
          key: order.customerId, // Routing key
          value: JSON.stringify(order),
        },
      ],
    });
    console.log(`Produced: ${order.orderId} for ${order.customerId}`);
  }

//   for (const order of orders) {
//     await producer.send({
//       topic: 'order-topic',
//       messages: [
//         {
//           partition: order.partition, // add partition key in orders array for manula partition 
//           value: JSON.stringify(order),
//         },
//       ],
//     });
//     console.log(`Produced: ${order.orderId} to Partition ${order.partition}`);
//   }

  await producer.disconnect();
};

init();
