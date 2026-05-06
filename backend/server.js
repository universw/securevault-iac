const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "securevault-backend",
    environment: process.env.NODE_ENV || "dev",
  });
});

app.listen(PORT, () => {
  console.log(`SecureVault backend running on port ${PORT}`);
});