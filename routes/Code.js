const express = require("express");
const router = express.Router();

const Code = require("../models/Code");
const Session = require("../models/Session");

const loginRequired = require("../middleware/loginRequired");

//create a code
router.post("/create", loginRequired, async (req, res) => {
  try {
    const { sessionId, code } = req.body;
    const newCode = new Code({ sessionId, code });
    await newCode.save();
    res.send(newCode);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

//get all code by a session
router.get("/getCode/:sessionId", loginRequired, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const code = await Code.find({ sessionId });
    res.send(code);
  } catch {
    return res.status(500).send("Internal server error");
  }
});

//update code
router.put("/update/:codeId", loginRequired, async (req, res) => {
  try {
    const { codeId } = req.params;
    const { code } = req.body;
    const updatedCode = await Code.findOneAndUpdate(
      { _id: codeId },
      { code },
      { new: true }
    );
    res.send(updatedCode);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
