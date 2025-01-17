const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const loginRequired = require("../middleware/loginRequired");
const io = require("../index");

const SECRET = "yashisagoodboy";

//create a session
const generateSessionId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let sessionId = "";
  for (let i = 0; i < 5; i++) {
    sessionId += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return sessionId;
};

router.post("/create", loginRequired, async (req, res) => {
  try {
    const { creator } = req.body;
    const sessionId = generateSessionId();
    const session = new Session({ sessionId, creator });
    await session.save();
    res.send(session);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

//join a session
router.post("/join", loginRequired, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).send("Session not found");
    }

    // Add participant to the session if not already added
    if (!session.participants.includes(req.user.id)) {
      session.participants.push(req.user.id);
      await session.save();
    }

    // Emit event to notify others that a user joined
    // io.to(sessionId).emit("userJoined", { userId: req.user.id });

    res.send(session);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
});

// Get all sessions by a user with userId as a URL parameter
router.get("/getSessions/:userId", loginRequired, async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await Session.find({ creator: userId });
    res.send(sessions);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

//delete session
router.delete("/delete/:sessionId", loginRequired, async (req, res) => {
  try {
    const { sessionId } = req.params;
    await Session.deleteOne({ sessionId });
    res.send("Session deleted");
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

router.get("/details/:sessionId", loginRequired, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).populate("participants");
    res.send(session);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

router.post("/leave", loginRequired, async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const session = await Session.findById(sessionId);
    session.participants = session.participants.filter(
      (participant) => participant.toString() !== userId
    );
    await session.save();
    res.send("Left the session");
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
