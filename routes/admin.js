import express from "express";
import { registerAdmin, loginAdmin, getAdminProfile, logoutAdmin } from "../controllers/admin.js";
import { isAuthenticated, verifyAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Admin auth routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/profile", isAuthenticated, verifyAdmin, getAdminProfile);
router.post("/logout", isAuthenticated, verifyAdmin, logoutAdmin);

export default router;
