const asyncHandler = require("express-async-handler");
const Note = require("../models/noteModel");
const User = require("../models/userModel"); // Needed to check user existence

// @desc Get all notes for the authenticated user
// @route GET /api/v1/notes
// @access Private
const getNotes = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 }); // Sort by newest first
  res.status(200).json(notes);
});

// @desc Create a new note
// @route POST /api/v1/notes
// @access Private
const createNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error("Please add a title and content for your note.");
  }

  // Check if user exists (though protect middleware already ensures this)
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(401);
    throw new Error("User not found.");
  }

  const note = await Note.create({
    title,
    content,
    user: req.user.id, // Assign the note to the authenticated user
  });

  res.status(201).json(note);
});

// @desc Get a single note by ID
// @route GET /api/v1/notes/:id
// @access Private
const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  // Ensure the logged-in user owns the note
  if (note.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to view this note.");
  }

  res.status(200).json(note);
});

// @desc Update a note by ID
// @route PUT /api/v1/notes/:id
// @access Private
const updateNote = asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  // Ensure the logged-in user owns the note
  if (note.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to update this note.");
  }

  // Update only provided fields
  const updatedNote = await Note.findByIdAndUpdate(
    req.params.id,
    { title, content },
    { new: true, runValidators: true } // Return the updated document and run schema validators
  );

  res.status(200).json(updatedNote);
});

// @desc Delete a note by ID
// @route DELETE /api/v1/notes/:id
// @access Private
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    res.status(404);
    throw new Error("Note not found.");
  }

  if (note.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to delete this note.");
  }

  await Note.deleteOne({ _id: req.params.id });
  res.status(200).json({ message: "Note removed successfully." });
});

module.exports = {
  getNotes,
  createNote,
  getNoteById,
  updateNote,
  deleteNote,
};
