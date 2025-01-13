const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const SECRET = "yashisagoodboy";

//no login required
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");
    if (!user.comparePassword(password))
      return res.status(401).send("Incorrect password");

    jwt.sign({ id: user._id }, SECRET, (err, token) => {
      if (err) return res.status(500).send("Internal server error");
      res.send(token);
    });
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

//no login required
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = new User({ email, password, name });
    await user.save();
    jwt.sign({ id: user._id }, SECRET, (err, token) => {
      if (err) return res.status(500).send("Internal server error");
      res.send(token);
    });
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
