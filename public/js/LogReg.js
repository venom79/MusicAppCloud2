import { login, register } from "./auth.js"; // corrected import

const isLoginPage = window.location.pathname.includes("login.html");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById(isLoginPage ? "loginForm" : "registerForm");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Toggle password visibility
  togglePassword?.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.innerHTML =
      type === "password"
        ? '<i class="bi bi-eye"></i>'
        : '<i class="bi bi-eye-slash"></i>';
  });

  // Handle form submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = passwordInput.value.trim();

    clearAlerts();

    try {
      const data = isLoginPage
        ? await login(email, password)
        : await register(name, email, password);

      // ✅ Success
      showSuccess(data.message || "Success");
      window.location.href = "index.html";
    } catch (error) {
      console.error("Auth error:", error);
      showError(error.message);
    }
  });
});

// Utility: show error message in page
function showError(msg) {
  const errorBox = document.createElement("div");
  errorBox.className = "alert alert-danger mt-3";
  errorBox.innerText = msg;
  document.querySelector(".auth-form").appendChild(errorBox);
}

// Utility: show success message in page
function showSuccess(msg) {
  const successBox = document.createElement("div");
  successBox.className = "alert alert-success mt-3";
  successBox.innerText = msg;
  document.querySelector(".auth-form").appendChild(successBox);
}

// Remove previous alerts
function clearAlerts() {
  document.querySelectorAll(".auth-form .alert").forEach((el) => el.remove());
}
