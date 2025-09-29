const API_BASE = "http://localhost:8080/api/v1"; 

const playlistsContainer = document.getElementById("playlistsContainer");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const refreshBtn = document.getElementById("refreshLibrary");

// Delete modal elements
const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
const deletePlaylistName = document.getElementById("deletePlaylistName");
const confirmDeleteBtn = document.getElementById("confirmDelete");

let selectedPlaylistId = null;

// ✅ Toast function
function showToast(message, type = "info") {
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    info: "#343a40"
  };

  const existingToast = document.querySelector(".custom-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;

  document.body.appendChild(toast);

  setTimeout(() => (toast.style.transform = "translateX(0)"), 10);
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ✅ Show toast from localStorage (on page load)
document.addEventListener("DOMContentLoaded", () => {
  const message = localStorage.getItem("toastMessage");
  const type = localStorage.getItem("toastType") || "info";

  if (message) {
    showToast(message, type);
    localStorage.removeItem("toastMessage");
    localStorage.removeItem("toastType");
  }

  fetchPlaylists();
});

// Fetch playlists
async function fetchPlaylists() {
  try {
    loadingState.style.display = "block";
    emptyState.style.display = "none";
    playlistsContainer.innerHTML = "";

    const res = await fetch(`${API_BASE}/playlist/user`, {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch playlists");

    const data = await res.json();
    const playlists = data.data || [];

    loadingState.style.display = "none";

    if (playlists.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    playlists.forEach((playlist) => {
      const col = document.createElement("div");
      col.className = "col-lg-3 col-md-4 col-sm-6 mb-4";
      col.innerHTML = `
        <div class="card playlist-card shadow-sm h-100">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="card-title text-white mb-0">${playlist.name}</h5>
              <i class="bi ${playlist.isPublic ? 'bi-globe text-success' : 'bi-lock text-warning'}"
                 title="${playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}"></i>
            </div>
            <p class="card-text text-white small flex-grow-1 mt-2">
              ${playlist.description || "No description"}
            </p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <a href="playlist-details.html?id=${playlist.id}&name=${encodeURIComponent(playlist.name)}" 
                 class="btn btn-sm btn-outline-success">
                <i class="bi bi-music-note-list"></i> View
              </a>
              <button class="btn btn-sm btn-outline-danger" 
                      data-id="${playlist.id}" 
                      data-name="${playlist.name}">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      playlistsContainer.appendChild(col);
    });

    attachDeleteEvents();
  } catch (err) {
    console.error(err);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
  }
}

// Attach delete button events
function attachDeleteEvents() {
  const deleteButtons = document.querySelectorAll(".btn-outline-danger");
  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPlaylistId = btn.dataset.id;
      deletePlaylistName.textContent = btn.dataset.name;
      deleteModal.show();
    });
  });
}

// Confirm delete
confirmDeleteBtn.addEventListener("click", async () => {
  if (!selectedPlaylistId) return;

  try {
    const res = await fetch(`${API_BASE}/playlist/${selectedPlaylistId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to delete playlist");

    deleteModal.hide();
    showToast("Playlist deleted successfully!", "success");
    fetchPlaylists();
  } catch (err) {
    console.error("Delete error:", err);
    showToast("Error deleting playlist", "error");
  }
});

// Refresh button
refreshBtn.addEventListener("click", fetchPlaylists);
