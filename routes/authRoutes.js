// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  loginUser,
  getCurrentUser,
  registerUser,
  logoutUser,
  authenticate,
} = require("../controllers/authController");

router.get("/me", authenticate, getCurrentUser);

router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/register", registerUser);

// You would add other auth routes here (signup, social login redirects)
// router.post("/register", registerUser);

module.exports = router;
