const express = require("express");
const http = require("http");
const app = express();
const httpServer = http.createServer(app);

const io = require("socket.io")(httpServer);

app.use(express.static("./"));

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// Socket.io Connection
let users = 0;

io.on("connection", (socket) => {
  console.log("A user connected");
  users++;

  // Send a message to the connected client
  // pre-reserved events, client to listen on "message" event
  socket.send("Hello from server!");

  // Broadcast to all other clients (excluding the sender)
  socket.broadcast.emit(
    "announcement",
    `New user connected. Total count is ${users}`
  );

  socket.on("disconnect", () => {
    users--;
    console.log("User disconnected");
  });
});
