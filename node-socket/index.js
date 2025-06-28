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

// Namespaces allow you to create multiple, independent communication channels on the same Socket.IO server — all over the same underlying connection.
// Think of them as virtual endpoints that separate different parts of your real-time logic.
const chatNamespace = io.of("/chat");
const adminNamespace = io.of("/admin");
chatNamespace.on("connection", (socket) => {
  console.log("User connected to CHAT namespace");

  socket.send("Welcome to the chat room!");
});

adminNamespace.on("connection", (socket) => {
  console.log("Admin connected");

  socket.send("Admin area access granted");
});

// This operates on the default namespace, which is simply /.
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
