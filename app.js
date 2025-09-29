import express from "express";
import cookieParser from "cookie-parser";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/user.js";
import songRouter from "./routes/song.js";
import playlistRouter from "./routes/playlist.js";
import adminRoutes from "./routes/admin.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(cookieParser());
// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/songs", songRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/admin", adminRoutes);

export default app;
