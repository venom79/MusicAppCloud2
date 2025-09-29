const API_BASE = "https://kaatar.onrender.com/api/v1/user"; // relative path since same server

// Login API call
export async function login(email, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include" // ensures cookie is saved
    });
    return res.json();
}

// Register API call
export async function register(name, email, password) {
    const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include"
    });
    return res.json();
}

// Logout
export function logout() {
    fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" })
        .finally(() => window.location.href = "login.html");
}
