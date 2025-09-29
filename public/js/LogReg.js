import { login, register } from "./auth.js";

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
      type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
  });

  // Handle form submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const password = passwordInput.value.trim();

    try {
      const data = isLoginPage
        ? await login(email, password)
        : await register(name, email, password);

      if (!data || data.message?.includes("error")) {
        // Save error message for toast
        localStorage.setItem("toastMessage", data.message || "Something went wrong");
        localStorage.setItem("toastType", "error");
        return;
      }

      // Save success message for toast
      localStorage.setItem("toastMessage", data.message);
      localStorage.setItem("toastType", "success");

      // Redirect immediately
      window.location.href = "index.html";
    } catch (error) {
      console.error(error);
      localStorage.setItem("toastMessage", "Something went wrong. Please try again later.");
      localStorage.setItem("toastType", "error");
    }
  });
});
