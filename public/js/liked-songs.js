const API_BASE = "https://kaatar.onrender.com/api/v1";

const usernameEl = document.getElementById("username");
const songCountEl = document.getElementById("songCount");
const songsListContainer = document.getElementById("songsListContainer");
const loadingState = document.getElementById("songsLoadingState");
const emptyState = document.getElementById("emptyState");
const playFirstBtn = document.getElementById("playFirstBtn"); // hero section play button

let likedSongs = []; // store liked songs globally

// Fetch user profile
async function fetchUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch profile");
    const user = await res.json();
    usernameEl.textContent = user.username;
  } catch {
    usernameEl.textContent = "Unknown User";
  }
}

// Helper to redirect to song.html
function redirectToSong(songId) {
  // Pass songId and likedSongs=true to indicate we are in liked songs context
  const queryParams = new URLSearchParams({
    songId,
    likedSongs: true
  });
  window.location.href = `song.html?${queryParams.toString()}`;
}

// Fetch liked songs
async function fetchLikedSongs() {
  loadingState.style.display = "block";
  songsListContainer.style.display = "none";
  emptyState.style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/songs/liked/me`, { credentials: "include" });

    if (res.status === 401) {
      // Unauthorized → user not logged in
      loadingState.style.display = "none";
      emptyState.style.display = "block";
      emptyState.innerHTML = `
        <i class="bi bi-heart" style="font-size: 4rem; color: var(--text-muted);"></i>
        <h4 class="mt-3 text-muted">Login required</h4>
        <p class="text-muted">Login to see your liked songs</p>
        <a href="login.html" class="btn btn-success">Login</a>
      `;
      return;
    }

    if (!res.ok) throw new Error("Failed to fetch liked songs");

    const data = await res.json();
    likedSongs = data.data || [];
    loadingState.style.display = "none";

    if (!likedSongs.length) {
      emptyState.style.display = "block";
      songCountEl.textContent = "0 songs";
      return;
    }

    songsListContainer.style.display = "block";
    songsListContainer.innerHTML = "";
    songCountEl.textContent = `${likedSongs.length} songs`;

    likedSongs.forEach((song) => {
      let artists;
      try {
        artists = Array.isArray(song.artist)
          ? song.artist.join(", ")
          : JSON.parse(song.artist).join(", ");
      } catch {
        artists = song.artist || "Unknown Artist";
      }

      const songItem = document.createElement("div");
      songItem.className =
        "list-group-item d-flex justify-content-between align-items-center";

      songItem.innerHTML = `
        <div>
          <strong>${song.title}</strong><br>
          <small class="text-muted">${artists}</small>
        </div>
        <button class="btn btn-success btn-sm play-btn"><i class="bi bi-play-fill"></i></button>
      `;

      // Redirect to song.html when play button is clicked
      songItem.querySelector(".play-btn").addEventListener("click", () => {
        redirectToSong(song.id);
      });

      songsListContainer.appendChild(songItem);
    });

  } catch {
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = `<p class="text-danger">Error loading songs. Please try again later.</p>`;
  }
}

// Hero section round play button: play first liked song
playFirstBtn?.addEventListener("click", () => {
  if (!likedSongs.length) return;
  redirectToSong(likedSongs[0].id);
});

// Initialize
fetchUserProfile();
fetchLikedSongs();
