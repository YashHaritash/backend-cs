const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const http = require("http");
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

app.use(express.json());
app.use(cors());

app.use("/auth", require("./routes/Auth"));
app.use("/session", require("./routes/Session"));
app.use("/code", require("./routes/Code"));

// // Serve static files from the 'public' directory
// app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle joining a session
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
    console.log(`User joined session: ${sessionId}`);
  });

  // Broadcast code updates to a specific session (room)
  socket.on("code", (data) => {
    const { sessionId, code } = data;
    socket.to(sessionId).emit("code", code); // Emit to all clients in the session room
    console.log(`Code updated in session: ${sessionId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

mongoose
  .connect("mongodb://localhost:27017/cs")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

server.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});

module.exports = io;
