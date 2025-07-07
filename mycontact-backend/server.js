require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");

// Import new routes and existing ones
const authRoutes = require("./routes/authRoutes");
const noteRoutes = require("./routes/noteRoutes"); // NEW: Import note routes
const {
  logoutUser,
  //  deleteUserAccount,
} = require("./controllers/authController"); // NEW: Import specific auth controller functions for logout/delete

// Create Express app
const app = express();

// Database Connection (modern version) - You confirmed this is working
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); // Parses incoming JSON requests
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter); // Apply to all /api routes

// Routes
app.use("/api/v1/auth", authRoutes); // Auth routes (register, login)
app.use("/api/v1/notes", noteRoutes); // NEW: Notes routes

//const { protect } = require("./middleware/authMiddleware");
app.post("/api/v1/auth/logout", logoutUser); // Logout route
//app.delete("/api/v1/auth/delete-account", protect, deleteUserAccount); // Delete account route, protected

// Start Server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// ✅ 1. Serve static frontend
const path = require("path");
app.use(express.static(path.join(__dirname, "../client")));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
