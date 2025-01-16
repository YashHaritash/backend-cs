const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socket = require("socket.io");

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
const corsOptions = {
  origin: "http://localhost:5173", // Allow frontend origin
  methods: ["GET", "POST"], // Specify allowed methods
  allowedHeaders: ["Content-Type"], // Allow headers
  credentials: true, // Allow credentials (cookies, etc.)
};

app.use(cors(corsOptions)); // Apply CORS configuration to Express
app.use(express.json());

app.use("/auth", require("./routes/Auth"));
app.use("/session", require("./routes/Session"));
app.use("/code", require("./routes/Code"));

// Configure Socket.io with CORS
const io = socket(server, {
  cors: {
    origin: "http://localhost:5173", // Allow frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Object to store the current code state for each session
const sessionCodeMap = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle joining a session
  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
    console.log(`User joined session: ${sessionId}`);

    // Send the current code state to the newly connected user
    if (sessionCodeMap[sessionId]) {
      socket.emit("code", sessionCodeMap[sessionId]);
    }
  });

  // Broadcast code updates to a specific session (room)
  socket.on("code", (data) => {
    const { sessionId, code } = data;

    // Update the session's code state
    sessionCodeMap[sessionId] = code;

    // Emit to all clients in the session room except the sender
    socket.to(sessionId).emit("code", code);
    console.log(`Code updated in session: ${sessionId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

mongoose
  .connect("mongodb://localhost:27017/cs", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
