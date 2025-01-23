const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socket = require("socket.io");
const fs = require("fs");
const exec = require("child_process").exec;

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
const corsOptions = {
  origin: "http://localhost:5173", // Adjust this to your frontend's URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow Authorization header
  credentials: true, // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions)); // Apply CORS configuration to Express
app.use(express.json());

app.use("/auth", require("./routes/Auth"));
app.use("/session", require("./routes/Session"));
app.use("/code", require("./routes/Code"));

app.post("/run-cpp", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send({ error: "C++ code is required!" });
  }

  // Step 2: Save code to `code.cpp`
  fs.writeFileSync("docker-cpp-runner/code.cpp", code);

  // Step 3: Build and Run the Docker Container
  exec(
    "cd docker-cpp-runner && docker build -t cpp-runner . && docker run --rm cpp-runner",
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error executing Docker container" });
      }

      // Step 4: Return the Output to Client
      res.send({ output: stdout });
    }
  );
});

app.post("/run-python", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send({ error: "Python code is required!" });
  }

  // Save the Python code to a file
  const scriptPath = "./docker-python-runner/script.py";
  fs.writeFileSync(scriptPath, code);

  // Build and Run the Docker container
  exec(
    `cd docker-python-runner && docker build -t python-runner . && docker run --rm python-runner`,
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error executing Docker container" });
      }

      // Return the output to the client
      res.send({ output: stdout });
    }
  );
});

app.post("/run-c", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).send({ error: "C code is required!" });
  }

  // Step 1: Save the C code to a file
  const codePath = "./docker-c-runner/code.c";
  fs.writeFileSync(codePath, code);

  // Step 2: Build and run the Docker container
  exec(
    `cd docker-c-runner && docker build -t c-runner . && docker run --rm c-runner`,
    (err, stdout, stderr) => {
      if (err) {
        return res
          .status(500)
          .send({ error: stderr || "Error executing Docker container" });
      }

      // Step 3: Return the output to the client
      res.send({ output: stdout });
    }
  );
});
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
