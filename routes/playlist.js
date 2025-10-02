import express from "express";
import {
  createPlaylist,
  deletePlaylist,
  getUserPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist,
  getPlaylistSongs,
  getAllPublicPlaylists,
  getNextSong,
  getPrevSong,
  getPlaylistById,
} from "../controllers/playlist.js";

import { isAuthenticated } from "../middlewares/auth.js";


const router = express.Router();

// Create a new playlist
router.post("/", isAuthenticated, createPlaylist);

// Delete a playlist
router.delete("/:playlistId", isAuthenticated, deletePlaylist);

// Get all playlists of a user
router.get("/user", isAuthenticated, getUserPlaylists);

// Get all public playlists (from all users)
router.get("/public", getAllPublicPlaylists);

// Add a song to a playlist
router.post("/:playlistId/songs/:songId", isAuthenticated, addSongToPlaylist);

// Remove a song from a playlist
router.delete("/:playlistId/songs/:songId", isAuthenticated, removeSongFromPlaylist);

// Get all songs in a playlist
router.get("/:playlistId/songs", getPlaylistSongs);

// Get next song in a playlist
router.get("/:playlistId/songs/:songId/next", getNextSong);

// Get previous song in a playlist
router.get("/:playlistId/songs/:songId/prev", getPrevSong);

// Get a single playlist
router.get("/:playlistId", getPlaylistById);

export default router;
