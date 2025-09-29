// Base API URL
const API_BASE = "https://kaatar.onrender.com/api/v1"; // change this if deployed

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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 10);

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}


// Fetch public playlists
async function loadPlaylists() {
    try {
        const res = await fetch(`${API_BASE}/playlist/public`);
        if (!res.ok) throw new Error("Failed to fetch playlists");

        const playlists = await res.json();
        renderPlaylists(playlists.data);
    } catch (error) {
        console.error(error);
        document.getElementById("playlistsContainer").innerHTML = `
            <p class="text-danger">Unable to load playlists. Please try again later.</p>
        `;
    }
}

// Render playlists dynamically
function renderPlaylists(playlists) {
    const container = document.getElementById("playlistsContainer");
    container.innerHTML = "";

    if (!playlists || playlists.length === 0) {
        container.innerHTML = `<p class="text-white">No playlists available.</p>`;
        return;
    }

    playlists.forEach(p => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4 col-xl-3 mb-4";

        // encodeURIComponent for playlist name in URL
        const playlistUrl = `playlist-details.html?id=${p.id}&name=${encodeURIComponent(p.name)}`;

        col.innerHTML = `
            <div class="playlist-card h-100">
                <h5>${p.name}</h5>
                <p>${p.description || "No description available."}</p>
                <div class="text-end">
                    <a href="${playlistUrl}" class="btn btn-success btn-sm">
                        <i class="bi bi-play-circle me-1"></i> Play
                    </a>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// Handle playlist click
function viewPlaylist(id) {
    window.location.href = `playlist.html?id=${id}`;
}

// Load playlists on page load
document.addEventListener("DOMContentLoaded", async () => {
    // Check if a toast message was passed from login/register
    const toastMessage = localStorage.getItem("toastMessage");
    if (toastMessage) {
        showToast(toastMessage);   // Use the same showToast function
        localStorage.removeItem("toastMessage");
    }

    await loadPlaylists();

    await loadPlaylists();
});


