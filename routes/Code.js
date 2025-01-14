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

// Update code with version history
router.put("/update/:codeId", loginRequired, async (req, res) => {
  try {
    const { codeId } = req.params;
    const { code } = req.body;

    // Find the current code
    const currentCode = await Code.findById(codeId);

    if (!currentCode) {
      return res.status(404).send("Code not found");
    }

    // Push the old code into the version history before updating
    currentCode.versionHistory.push({
      code: currentCode.code,
      updatedAt: Date.now(),
    });

    // Update the code field with the new code
    currentCode.code = code;
    currentCode.updatedAt = Date.now();

    // Save the updated code
    await currentCode.save();

    res.send(currentCode);
  } catch (err) {
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
