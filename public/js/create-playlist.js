const API_BASE = "http://localhost:8080/api/v1";

const form = document.getElementById("createPlaylistForm");
const cancelBtn = document.getElementById("cancelBtn");
const createBtn = document.getElementById("createBtn");
const createBtnText = document.getElementById("createBtnText");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("playlistName").value.trim();
  const description = document.getElementById("playlistDescription").value.trim();
  const isPublic = document.getElementById("playlistVisibility").value;

  if (!name || !isPublic) {
    document.getElementById("nameError").textContent = !name ? "Playlist name is required" : "";
    document.getElementById("visibilityError").textContent = !isPublic ? "Visibility is required" : "";
    return;
  }

  createBtn.disabled = true;
  createBtnText.textContent = "Creating...";

  try {
    const res = await fetch(`${API_BASE}/playlist/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        description,
        isPublic: isPublic === "true"
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create playlist");

    // Save success toast
    localStorage.setItem("toastMessage", "Playlist created successfully!");
    localStorage.setItem("toastType", "success");

    window.location.href = "library.html";
  } catch (err) {
    console.error(err);
    localStorage.setItem("toastMessage", "Error: " + err.message);
    localStorage.setItem("toastType", "error");
    window.location.href = "library.html";
  } finally {
    createBtn.disabled = false;
    createBtnText.textContent = "Create Playlist";
  }
});

cancelBtn.addEventListener("click", () => {
  window.location.href = "library.html";
});
