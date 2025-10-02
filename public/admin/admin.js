// admin.js
const API_BASE = "http://localhost:8080/api/v1/admin";

async function fetchAdminProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      window.location.href = "../admin/login.html";
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error fetching admin profile:", err);
    window.location.href = "../admin/login.html";
    return null;
  }
}

async function logoutAdmin() {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      window.location.href = "../admin/login.html";
    }
  } catch (err) {
    console.error("Error logging out:", err);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await fetchAdminProfile();
  if (!profile) return;

  const profileBtn = document.querySelector(".profile-btn span.d-none.d-md-inline");
  if (profileBtn) {
    profileBtn.textContent = profile.username;
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutAdmin();
    });
  }
});
