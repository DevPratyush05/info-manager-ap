const mongoose = require("mongoose");

const noteSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // This links the note to a specific user
      required: true,
      ref: "User", // References the 'User' model
    },
    title: {
      type: String,
      required: [true, "Please add a title for your note"],
      trim: true, // Remove whitespace from both ends of a string
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [100, "Title cannot be more than 100 characters long"],
    },
    content: {
      type: String,
      required: [true, "Please add content for your note"],
      maxlength: [5000, "Note content cannot exceed 5000 characters"],
    },
    // The date stamp will be handled by Mongoose's timestamps option
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Note", noteSchema);
