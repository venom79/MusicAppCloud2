const API_BASE = "/api/v1/user";

// Login API call
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include", // ensures cookie is saved
  });

  const data = await res.json();
  if (!res.ok) {
    // throw so UI can handle it
    throw new Error(data.message || "Login failed");
  }
  return data;
}

// Register API call
export async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Registration failed");
  }
  return data;
}

// Logout
export function logout() {
  fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" })
    .finally(() => (window.location.href = "login.html"));
}
