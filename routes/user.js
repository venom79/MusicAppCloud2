import express from 'express';
import { getProfile, login, logout, register } from '../controllers/user.js';
import {isAuthenticated} from "../middlewares/auth.js"

const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.get("/profile",isAuthenticated, getProfile);
router.post("/logout",isAuthenticated, logout);

export default router