const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", require("./routes/Auth"));
app.use("/session", require("./routes/Session"));
app.use("/code", require("./routes/Code"));

mongoose.connect("mongodb://localhost:27017/cs");

app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
});
