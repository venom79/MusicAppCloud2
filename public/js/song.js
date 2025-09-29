// ./js/song.js
const API_BASE = "http://localhost:8080/api/v1";


// --- Utilities ---
function qs(id) { return document.getElementById(id); }
function el(html) { const div = document.createElement("div"); div.innerHTML = html.trim(); return div.firstChild; }
function safeParseArtist(a) {
  // artist sometimes stored as JSON string like '["name"]' or plain string
  try {
    const parsed = JSON.parse(a);
    if (Array.isArray(parsed)) return parsed.join(", ");
    return String(parsed);
  } catch (e) {
    return a || "";
  }
}
function formatTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Enhanced toast function with better UI
function showToast(message) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.custom-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create better toast notification
  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #343a40;
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
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}


// --- DOM references ---
const songCover = qs("songCover");
const songTitle = qs("songTitle");
const songArtist = qs("songArtist");
const audioPlayer = qs("audioPlayer");
const playPauseBtn = qs("playPauseBtn");
const likeBtn = qs("likeBtn");
const likesCountElem = qs("likesCount");
const prevBtn = qs("prevBtn");
const nextBtn = qs("nextBtn");
const progressBar = qs("progressBar");
const currentTimeElem = qs("currentTime");
const totalTimeElem = qs("totalTime");
const progressFill = qs("progressFill"); // optional visual fill
const addToPlaylistBtn = document.querySelector(".add-to-playlist-btn"); // button toggling dropdown
const playlistDropdown = document.querySelector(".playlist-dropdown");


// state
const urlParams = new URLSearchParams(window.location.search);
let songId = urlParams.get("songId");
let isPlaying = false;
let isLiked = false;
let rotation = 0;
let rotateInterval = null;
let allSongs = []; // used for prev/next navigation
let currentSongIndex = -1;


// --- Helpers for UI updates ---
function setPlayIcon(playing) {
  playPauseBtn.innerHTML = playing ? '<i class="bi bi-pause-fill"></i>' : '<i class="bi bi-play-fill"></i>';
}

// Enhanced like icon function with better styling
function setLikeIcon(liked) {
  const icon = likeBtn.querySelector('i') || document.createElement('i');
  
  if (liked) {
    // Liked state: filled red heart
    icon.className = 'bi bi-heart-fill';
    icon.style.color = '#dc3545'; // Explicit red color
    likeBtn.classList.add('liked');
  } else {
    // Unliked state: empty heart
    icon.className = 'bi bi-heart';
    icon.style.color = '#6c757d'; // Gray color
    likeBtn.classList.remove('liked');
  }
  
  // Ensure the icon is in the button
  if (!likeBtn.contains(icon)) {
    likeBtn.innerHTML = '';
    likeBtn.appendChild(icon);
  }
}

function startCoverRotation() {
  stopCoverRotation();
  rotateInterval = setInterval(() => {
    rotation = (rotation + 0.25) % 360;
    songCover.style.transform = `rotate(${rotation}deg)`;
  }, 20);
}
function stopCoverRotation() {
  clearInterval(rotateInterval);
  rotateInterval = null;
}


// update the progress fill (behind the range)
function updateProgressFill(value) {
  if (!progressFill) return;
  // value is 0..100
  progressFill.style.width = `${value}%`;
}

// --- Authentication check helper ---
async function checkAuthentication() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      credentials: "include"
    });
    return res.ok;
  } catch (err) {
    console.error("Auth check failed:", err);
    return false;
  }
}


