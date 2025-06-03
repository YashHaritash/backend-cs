require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socket = require("socket.io");
const fs = require("fs");
const { url } = require("inspector");
const exec = require("child_process").exec;
const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
// Configure CORS for Express
const corsOptions = {
  origin: process.env.CORS_ORIGIN, // Use env variable
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow Authorization header
  credentials: true, // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions)); // Apply CORS configuration to Express
app.use(express.json());

app.use("/auth", require("./routes/Auth"));
app.use("/session", require("./routes/Session"));
app.use("/code", require("./routes/Code"));

app.post("/run-c", (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send({ error: "C code is required!" });
  }
  const codePath = "/tmp/code.c";
  const execPath = "/tmp/code.out";
  fs.writeFileSync(codePath, code);
  exec(
    `gcc ${codePath} -o ${execPath} && timeout 2s ${execPath}`,
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error running C code" });
      }
      res.send({ output: stdout });
    }
  );
});

app.post("/run-cpp", (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send({ error: "C++ code is required!" });
  }
  const codePath = "/tmp/code.cpp";
  const execPath = "/tmp/codecpp.out";
  fs.writeFileSync(codePath, code);
  exec(
    `g++ ${codePath} -o ${execPath} && timeout 2s ${execPath}`,
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error running C++ code" });
      }
      res.send({ output: stdout });
    }
  );
});

app.post("/run-python", (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send({ error: "Python code is required!" });
  }
  const scriptPath = "/tmp/script.py";
  fs.writeFileSync(scriptPath, code);
  exec(`timeout 2s python3 ${scriptPath}`, (err, stdout, stderr) => {
    if (err) {
      return res
        .status(500)
        .send({ error: stderr || "Error running Python code" });
    }
    res.send({ output: stdout });
  });
});

app.post("/run-java", (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).send({ error: "Java code is required!" });
  }
  const codePath = "/tmp/Main.java";
  fs.writeFileSync(codePath, code);
  exec(
    `javac ${codePath} && timeout 2s java -cp /tmp Main`,
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error running Java code" });
      }
      res.send({ output: stdout });
    }
  );
});
// Configure Socket.io with CORS
const io = socket(server, {
  cors: {
    origin: process.env.CORS_ORIGIN, // Use env variable for allowed origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Object to store the current code state for each session
const sessionCodeMap = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Chat functionality (Supports both text & audio)
  socket.on("chat", (data) => {
    const { sessionId, message, name, type } = data;

    if (!sessionId || !message || !name) return;

    // Ensure type is either "text" or "audio"
    const messageType = type === "audio" ? "audio" : "text";

    // Emit message with correct type
    io.to(sessionId).emit("chat", { name, message, type: messageType });
  });

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
    const { sessionId, code, name } = data;

    // Update the session's code state
    sessionCodeMap[sessionId] = code;

    // Emit to all clients in the session room
    io.to(sessionId).emit("code", code);
    io.to(sessionId).emit("name", name);
    console.log(`Code updated in session: ${sessionId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

server.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running on port http://localhost:${process.env.PORT || 3000}`
  );
});

module.exports = io;
