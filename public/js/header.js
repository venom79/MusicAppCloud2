// Base API URL
const API_BASE = "https://kaatar.onrender.com/api/v1"; // adjust if deployed

// Load header HTML and insert into page
async function loadHeaderHTML() {
    const headerContainer = document.getElementById("header-placeholder");
    if (!headerContainer) return;

    const response = await fetch("header.html");
    const html = await response.text();
    headerContainer.innerHTML = html;

    setActiveSidebarLink(); // highlight active link after header loads
}

// Highlight the current page link in the sidebar
function setActiveSidebarLink() {
    const currentPath = window.location.pathname.split("/").pop(); // e.g., 'profile.html'
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (linkPath === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

// Load user info and update profile section
async function loadProfile() {
    const profileSection = document.querySelector(".profile-section");
    if (!profileSection) return;

    try {
        const res = await fetch(`${API_BASE}/user/profile`, {
            credentials: "include",
        });

        if (!res.ok) throw new Error("Not logged in");

        const user = await res.json();
        const firstLetter = user.username.charAt(0).toUpperCase();

        profileSection.innerHTML = `
            <div class="dropdown">
                <button class="btn profile-btn dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <span class="profile-circle me-2">${firstLetter}</span>
                    <span class="d-none d-md-inline">${user.username}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end custom-dropdown">
                    <li><a class="dropdown-item" href="profile.html"><i class="bi bi-person me-2"></i>Profile</a></li>
                    <li><a class="dropdown-item logout-btn" href="#"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;

        // Attach logout listener
        const logoutButton = profileSection.querySelector(".logout-btn");
        if (logoutButton) {
            logoutButton.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await fetch(`${API_BASE}/user/logout`, {
                        method: "POST",
                        credentials: "include",
                    });
                    window.location.href = "login.html";
                } catch (err) {
                    console.error("Logout failed", err);
                }
            });
        }
    } catch (err) {
        profileSection.innerHTML = `
            <a href="login.html" class="btn btn-outline-success me-2">Login</a>
            <a href="register.html" class="btn btn-success">Register</a>
        `;
    }
}

// Load header and profile when page loads
document.addEventListener("DOMContentLoaded", async () => {
    await loadHeaderHTML();
    await loadProfile();
});
