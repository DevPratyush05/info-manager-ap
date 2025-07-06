const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController"); // Ensure this path is correct

// Test route - verify this works first
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes working!" });
});

// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
