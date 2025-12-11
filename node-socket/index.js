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

// middleware in socket
adminNamespace.use((socket, next) => {
  const token = socket?.handshake?.auth?.token;
  if (token !== "token1234") {
    return next(new Error("Unauthorized: Invalid Token"));
  }
  
  next();
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

  // Rooms -----
  // This listens for an event named "joinRoom" sent from the client
  socket.on("joinRoom", (roomName) => {
    // Internlly, Socket.IO maintains a map of rooms and socket IDs
    socket.join(roomName);
    console.log(`${socket.id} joined room ${roomName}`);

    socket
      .to(roomName)
      .emit("room-message", `User ${socket.id} joined ${roomName}`); // NOTE: If we used io.to(roomName).emit(...), even the sender would receive it.

    socket.on("sendMessage", (payload) => {
      socket
        .to(payload.room)
        .emit("room-message", `${socket.id}: ${payload.message}`);
    });
  });

  // Rooms --------------

  socket.on("disconnect", () => {
    users--;
    console.log("User disconnected");
  });
});

/**
 * 
 * 
| Method               | Purpose                                |
| -------------------- | -------------------------------------- |
| `socket.on()`        | Listen for an event from client        |
| `socket.join()`      | Add socket to a specific room          |
| `socket.to().emit()` | Send message to room, excluding sender |
| `io.to().emit()`     | Send message to room, including sender |

 * 
 * 
 */

/**
 * ============================================================================
 * WEBSOCKET vs SOCKET.IO COMPARISON
 * ============================================================================
 *
 * WHAT ARE THEY?
 * --------------
 * WebSocket  = Low-level PROTOCOL for real-time communication
 * Socket.IO  = LIBRARY built on top of WebSocket with extra features
 *
 * ============================================================================
 *
 * WEBSOCKET (Raw Protocol)
 * ------------------------
 * 
 * // Client (Browser - Native API)
 * const ws = new WebSocket("ws://localhost:3000");
 * ws.onopen = () => ws.send("Hello");
 * ws.onmessage = (event) => console.log(event.data);
 * 
 * // Server (Node.js with 'ws' package)
 * const WebSocket = require("ws");
 * const wss = new WebSocket.Server({ port: 3000 });
 * wss.on("connection", (ws) => {
 *   ws.on("message", (msg) => ws.send("Reply"));
 * });
 *
 * ============================================================================
 *
 * SOCKET.IO (Library)
 * -------------------
 * 
 * // Client
 * const socket = io("http://localhost:3000");
 * socket.emit("chat", { message: "Hello" });  // Custom events!
 * socket.on("response", (data) => console.log(data));
 * 
 * // Server
 * io.on("connection", (socket) => {
 *   socket.on("chat", (data) => socket.emit("response", data));
 *   socket.join("room1");                     // Rooms built-in!
 *   socket.to("room1").emit("announcement");  // Broadcasting built-in!
 * });
 *
 * ============================================================================
 *
 * KEY DIFFERENCES:
 * ----------------
 *
 * 1. TRANSPORT FALLBACKS
 *    WebSocket:  WebSocket only → If blocked, FAILS!
 *    Socket.IO:  WebSocket → Long-Polling → Other transports (auto-fallback)
 *
 * 2. AUTO-RECONNECTION
 *    WebSocket:  Must implement manually
 *    Socket.IO:  Built-in with exponential backoff
 *
 * 3. EVENTS
 *    WebSocket:  Only "message" event, must parse JSON manually
 *    Socket.IO:  Custom named events with auto-serialization
 *
 * 4. ROOMS & BROADCASTING
 *    WebSocket:  Must implement yourself
 *    Socket.IO:  socket.join(), socket.to(), io.to() built-in
 *
 * 5. NAMESPACES
 *    WebSocket:  Not supported
 *    Socket.IO:  io.of("/chat"), io.of("/admin") built-in
 *
 * ============================================================================
 *
 * FEATURE COMPARISON TABLE:
 * -------------------------
 * | Feature          | WebSocket      | Socket.IO      |
 * |------------------|----------------|----------------|
 * | Protocol         | ws:// or wss://| http:// https://|
 * | Fallbacks        | ❌ None        | ✅ Built-in    |
 * | Rooms            | ❌ Manual      | ✅ Built-in    |
 * | Namespaces       | ❌ No          | ✅ Built-in    |
 * | Auto-reconnect   | ❌ Manual      | ✅ Built-in    |
 * | Custom events    | ❌ No          | ✅ Built-in    |
 * | Broadcasting     | ❌ Manual      | ✅ Built-in    |
 * | Middleware       | ❌ No          | ✅ Built-in    |
 * | Packet overhead  | ~2 bytes       | ~10-20 bytes   |
 * | Performance      | Faster (raw)   | Slightly slower|
 *
 * ============================================================================
 *
 * CAN THEY TALK TO EACH OTHER?
 * ----------------------------
 * NO! Socket.IO adds its own protocol layer.
 * 
 * ❌ const ws = new WebSocket("ws://socketio-server:3000");
 *    // Won't work! Socket.IO server won't understand raw WebSocket
 * 
 * ✅ Both sides must use the same technology
 *
 * ============================================================================
 *
 * WHEN TO USE WHICH?
 * ------------------
 *
 * Use WEBSOCKET when:
 *   • Maximum performance needed
 *   • Simple use case (no rooms/broadcasting)
 *   • Minimal overhead required
 *   • Building games or real-time trading apps
 *
 * Use SOCKET.IO when:
 *   • Need fallback support (corporate firewalls, old browsers)
 *   • Need rooms, namespaces, broadcasting
 *   • Want auto-reconnection
 *   • Building chat apps, collaboration tools
 *   • Want faster development time
 *
 * ============================================================================
 *
 * ARCHITECTURE:
 * -------------
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                              SOCKET.IO                                   │
 * │  ┌───────────────────────────────────────────────────────────────────┐  │
 * │  │                         FEATURES LAYER                             │  │
 * │  │  • Rooms • Namespaces • Broadcasting • Auto-reconnect • Events    │  │
 * │  └───────────────────────────────────────────────────────────────────┘  │
 * │                                    │                                     │
 * │  ┌───────────────────────────────────────────────────────────────────┐  │
 * │  │                      ENGINE.IO (Transport Layer)                   │  │
 * │  │    ┌───────────┐    ┌─────────────┐    ┌──────────────┐           │  │
 * │  │    │ WebSocket │    │ Long-Polling│    │ Other Transp │           │  │
 * │  │    │ (Primary) │    │  (Fallback) │    │  (Fallback)  │           │  │
 * │  │    └───────────┘    └─────────────┘    └──────────────┘           │  │
 * │  └───────────────────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                              WEBSOCKET                                   │
 * │  ┌───────────────────────────────────────────────────────────────────┐  │
 * │  │                         RAW PROTOCOL                               │  │
 * │  │        • Binary frames • Text frames • Ping/Pong • Close           │  │
 * │  └───────────────────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SUMMARY:
 * --------
 * WebSocket = The engine (raw, fast, basic)
 * Socket.IO = The car (engine + features + comfort)
 *
 * ============================================================================
 */
