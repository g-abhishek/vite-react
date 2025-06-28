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
io.on("connection", (socket) => {
    console.log(socket);
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
