const API_BASE = "https://kaatar.onrender.com/api/v1/songs";

const songsContainer = document.getElementById("songsContainer");
const resultsTitle = document.getElementById("resultsTitle");
const loadingState = document.getElementById("loadingState");
const noResults = document.getElementById("noResults");

const params = new URLSearchParams(window.location.search);
const genre = params.get("genre");

let isLoggedIn = false;
let allSongs = [];

// --- Check login by fetching user profile ---
async function checkLogin() {
  try {
    const res = await fetch("https://kaatar.onrender.com/api/v1/user/profile", { credentials: "include" });
    isLoggedIn = res.ok;
  } catch {
    isLoggedIn = false;
  }
}

// --- Escape HTML ---
function sanitizeHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

// --- Helper to format artist ---
function getArtistName(song) {
  let artist = song.artist;

  // Case 1: If artist is a JSON string (like '["adadsd"]')
  if (typeof artist === "string") {
    try {
      const parsed = JSON.parse(artist);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return parsed; // in case it's just a normal string inside JSON
    } catch (e) {
      // Not valid JSON, return raw string
      return artist;
    }
  }

  // Case 2: If artist is already an array
  if (Array.isArray(artist) && artist.length > 0) {
    return artist.map(a => String(a)).join(", ");
  }

  // Case 3: If artist is already a plain string
  if (typeof artist === "string" && artist) {
    return artist;
  }

  // Fallback
  return "Unknown Artist";
}

// --- Fetch songs by genre ---
async function fetchSongsByGenre(genre) {
  try {
    loadingState.style.display = "block";
    noResults.style.display = "none";
    songsContainer.innerHTML = "";

    const response = await fetch(`${API_BASE}/genre/${encodeURIComponent(genre)}`, { credentials: "include" });
    const data = await response.json();

    loadingState.style.display = "none";

    if (!response.ok || data.length === 0) {
      noResults.style.display = "block";
      return;
    }

    allSongs = data || [];
    renderSongs(allSongs, `Genre: ${genre}`);
  } catch (error) {
    console.error("Error fetching songs by genre:", error);
    loadingState.style.display = "none";
    noResults.style.display = "block";
  }
}

// --- Render Songs (with like + playlist) ---
function renderSongs(songs, title) {
  resultsTitle.textContent = title;

  if (!songs.length) {
    noResults.style.display = "block";
    songsContainer.innerHTML = "";
    return;
  }
  noResults.style.display = "none";

  songsContainer.innerHTML = songs.map(song => {
    const artist = getArtistName(song);
    const isLiked = song.likedByUser;

    return `
      <div class="song-card card mb-3" data-song-id="${song.id}">
        <div class="row g-0 align-items-center">
          <div class="col-auto position-relative">
            <img src="${song.coverImageUrl || 'https://via.placeholder.com/200x200/333/fff?text=No+Cover'}" 
                 class="img-fluid song-cover" alt="${sanitizeHTML(song.title)}">
            <div class="play-overlay">
              <i class="bi bi-play-fill fs-2"></i>
            </div>
          </div>
          <div class="col">
            <div class="card-body py-2">
              <h5 class="card-title mb-1" title="${sanitizeHTML(song.title)}">${sanitizeHTML(song.title)}</h5>
              <p class="card-text mb-2" title="${sanitizeHTML(artist)}">${sanitizeHTML(artist)}</p>
              <div class="d-flex align-items-center justify-content-between">
                <button class="btn btn-sm like-btn ${isLiked ? 'liked' : ''}" 
                        data-song-id="${song.id}" title="${isLiked ? 'Unlike' : 'Like'}">
                  <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i> <span>${song.likesCount || 0}</span>
                </button>
                ${isLoggedIn ? `
                <div class="dropdown">
                  <button class="btn btn-sm btn-outline-secondary add-to-playlist-btn" 
                          type="button" data-bs-toggle="dropdown" aria-expanded="false" data-song-id="${song.id}"
                          title="Add to playlist">
                    <i class="bi bi-plus-circle-fill fs-5"></i>
                  </button>
                  <ul class="dropdown-menu playlist-dropdown">
                    <li><span class="dropdown-item">Loading...</span></li>
                  </ul>
                </div>` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }).join("");

  // Attach events
  document.querySelectorAll(".play-overlay").forEach(el => {
    el.addEventListener("click", () => {
      const songId = el.closest(".song-card").dataset.songId;
      playSong(songId);
    });
  });
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleLike(btn.dataset.songId, btn);
    });
  });
  document.querySelectorAll(".add-to-playlist-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const songId = btn.dataset.songId;
      const dropdown = btn.nextElementSibling;
      loadUserPlaylists(songId, dropdown);
    });
  });
}

// --- Actions ---
function playSong(songId) {
  window.location.href = `song.html?songId=${songId}`;
}

async function toggleLike(songId, btn) {
  if (!isLoggedIn) return alert("Login required to like songs");
  try {
    const isLiked = btn.classList.contains("liked");
    const res = await fetch(`${API_BASE}/${songId}/like`, {
      method: isLiked ? "DELETE" : "POST",
      credentials: "include"
    });
    const data = await res.json();

    btn.classList.toggle("liked", !isLiked);
    btn.querySelector("i").classList.toggle("bi-heart");
    btn.querySelector("i").classList.toggle("bi-heart-fill");
    btn.querySelector("span").textContent = data.data.likesCount;

    const songIndex = allSongs.findIndex(s => s.id == songId);
    if (songIndex !== -1) {
      allSongs[songIndex].likedByUser = !isLiked;
      allSongs[songIndex].likesCount = data.data.likesCount;
    }
  } catch (err) {
    console.error("Failed to toggle like", err);
  }
}

async function loadUserPlaylists(songId, dropdown) {
  if (!isLoggedIn) return;

  try {
    const res = await fetch("https://kaatar.onrender.com/api/v1/playlist/user", { credentials: "include" });
    const data = await res.json();
    const playlists = data.data || [];

    dropdown.innerHTML = "";
    if (!playlists.length) {
      dropdown.innerHTML = `<li><a class="dropdown-item" href="create-playlist.html">Create a playlist first</a></li>`;
      return;
    }

    playlists.forEach(pl => {
      const li = document.createElement("li");
      li.innerHTML = `<a class="dropdown-item" href="#">${sanitizeHTML(pl.name)}</a>`;
      li.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await addSongToPlaylist(songId, pl.id);
      });
      dropdown.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load user playlists", err);
    dropdown.innerHTML = `<li><span class="dropdown-item text-danger">Failed to load playlists</span></li>`;
  }
}

async function addSongToPlaylist(songId, playlistId) {
  try {
    const res = await fetch(`https://kaatar.onrender.com/api/v1/playlist/${playlistId}/songs/${songId}`, {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) {
      const errData = await res.json();
      alert(`Error: ${errData.message}`);
    } else {
      const data = await res.json();
      alert(data.message);
    }
  } catch (err) {
    console.error("Failed to add song to playlist", err);
    alert("An error occurred while adding the song.");
  }
}

// --- Init ---
(async function init() {
  await checkLogin();
  if (genre) {
    resultsTitle.textContent = `Genre: ${genre}`;
    await fetchSongsByGenre(genre);
  } else {
    resultsTitle.textContent = "No Genre Selected";
  }
})();
