const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const loginRequired = require("../middleware/loginRequired");

const SECRET = "yashisagoodboy";

//create a session
router.post("/create", loginRequired, async (req, res) => {
  try {
    const { sessionId, creator } = req.body;
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
    const { sessionId, participant } = req.body;
    const session = await Session.findOne({ sessionId });
    session.participants.push(participant);
    await session.save();
    res.send(session);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

//get all sessions by a user
router.get("/getSessions/:userId", loginRequired, async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await Session.find({ creator: userId });
    res.send(sessions);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
