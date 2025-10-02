const API_BASE = "/api/v1";

const songsContainer = document.getElementById("songsContainer");
const resultsTitle = document.getElementById("resultsTitle");
const loadingState = document.getElementById("loadingState");
const noResults = document.getElementById("noResults");

const toggleSongsBtn = document.getElementById("toggleSongs");
const togglePlaylistsBtn = document.getElementById("togglePlaylists");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearch");

let allSongs = [];
let allPlaylists = [];
let showing = "songs"; // default
let isLoggedIn = false;

// --- Check login by fetching user profile ---
async function checkLogin() {
    try {
        const res = await fetch(`${API_BASE}/user/profile`, { credentials: "include" });
        isLoggedIn = res.ok;
    } catch {
        isLoggedIn = false;
    }
}

// --- Escape HTML ---
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// --- (FIXED) Helper to get formatted artist name ---
function getArtistName(song) {
    // 1. Check if the song and artist field exist and are a valid array.
    if (song && Array.isArray(song.artist) && song.artist.length > 0) {
        // 2. If it's a valid array, join the names into a single string.
        return song.artist.join(", ");
    }
    
    // 3. If it's not an array but a string, return it directly.
    if (song && typeof song.artist === 'string' && song.artist) {
        return song.artist;
    }

    // 4. Fallback for any other case (null, empty array, etc.).
    return "Unknown Artist";
}


// --- Load Songs ---
async function loadSongs() {
    try {
        loadingState.style.display = "block";
        noResults.style.display = "none";

        const res = await fetch(`${API_BASE}/songs/`, { credentials: "include" });
        const data = await res.json();
        allSongs = data || [];

        console.log(allSongs);
        if (showing === "songs") renderSongs(allSongs);
    } catch (err) {
        console.error("Error fetching songs:", err);
        songsContainer.innerHTML = `<p class="text-danger">Failed to load songs.</p>`;
    } finally {
        loadingState.style.display = "none";
    }
}

// --- Load Public Playlists ---
async function loadPlaylists() {
    try {
        loadingState.style.display = "block";
        noResults.style.display = "none";

        const res = await fetch(`${API_BASE}/playlist/public`);
        const data = await res.json();
        allPlaylists = data.data || [];

        if (showing === "playlists") renderPlaylists(allPlaylists);
    } catch (err) {
        console.error("Error fetching playlists:", err);
        songsContainer.innerHTML = `<p class="text-danger">Failed to load playlists.</p>`;
    } finally {
        loadingState.style.display = "none";
    }
}

// --- Render Songs ---
function renderSongs(songs, title = "All Songs") {
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
                            </div>` : ''}
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

// --- Render Playlists ---
function renderPlaylists(playlists, title = "Public Playlists") {
    resultsTitle.textContent = title;

    if (!playlists.length) {
        noResults.style.display = "block";
        songsContainer.innerHTML = "";
        return;
    }
    noResults.style.display = "none";

    songsContainer.innerHTML = playlists.map(pl => `
        <div class="card playlist-card shadow-sm h-100" data-playlist-id="${pl.id}">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title text-white">${sanitizeHTML(pl.name)}</h5>
                <p class="card-text text-white small flex-grow-1">${sanitizeHTML(pl.description || "No description")}</p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <a href="playlist-details.html?id=${pl.id}&name=${encodeURIComponent(pl.name)}" 
                       class="btn btn-sm btn-outline-success">
                        <i class="bi bi-music-note-list"></i> View
                    </a>
                </div>
            </div>
        </div>
    `).join("");

    document.querySelectorAll(".playlist-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest('a')) return;
            const playlistId = card.dataset.playlistId;
            viewPlaylist(playlistId);
        });
    });
}

// --- Event Listeners ---
toggleSongsBtn.addEventListener("click", () => {
    showing = "songs";
    renderSongs(allSongs);
    toggleSongsBtn.classList.add("active");
    togglePlaylistsBtn.classList.remove("active");
});

togglePlaylistsBtn.addEventListener("click", () => {
    showing = "playlists";
    renderPlaylists(allPlaylists);
    togglePlaylistsBtn.classList.add("active");
    toggleSongsBtn.classList.remove("active");
});

// --- Search Input Event Listener ---
searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    clearSearchBtn.style.display = query ? "inline" : "none";

    if (showing === "songs") {
        const filtered = allSongs.filter(s => {
            const artist = getArtistName(s).toLowerCase();
            const title = (s.title || '').toLowerCase(); // Ensure title is not null
            return title.includes(query) || artist.includes(query);
        });
        renderSongs(filtered, query ? "Search Results" : "All Songs");
    } else {
        const filtered = allPlaylists.filter(p =>
            (p.name && p.name.toLowerCase().includes(query)) ||
            (p.description && p.description.toLowerCase().includes(query))
        );
        renderPlaylists(filtered, query ? "Search Results" : "Public Playlists");
    }
});

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    if (showing === "songs") renderSongs(allSongs);
    else renderPlaylists(allPlaylists);
});

// --- Actions ---
function playSong(songId) {
    window.location.href = `song.html?songId=${songId}`;
}

async function toggleLike(songId, btn) {
    if (!isLoggedIn) return alert("Login required to like songs");
    try {
        const isLiked = btn.classList.contains("liked");
        const res = await fetch(`${API_BASE}/songs/${songId}/like`, {
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

function viewPlaylist(playlistId) {
    window.location.href = `playlist.html?playlistId=${playlistId}`;
}

async function loadUserPlaylists(songId, dropdown) {
    if (!isLoggedIn) return;

    try {
        const res = await fetch(`${API_BASE}/playlist/user`, { credentials: "include" });
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
        const res = await fetch(`${API_BASE}/playlist/${playlistId}/songs/${songId}`, {
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

// --- Initial Load ---
(async function init() {
    await checkLogin();
    await loadSongs();
    await loadPlaylists();
})();