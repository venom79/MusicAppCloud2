import express from "express";
import { addSong, getSongs, getSongById, deleteSong, getUserLikedSongs, unlikeSong, likeSong, getSongsByGenre } from "../controllers/song.js";
import { upload } from "../middlewares/upload.js";
import { isAuthenticated, optionalAuth, verifyAdmin } from "../middlewares/auth.js";

const router = express.Router();

// Routes

// Add a song (upload audio + optional cover image)
router.post(
  "/",
  isAuthenticated,
  verifyAdmin,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  addSong
);

router.get("/", optionalAuth, getSongs);//get all songs
router.get("/:id", optionalAuth, getSongById);  //get a selected song
router.delete("/:id", isAuthenticated, verifyAdmin, deleteSong);//delete a selected song

// Like a song
router.post("/:id/like", isAuthenticated, likeSong);

// Unlike a song
router.delete("/:id/like", isAuthenticated, unlikeSong);

// Get all liked songs of the logged-in user
router.get("/liked/me", isAuthenticated, getUserLikedSongs);

// Get songs by genre
router.get("/genre/:genre", optionalAuth, getSongsByGenre);
export default router;
