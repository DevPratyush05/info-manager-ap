const express = require("express");
const router = express.Router();
const {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
} = require("../controllers/noteController");
const { protect } = require("../middleware/authMiddleware"); // Import the protect middleware

// Apply the protect middleware to all note routes to ensure only authenticated users can access them
router.route("/").get(protect, getNotes).post(protect, createNote);
router
  .route("/:id")
  .get(protect, getNoteById)
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;
