const API_BASE = "https://kaatar.onrender.com/api/v1";

const songsContainer = document.getElementById("songsContainer");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const playlistTitle = document.getElementById("playlistTitle");
const playlistPlayBtn = document.getElementById("playlistPlayBtn");

// Get playlist ID and name from URL
const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get("id");
const playlistName = urlParams.get("name");

if (!playlistId) {
  playlistTitle.textContent = "Playlist Not Found";
  emptyState.style.display = "block";
} else {
  fetchPlaylistDetails(playlistId);
}

async function fetchPlaylistDetails(id) {
  try {
    const playlistRes = await fetch(`${API_BASE}/playlist/${id}/songs`, {
      method: "GET",
      credentials: "include",
    });

    if (!playlistRes.ok) throw new Error("Failed to fetch playlist details");

    const playlistData = await playlistRes.json();
    playlistTitle.textContent = playlistName || "Playlist Songs";

    fetchPlaylistSongs(id);
  } catch (error) {
    console.error(error);
    playlistTitle.textContent = "Playlist Not Found";
    emptyState.style.display = "block";
  }
}

async function fetchPlaylistSongs(id) {
  loadingState.style.display = "block";
  songsContainer.style.display = "none";
  emptyState.style.display = "none";

  try {
    const res = await fetch(`${API_BASE}/playlist/${id}/songs`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch playlist songs");

    const data = await res.json();

    loadingState.style.display = "none";

    if (!data.data || data.data.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    songsContainer.style.display = "block";
    songsContainer.innerHTML = "";

    // Show playlist play button for the first song
    const firstSongId = data.data[0].id;
    playlistPlayBtn.style.display = "flex";
    playlistPlayBtn.onclick = () => {
      window.location.href = `song.html?songId=${firstSongId}&playlistId=${playlistId}`;
    };

    // Render all songs
    data.data.forEach((song) => {
        const li = document.createElement("li");
        li.className = "list-group-item";

        let artistNames;
        try {
            artistNames = Array.isArray(song.artist)
            ? song.artist.join(", ")
            : JSON.parse(song.artist).join(", ");
        } catch {
            artistNames = song.artist;
        }

        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-center w-100">
            <div class="song-info">
                <strong>${song.title}</strong>
                <small>${artistNames || "Unknown Artist"}</small>
            </div>
            <button class="play-btn" title="Play">
                <i class="bi bi-play-fill"></i>
            </button>
            </div>
        `;

        const playBtn = li.querySelector(".play-btn");
        playBtn.addEventListener("click", () => {
            window.location.href = `song.html?songId=${song.id}&playlistId=${playlistId}`;
        });

        songsContainer.appendChild(li);
    });

  } catch (error) {
    console.error(error);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = `<p class="text-danger">Error loading songs. Please try again later.</p>`;
  }
}
