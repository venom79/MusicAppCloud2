const API_BASE_SONG = "/api/v1/songs"; // update if different

// Variable to store the song ID to delete
let songToDelete = null;

// XHR upload helper with progress
function uploadWithProgress(url, formData, { withCredentials = false, onProgress = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = withCredentials; // mirrors fetch { credentials: "include" }

    // Upload progress events (request body)
    xhr.upload.addEventListener('progress', (e) => onProgress(e)); // e.loaded, e.total, e.lengthComputable
    xhr.upload.addEventListener('error', () => reject(new Error('Upload error')));
    xhr.upload.addEventListener('abort', () => reject(new Error('Upload aborted')));

    // Completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
      else reject(new Error('Failed to upload song'));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error')));

    xhr.open('POST', url, true);
    xhr.send(formData);
  });
}

// Function to fetch and display all songs
async function loadSongs() {
  const songsList = document.getElementById("songsList");
  songsList.innerHTML =
    '<div class="text-center p-4"><i class="bi bi-arrow-repeat fa-spin me-2"></i>Loading songs...</div>';

  try {
    const res = await fetch(API_BASE_SONG, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to fetch songs");
    const songs = await res.json();

    if (songs.length === 0) {
      songsList.innerHTML = `
        <div class="text-center p-5">
          <i class="bi bi-music-note-list text-muted" style="font-size: 3rem;"></i>
          <p class="text-muted mt-3">No songs available yet.</p>
          <small class="text-muted">Upload your first song using the form above.</small>
        </div>
      `;
      return;
    }

    songsList.innerHTML = "";
    songs.forEach((song) => {
      const songItem = document.createElement("div");
      songItem.classList.add(
        "songs-list-item",
        "d-flex",
        "justify-content-between",
        "align-items-center"
      );
      songItem.innerHTML = `
        <div class="song-info">
          <h6 class="mb-1">${song.title}</h6>
          <div class="song-artist">
            ${(() => {
              try {
                const artists = JSON.parse(song.artist); // parse JSON string
                return Array.isArray(artists) ? artists.join(", ") : artists;
              } catch (e) {
                return song.artist; // fallback if not JSON
              }
            })()}
          </div>
          ${song.album ? `<small class="text-muted">${song.album}</small>` : ""}
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-secondary">${song.genre || "Unknown"}</span>
          <button class="btn btn-danger btn-sm delete-song-btn" 
                  data-song-id="${song.id}"
                  data-song-title="${song.title}"
                  data-song-artist='${song.artist}'>
            <i class="bi bi-trash me-1"></i>Delete
          </button>
        </div>
      `;
      songsList.appendChild(songItem);
    });

    // Add event listeners to all delete buttons
    document.querySelectorAll('.delete-song-btn').forEach(button => {
      button.addEventListener('click', showDeleteModal);
    });

  } catch (err) {
    songsList.innerHTML = `
      <div class="text-center p-4">
        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
        <p class="text-danger mt-2">${err.message}</p>
        <button class="btn btn-outline-success btn-sm" onclick="loadSongs()">
          <i class="bi bi-arrow-clockwise me-1"></i>Retry
        </button>
      </div>
    `;
  }
}

// Function to show delete confirmation modal
function showDeleteModal(event) {
  const button = event.currentTarget;
  const songId = button.getAttribute('data-song-id');
  const songTitle = button.getAttribute('data-song-title');
  const songArtist = button.getAttribute('data-song-artist');

  // Store the song ID for deletion
  songToDelete = songId;

  // Update modal content
  document.getElementById('deleteSongTitle').textContent = songTitle;
  try {
    const artists = JSON.parse(songArtist);
    const artistText = Array.isArray(artists) ? artists.join(", ") : artists;
    document.getElementById('deleteSongArtist').textContent = `by ${artistText}`;
  } catch (e) {
    document.getElementById('deleteSongArtist').textContent = `by ${songArtist}`;
  }

  const deleteModal = new bootstrap.Modal(document.getElementById('deleteSongModal'));
  deleteModal.show();
}

// Function to delete a song
async function deleteSong(id) {
  try {
    const res = await fetch(`${API_BASE_SONG}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete song");

    const successAlert = document.createElement("div");
    successAlert.className = "alert alert-success alert-dismissible fade show";
    successAlert.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>Song deleted successfully
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector(".container").insertBefore(
      successAlert,
      document.querySelector(".container").firstChild
    );

    loadSongs();
  } catch (err) {
    const errorAlert = document.createElement("div");
    errorAlert.className = "alert alert-danger alert-dismissible fade show";
    errorAlert.innerHTML = `
      <i class="bi bi-exclamation-triangle me-2"></i>Error: ${err.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector(".container").insertBefore(
      errorAlert,
      document.querySelector(".container").firstChild
    );
  }
}

// Handle song upload
document.getElementById("songForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;

  // Progress UI elements (pre-rendered in HTML)
  const wrap  = document.getElementById('uploadProgressWrap');
  const bar   = document.getElementById('uploadProgressBar');
  const text  = document.getElementById('uploadProgressText');
  const bytes = document.getElementById('uploadProgressBytes');

  // Show loading state
  submitBtn.innerHTML = '<i class="bi bi-arrow-repeat fa-spin me-2"></i>Uploading...';
  submitBtn.disabled = true;

  // Unhide and reset progress UI BEFORE starting
  if (wrap) wrap.classList.remove('d-none');
  if (bar && text) {
    bar.classList.add('progress-bar-striped', 'progress-bar-animated');
    bar.style.width = '0%';
    bar.setAttribute('aria-valuenow', '0');
    bar.textContent = '0%';
    text.textContent = 'Uploading 0%';
    if (bytes) bytes.textContent = '';
  }

  try {
    await uploadWithProgress(API_BASE_SONG, formData, {
      withCredentials: true,
      onProgress: (e) => {
        if (!bar || !text) return;
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          bar.style.width = percent + '%';
          bar.setAttribute('aria-valuenow', String(percent));
          bar.textContent = percent + '%';
          text.textContent = 'Uploading ' + percent + '%';
          if (bytes) bytes.textContent = `${(e.loaded/1048576).toFixed(2)} MB of ${(e.total/1048576).toFixed(2)} MB`;
        } else {
          text.textContent = 'Uploading…';
        }
      }
    });

    // Complete and briefly show 100%
    if (bar && text) {
      bar.style.width = '100%';
      bar.setAttribute('aria-valuenow', '100');
      bar.textContent = '100%';
      text.textContent = 'Upload complete';
      if (bytes) bytes.textContent = '';
    }

    // Success message
    const successAlert = document.createElement("div");
    successAlert.className = "alert alert-success alert-dismissible fade show";
    successAlert.innerHTML = `
      <i class="bi bi-check-circle me-2"></i>Song uploaded successfully
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector(".container").insertBefore(
      successAlert,
      document.querySelector(".container").firstChild
    );

    e.target.reset();
    loadSongs();
  } catch (err) {
    const errorAlert = document.createElement("div");
    errorAlert.className = "alert alert-danger alert-dismissible fade show";
    errorAlert.innerHTML = `
      <i class="bi bi-exclamation-triangle me-2"></i>Error: ${err.message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector(".container").insertBefore(
      errorAlert,
      document.querySelector(".container").firstChild
    );
  } finally {
    // Hide and reset the progress UI
    setTimeout(() => {
      if (wrap) wrap.classList.add('d-none');
      if (bar && text) {
        bar.classList.remove('progress-bar-animated');
        bar.style.width = '0%';
        bar.setAttribute('aria-valuenow', '0');
        bar.textContent = '0%';
        text.textContent = 'Uploading 0%';
        if (bytes) bytes.textContent = '';
      }
    }, 700);

    // Restore button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

// Handle delete confirmation
document.addEventListener('DOMContentLoaded', function() {
  const confirmDeleteBtn = document.getElementById('confirmDeleteSong');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function() {
      if (songToDelete) {
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteSongModal'));
        deleteModal.hide();
        await deleteSong(songToDelete);
        songToDelete = null;
      }
    });
  }
});

// Initial load
loadSongs();