// --- Enhanced fetch & render song ---
async function fetchSong(id) {
  if (!id) return;
  try {
    const res = await fetch(`${API_BASE}/songs/${id}`, { credentials: "include" });
    if (!res.ok) throw new Error(`Failed to fetch song (status ${res.status})`);
    const song = await res.json();


    // Server might wrap or return object directly - handle both
    const data = song?.data ?? song;


    // Render
    songId = String(data.id);
    songTitle.textContent = data.title || "Unknown Title";
    songArtist.textContent = safeParseArtist(data.artist || "");
    songCover.src = data.coverImageUrl || data.cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";
    audioPlayer.src = data.audioUrl || data.audio || data.audioPublicId || "";


    // Enhanced like state handling
    isLiked = Boolean(data.likedByUser);
    setLikeIcon(isLiked);


    // Enhanced likes count handling with multiple possible field names
    const likesCount = data.likesCount ?? data.likes ?? data.totalLikes ?? 0;
    likesCountElem.textContent = likesCount;


    // reset times and progress
    currentTimeElem.textContent = "0:00";
    totalTimeElem.textContent = "0:00";
    progressBar.value = 0;
    updateProgressFill(0);


    // find index in allSongs if loaded
    if (allSongs.length) {
      currentSongIndex = allSongs.findIndex(s => String(s.id) === String(songId));
    }


    // preload metadata
    // audio will fire loadedmetadata and set total time
  } catch (err) {
    console.error("Error fetching song:", err);
    songTitle.textContent = "Song not found";
    songArtist.textContent = "";
    audioPlayer.removeAttribute("src");
    // Reset like state on error
    isLiked = false;
    setLikeIcon(false);
    likesCountElem.textContent = "0";
  }
}


