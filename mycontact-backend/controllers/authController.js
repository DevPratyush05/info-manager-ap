// authController.js
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Note = require("../models/noteModel"); // NEW: Import Note model for account deletion

// --- Define generateToken function here ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};
// --- End generateToken definition ---

// @desc Register
exports.registerUser = asyncHandler(async (req, res) => {
  console.log("--- Register route hit ---");
  console.log("1. Request body received:", req.body);

  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    console.log(
      "2. Missing fields detected. Setting status 400 and throwing error."
    );
    res.status(400);
    throw new Error("All fields required");
  }

  console.log("3. Checking if user already exists for email:", email);
  const userExists = await User.findOne({ email });
  if (userExists) {
    console.log(
      "4. User already exists. Setting status 400 and throwing error."
    );
    res.status(400);
    throw new Error("User already exists");
  }

  console.log("5. Hashing password...");
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("6. Password hashed successfully.");

  console.log("7. Creating new user in database...");
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });
  console.log("8. User created successfully:", user._id);

  console.log("9. Generating token and sending 201 response.");
  res.status(201).json({
    _id: user.id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
  console.log("10. Response sent for successful registration.");
});

// @desc Login
exports.loginUser = asyncHandler(async (req, res) => {
  console.log("--- Login route hit ---");
  console.log("Request body:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please enter both email and password.");
  }

  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

// @desc Logout user (Client-side token removal, potentially server-side session invalidation if using sessions)
// @route POST /api/v1/auth/logout
// @access Public (or Private if invalidating server-side sessions)
exports.logoutUser = asyncHandler(async (req, res) => {
  // For JWTs stored client-side (like localStorage), logout primarily involves client-side token removal.
  // However, we can send a success response to acknowledge the request.
  // If you were using HTTP-only cookies, you'd clear the cookie here: res.clearCookie('token');
  res.status(200).json({ message: "Logged out successfully" });
});

// @desc Delete user account and all associated notes
// @route DELETE /api/v1/auth/delete-account
// @access Private (requires JWT)
exports.deleteUserAccount = asyncHandler(async (req, res) => {
  const userId = req.user.id; // User ID from the protect middleware

  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Delete all notes associated with the user
  await Note.deleteMany({ user: userId });

  // Delete the user account
  await User.deleteOne({ _id: userId });

  // Invalidate token/session if applicable (for JWT, client removes it)
  res
    .status(200)
    .json({
      message: "Account and all associated notes deleted successfully.",
    });
});
