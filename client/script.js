// const api = "http://127.0.0.1:5001/api"; // OLD BASE
const api = "http://127.0.0.1:5001/api/v1"; // NEW BASE API PATH

// =====================
// AUTHENTICATION LOGIC
// =====================

// DOM Elements
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

// Form toggle functionality
if (loginTab && registerTab) {
  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
  });

  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  });
}

// Register user
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("registerUsername").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    try {
      // Changed endpoint from /users/register to /auth/register
      const response = await fetch(`${api}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        // Also store user data in localStorage, as it's returned by the backend
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: data._id,
            username: data.username,
            email: data.email,
          })
        );
        window.location.href = "dashboard.html";
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration");
    }
  });
}

// Login user
if (loginForm) {
  // Inside the 'if (loginForm)' block
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    await login(email, password); // Call the login function
  });

  async function login(email, password) {
    try {
      // Changed endpoint from /users/login to /auth/login
      const response = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Clear any existing tokens
      localStorage.clear();

      // Store new token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data._id,
          username: data.username,
          email: data.email,
        })
      );

      window.location.href = "dashboard.html";
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Login failed. Please try again.");
    }
  }
}

// Utility function for showing alerts (optional, but good for user feedback)
function showAlert(message, type = "info") {
  // Implement a simple alert display, e.g., a div that appears and fades
  // For now, we'll just use alert()
  alert(message);
}

// =================
// NOTES DASHBOARD
// =================

// Check authentication on dashboard
if (window.location.pathname.includes("dashboard.html")) {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
  }

  // DOM Elements
  const noteForm = document.getElementById("noteForm");
  const notesList = document.getElementById("notesList");
  const logoutBtn = document.getElementById("logoutBtn");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  // Event Listeners for dashboard actions
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", deleteAccount);
  }

  // Load notes on page load
  document.addEventListener("DOMContentLoaded", loadNotes);

  // Add new note
  if (noteForm) {
    noteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("noteTitle").value;
      const content = document.getElementById("noteContent").value;

      try {
        // Corrected endpoint to /notes
        const response = await fetch(`${api}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            content,
          }),
        });

        if (response.ok) {
          document.getElementById("noteTitle").value = "";
          document.getElementById("noteContent").value = "";
          loadNotes();
        } else {
          const errorData = await response.json(); // Read error message from backend
          alert(errorData.message || "Failed to add note");
        }
      } catch (error) {
        console.error("Add note error:", error);
        alert("An error occurred while adding note");
      }
    });
  }

  // Load all notes
  async function loadNotes() {
    try {
      // Corrected endpoint to /notes
      const response = await fetch(`${api}/notes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const notes = await response.json();

      if (notesList) {
        notesList.innerHTML = "";

        if (notes.length === 0) {
          notesList.innerHTML = `
                        <div class="empty-state">
                            <p>You don't have any notes yet. Create your first note above!</p>
                        </div>
                    `;
          return;
        }

        notes.forEach((note) => {
          const noteElement = document.createElement("div");
          noteElement.className = "note-card";
          // Format the date stamp
          const noteDate = new Date(note.createdAt).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            }
          );

          noteElement.innerHTML = `
                        <h3 class="note-title">${note.title}</h3>
                        <p class="note-content">${note.content}</p>
                        <small class="note-date">${noteDate}</small> <div class="note-actions">
                            <button class="delete-btn" data-id="${note._id}">Delete</button>
                        </div>
                    `;
          notesList.appendChild(noteElement);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", async (e) => {
            const noteId = e.target.getAttribute("data-id");
            await deleteNote(noteId);
          });
        });
      }
    } catch (error) {
      console.error("Load notes error:", error);
      alert("An error occurred while loading notes");
    }
  }

  // Delete a note
  async function deleteNote(noteId) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      // Corrected endpoint to /notes/:id
      const response = await fetch(`${api}/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete note"); // Use data.message
      }

      showAlert("Note deleted successfully", "success");
      loadNotes();
    } catch (error) {
      console.error("Delete note error:", error);
      showAlert(error.message, "error");
    }
  }
  // Logout
  async function logout() {
    try {
      // Corrected endpoint to /auth/logout
      const response = await fetch(`${api}/auth/logout`, {
        method: "POST",
        // credentials: "include", // Only needed for cookie-based auth
      });

      if (response.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  }

  // Delete account
  async function deleteAccount() {
    if (
      !confirm(
        "This will permanently delete your account and all notes. Continue?"
      )
    )
      return;

    try {
      // Corrected endpoint to /auth/delete-account
      const response = await fetch(`${api}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Account deletion failed"); // Use data.message
      }

      localStorage.clear();
      window.location.href = "index.html";
    } catch (error) {
      console.error("Delete account error:", error);
      showAlert(error.message, "error");
    }
  }
}
