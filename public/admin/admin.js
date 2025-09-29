// ../js/admin.js
const API_BASE = "http://localhost:8080/api/v1/admin";

// Fetch admin profile if logged in
async function fetchAdminProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      credentials: "include", // include cookies
    });

    if (!res.ok) {
      // Not logged in → redirect
      window.location.href = "../admin/login.html";
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching admin profile:", err);
    window.location.href = "../admin/login.html";
    return null;
  }
}

// Logout function
async function logoutAdmin() {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      window.location.href = "../admin/login.html"; // redirect after logout
    }
  } catch (err) {
    console.error("Error logging out:", err);
  }
}

// On page load
document.addEventListener("DOMContentLoaded", async () => {
  const profile = await fetchAdminProfile();
  if (!profile) return; // already redirected if not logged in

  // Update profile section
  const profileBtn = document.querySelector(".profile-btn span.d-none.d-md-inline");
  if (profileBtn) {
    profileBtn.textContent = profile.username;
  }

  // Attach logout event
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutAdmin();
    });
  }
});
