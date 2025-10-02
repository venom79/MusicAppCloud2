const API_BASE = "/api/v1";

const songsContainer = document.getElementById("songsContainer");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const playlistTitle = document.getElementById("playlistTitle");
const playlistPlayBtn = document.getElementById("playlistPlayBtn");

// Get playlist ID and name from URL
const urlParams = new URLSearchParams(window.location.search);
const playlistId = urlParams.get("id");
const playlistName = urlParams.get("name");

let currentUserId = null;
let playlistOwnerId = null;

if (!playlistId) {
  playlistTitle.textContent = "Playlist Not Found";
  emptyState.style.display = "block";
} else {
  fetchCurrentUserAndPlaylist(playlistId);
}

async function fetchCurrentUserAndPlaylist(id) {
  try {
    // Try to fetch current user profile (if logged in)
    const profileRes = await fetch(`${API_BASE}/user/profile`, {
      method: "GET",
      credentials: "include",
    });

    if (profileRes.ok) {
      const profileData = await profileRes.json();
      currentUserId = profileData.id;
      currentUserId = currentUserId ? currentUserId.toString() : null;
    } else {
      currentUserId = null;
    }
  } catch (error) {
    currentUserId = null;
  }

  try {
    // Fetch playlist details with new endpoint (includes userId)
    const playlistRes = await fetch(`${API_BASE}/playlist/${id}`, {
      method: "GET",
      credentials: "include",
    });

    if (!playlistRes.ok) throw new Error("Failed to fetch playlist details");
    const playlistData = await playlistRes.json();

    playlistTitle.textContent = playlistName || "Playlist Songs";

    playlistOwnerId = (playlistData.data.userId || playlistData.data.userId) ?? null;
    playlistOwnerId = playlistOwnerId ? playlistOwnerId.toString() : null;

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

    // Show playlist play button for first song
    const firstSongId = data.data[0].id;
    playlistPlayBtn.style.display = "flex";
    playlistPlayBtn.onclick = () => {
      window.location.href = `song.html?songId=${firstSongId}&playlistId=${playlistId}`;
    };

    // Render songs with conditional Remove button
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

      const showRemove =
        currentUserId &&
        playlistOwnerId &&
        currentUserId === playlistOwnerId;

      li.innerHTML = `
        <div class="d-flex justify-content-between align-items-center w-100">
          <div class="song-info">
            <strong>${song.title}</strong>
            <small>${artistNames || "Unknown Artist"}</small>
          </div>
          <div class="d-flex align-items-center">
            <button class="play-btn me-2" title="Play">
              <i class="bi bi-play-fill"></i>
            </button>
            ${
              showRemove
                ? `<button class="remove-btn btn btn-danger btn-sm" title="Remove">
                    <i class="bi bi-trash"></i>
                  </button>`
                : ""
            }
          </div>
        </div>
      `;

      const playBtn = li.querySelector(".play-btn");
      playBtn.addEventListener("click", () => {
        window.location.href = `song.html?songId=${song.id}&playlistId=${playlistId}`;
      });

      if (showRemove) {
        const removeBtn = li.querySelector(".remove-btn");
        if (removeBtn) {
          removeBtn.addEventListener("click", async () => {
            if (!confirm("Remove this song from the playlist?")) return;
            try {
              const resp = await fetch(
                `${API_BASE}/playlist/${playlistId}/songs/${song.id}`,
                {
                  method: "DELETE",
                  credentials: "include",
                }
              );
              if (!resp.ok) throw new Error("Failed to remove song");
              li.remove();

              if (songsContainer.children.length === 0) {
                songsContainer.style.display = "none";
                emptyState.style.display = "block";
              }
            } catch (err) {
              alert("Failed to remove song.");
            }
          });
        }
      }

      songsContainer.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    loadingState.style.display = "none";
    emptyState.style.display = "block";
    emptyState.innerHTML = `<p class="text-danger">Error loading songs. Please try again later.</p>`;
  }
}