// --- Playlist population & add-to-playlist action ---
async function loadUserPlaylists() {
  try {
    const res = await fetch(`${API_BASE}/playlist/user`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load playlists");
    const json = await res.json();
    const data = json?.data ?? json;


    // clear
    playlistDropdown.innerHTML = "";


    if (!data || !data.length) {
      playlistDropdown.innerHTML = `<li><span class="dropdown-item">No playlists</span></li>`;
      return;
    }


    data.forEach(pl => {
      const li = document.createElement("li");
      const a = document.createElement("button");
      a.type = "button";
      a.className = "dropdown-item playlist-item";
      a.dataset.playlistId = pl.id;
      a.textContent = pl.name || `Playlist ${pl.id}`;
      li.appendChild(a);
      playlistDropdown.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    playlistDropdown.innerHTML = `<li><span class="dropdown-item">Failed to load</span></li>`;
  }
}


// Add song to playlist
async function addSongToPlaylist(playlistId, songIdToAdd) {
  try {
    const res = await fetch(`${API_BASE}/playlist/${playlistId}/songs/${songIdToAdd}`, {
      method: "POST",
      credentials: "include"
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to add to playlist: ${res.status} ${text}`);
    }
    const json = await res.json();
    showToast("Added to playlist");
    // close dropdown programmatically (Bootstrap)
    const dropdown = bootstrap.Dropdown.getInstance(addToPlaylistBtn);
    if (dropdown) dropdown.hide();
  } catch (err) {
    console.error(err);
    showToast("Failed to add to playlist");
  }
}


// --- Enhanced Like / Unlike handling ---
async function toggleLike() {
  if (!songId) {
    showToast("No song selected");
    return;
  }

  // Check if user is authenticated first
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    showToast("Please log in to like songs");
    return;
  }

  // Prevent rapid clicking
  if (likeBtn.disabled) return;
  likeBtn.disabled = true;

  try {
    const method = isLiked ? "DELETE" : "POST";
    const res = await fetch(`${API_BASE}/songs/${songId}/like`, {
      method,
      credentials: "include"
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        showToast("Please log in to like songs");
        return;
      }
      throw new Error(`Like API failed: ${res.status}`);
    }

    const result = await res.json();

    // Update local state
    isLiked = !isLiked;
    setLikeIcon(isLiked);

    // Enhanced count update - check multiple possible response structures
    let newCount = null;
    if (result?.data?.likesCount !== undefined) {
      newCount = result.data.likesCount;
    } else if (result?.likesCount !== undefined) {
      newCount = result.likesCount;
    } else if (result?.data?.likes !== undefined) {
      newCount = result.data.likes;
    } else if (result?.likes !== undefined) {
      newCount = result.likes;
    }

    if (newCount !== null) {
      likesCountElem.textContent = newCount;
    } else {
      // Fallback: manual count adjustment
      let count = parseInt(likesCountElem.textContent) || 0;
      likesCountElem.textContent = Math.max(0, isLiked ? count + 1 : count - 1);
    }

    // Show success feedback
    showToast(isLiked ? "Song liked!" : "Song unliked");

  } catch (err) {
    console.error("Error toggling like:", err);
    showToast("Failed to update like status. Please try again.");
  } finally {
    // Re-enable button after a short delay to prevent spam
    setTimeout(() => {
      likeBtn.disabled = false;
    }, 500);
  }
}



// --- Prev / Next navigation (uses all songs) ---
async function loadAllSongsIfEmpty() {
  if (allSongs && allSongs.length) return;
  try {
    const res = await fetch(`${API_BASE}/songs/`, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch songs list");
    const json = await res.json();
    const arr = json?.data ?? json;
    allSongs = Array.isArray(arr) ? arr : [];
    // set currentSongIndex
    currentSongIndex = allSongs.findIndex(s => String(s.id) === String(songId));
  } catch (err) {
    console.error(err);
    allSongs = [];
  }
}
const playlistId = urlParams.get("playlistId");

async function goNext() {
  if (!songId) return;

  try {
    let nextId;

    if (playlistId) {
      // call playlist next API
      const res = await fetch(`${API_BASE}/playlist/${playlistId}/songs/${songId}/next`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get next song");
      const nextSong = await res.json();
      nextId = nextSong.id;
    } else {
      // fallback to allSongs
      await loadAllSongsIfEmpty();
      if (!allSongs.length) return;
      if (currentSongIndex < 0) currentSongIndex = allSongs.findIndex(s => String(s.id) === String(songId));
      const nextIndex = (currentSongIndex + 1) % allSongs.length;
      nextId = allSongs[nextIndex].id;
    }

    // Update URL without reloading
    const newUrl = `${window.location.pathname}?songId=${nextId}${playlistId ? `&playlistId=${playlistId}` : ""}`;
    history.replaceState(null, "", newUrl);

    // Fetch and play next song
    await fetchSong(nextId);
    audioPlayer.play();
  } catch (err) {
    console.error(err);
    showToast("Could not go to next song");
  }
}

async function goPrev() {
  if (!songId) return;

  try {
    let prevId;

    if (playlistId) {
      // call playlist prev API
      const res = await fetch(`${API_BASE}/playlist/${playlistId}/songs/${songId}/prev`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get previous song");
      const prevSong = await res.json();
      prevId = prevSong.id;
    } else {
      // fallback to allSongs
      await loadAllSongsIfEmpty();
      if (!allSongs.length) return;
      if (currentSongIndex < 0) currentSongIndex = allSongs.findIndex(s => String(s.id) === String(songId));
      const prevIndex = (currentSongIndex - 1 + allSongs.length) % allSongs.length;
      prevId = allSongs[prevIndex].id;
    }

    // Update URL without reloading
    const newUrl = `${window.location.pathname}?songId=${prevId}${playlistId ? `&playlistId=${playlistId}` : ""}`;
    history.replaceState(null, "", newUrl);

    // Fetch and play previous song
    await fetchSong(prevId);
    audioPlayer.play();
  } catch (err) {
    console.error(err);
    showToast("Could not go to previous song");
  }
}

// --- Audio events (progress, seeking, metadata) ---
audioPlayer.addEventListener("loadedmetadata", () => {
  const duration = audioPlayer.duration || 0;
  totalTimeElem.textContent = formatTime(duration);
  // if audio has a duration, ensure progress bar step is set to 0..100
  // nothing else needed here
});


audioPlayer.addEventListener("timeupdate", () => {
  const current = audioPlayer.currentTime || 0;
  const duration = audioPlayer.duration || 0;
  const percent = (duration > 0) ? (current / duration) * 100 : 0;
  progressBar.value = percent;
  updateProgressFill(percent);
  currentTimeElem.textContent = formatTime(current);
  // totalTimeElem updated on metadata
});


let isSeeking = false;
progressBar.addEventListener("input", (e) => {
  // while dragging, show time preview
  const percent = parseFloat(e.target.value);
  const duration = audioPlayer.duration || 0;
  const time = (percent / 100) * duration;
  currentTimeElem.textContent = formatTime(time);
  updateProgressFill(percent);
});
progressBar.addEventListener("change", (e) => {
  // when user releases, set audio time
  const percent = parseFloat(e.target.value);
  const duration = audioPlayer.duration || 0;
  audioPlayer.currentTime = (percent / 100) * duration;
});


// clicking on progress bar area (for some browsers) - allow seeking by click
progressBar.addEventListener("mousedown", () => { isSeeking = true; });
document.addEventListener("mouseup", () => { if (isSeeking) isSeeking = false; });


// Play / Pause button
playPauseBtn.addEventListener("click", () => {
  if (!audioPlayer.src) return;
  if (audioPlayer.paused) {
    audioPlayer.play();
  } else {
    audioPlayer.pause();
  }
});
audioPlayer.addEventListener("play", () => {
  isPlaying = true;
  setPlayIcon(true);
  startCoverRotation();
});
audioPlayer.addEventListener("pause", () => {
  isPlaying = false;
  setPlayIcon(false);
  stopCoverRotation();
});
audioPlayer.addEventListener("ended", () => {
  // auto-next
  goNext();
});


// Like button
likeBtn.addEventListener("click", toggleLike);


// Prev / Next buttons
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);


// Load playlists when dropdown is shown (so fresh)
if (addToPlaylistBtn && playlistDropdown) {
  addToPlaylistBtn.addEventListener("click", async () => {
    // initialize Bootstrap dropdown if not already
    if (!bootstrap.Dropdown.getInstance(addToPlaylistBtn)) {
      new bootstrap.Dropdown(addToPlaylistBtn);
    }
    await loadUserPlaylists();
  });


  // delegate playlist click
  playlistDropdown.addEventListener("click", (e) => {
    const target = e.target.closest(".playlist-item");
    if (!target) return;
    const playlistId = target.dataset.playlistId;
    if (!playlistId) return;
    if (!songId) {
      showToast("No song selected");
      return;
    }
    addSongToPlaylist(playlistId, songId);
  });
}


// --- Initialization: load songs list (for prev/next) and the requested song ---
(async function init() {
  const likedSongsParam = urlParams.get("likedSongs") === "true";

  if (likedSongsParam) {
    // Fetch liked songs if likedSongs=true in URL
    try {
      const res = await fetch(`${API_BASE}/songs/liked/me`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        const arr = json?.data ?? json;
        allSongs = Array.isArray(arr) ? arr : [];
      }
    } catch (err) {
      console.warn("Could not fetch liked songs:", err);
      allSongs = [];
    }
  } else {
    // Fallback: fetch all songs
    try {
      const res = await fetch(`${API_BASE}/songs/`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        const arr = json?.data ?? json;
        allSongs = Array.isArray(arr) ? arr : [];
      }
    } catch (err) {
      console.warn("Could not prefetch all songs:", err);
      allSongs = [];
    }
  }

  // Set current song index
  if (songId && allSongs.length) {
    currentSongIndex = allSongs.findIndex(s => String(s.id) === String(songId));
  }

  // Fetch and render requested song
  if (songId) {
    await fetchSong(songId);
  } else if (allSongs.length) {
    songId = allSongs[0].id;
    currentSongIndex = 0;
    await fetchSong(songId);
  } else {
    songTitle.textContent = "No song selected";
    songArtist.textContent = "";
  }
})();