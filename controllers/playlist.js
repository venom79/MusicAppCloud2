import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";
import mongoose from "mongoose";

// Create a new playlist
export const createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user.id; //comes from JWT middleware

    if (!name) {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({ name, description, isPublic, userId });

    // Add id field
    const playlistResponse = playlist.toObject();
    playlistResponse.id = playlist._id.toString();

    res.status(201).json({
      message: "success",
      data: playlistResponse,
    });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a playlist
export const deletePlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const userId = req.user.id;

    // Validate playlistId
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    //check ownership - convert ObjectId to string for comparison
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot delete this playlist" });
    }

    await Playlist.findByIdAndDelete(playlistId);

    res.json({
      message: "success",
      data: { deleted: true, playlistId },
    });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all playlists of a user (both public & private)
export const getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user.id;
    const playlists = await Playlist.find({ userId }).lean();

    // Add id field to each playlist
    const playlistsWithId = playlists.map(playlist => ({
      ...playlist,
      id: playlist._id.toString()
    }));

    res.json({ message: "success", data: playlistsWithId });
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all public playlists (from all users)
export const getAllPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ isPublic: true }).lean();

    // Add id field to each playlist
    const playlistsWithId = playlists.map(playlist => ({
      ...playlist,
      id: playlist._id.toString()
    }));

    res.json({ message: "success", data: playlistsWithId });
  } catch (error) {
    console.error("Error fetching public playlists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add a song to a playlist
export const addSongToPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }
    if (!songId || songId === 'undefined' || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }

    const playlist = await Playlist.findById(playlistId);
    const song = await Song.findById(songId);

    if (!playlist || !song) {
      return res.status(404).json({ message: "Playlist or song not found" });
    }

    // check ownership
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot modify this playlist" });
    }

    // Check if song already exists in playlist
    if (playlist.songs.some(id => id.toString() === songId)) {
      return res.status(400).json({ message: "Song already in playlist" });
    }

    // Add song to playlist using $push
    await Playlist.findByIdAndUpdate(
      playlistId,
      { $push: { songs: songId } },
      { new: true }
    );

    res.json({
      message: "success",
      data: { playlistId, songId, added: true },
    });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a song from a playlist
export const removeSongFromPlaylist = async (req, res) => {
  try {
    const { playlistId, songId } = req.params;
    const userId = req.user.id;

    // Validate IDs
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }
    if (!songId || songId === 'undefined' || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }

    const playlist = await Playlist.findById(playlistId);
    const song = await Song.findById(songId);

    if (!playlist || !song) {
      return res.status(404).json({ message: "Playlist or song not found" });
    }

    // check ownership
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot modify this playlist" });
    }

    // Remove song from playlist using $pull
    await Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { songs: songId } },
      { new: true }
    );

    res.json({
      message: "success",
      data: { playlistId, songId, removed: true },
    });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all songs in a playlist
export const getPlaylistSongs = async (req, res) => {
  try {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }

    const playlist = await Playlist.findById(playlistId).populate('songs').lean();

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    // Add id field to each song
    const songsWithId = playlist.songs.map(song => ({
      ...song,
      id: song._id.toString()
    }));

    res.json({
      message: "success",
      data: songsWithId,
    });
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get next song in a playlist (looping)
export const getNextSong = async (req, res) => {
  const { playlistId, songId } = req.params;
  try {
    // Validate IDs
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }
    if (!songId || songId === 'undefined' || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }

    const playlist = await Playlist.findById(playlistId).populate('songs');

    if (!playlist || playlist.songs.length === 0) {
      return res.status(404).json({ message: "No songs in playlist" });
    }

    let index = playlist.songs.findIndex(s => s._id.toString() === songId);
    if (index === -1) index = 0; // fallback if song not found

    const nextIndex = (index + 1) % playlist.songs.length; // loop
    const nextSong = playlist.songs[nextIndex].toObject();
    nextSong.id = nextSong._id.toString();

    res.status(200).json(nextSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get previous song in a playlist (looping)
export const getPrevSong = async (req, res) => {
  const { playlistId, songId } = req.params;
  try {
    // Validate IDs
    if (!playlistId || playlistId === 'undefined' || !mongoose.Types.ObjectId.isValid(playlistId)) {
      return res.status(400).json({ message: "Invalid playlist ID" });
    }
    if (!songId || songId === 'undefined' || !mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: "Invalid song ID" });
    }

    const playlist = await Playlist.findById(playlistId).populate('songs');

    if (!playlist || playlist.songs.length === 0) {
      return res.status(404).json({ message: "No songs in playlist" });
    }

    let index = playlist.songs.findIndex(s => s._id.toString() === songId);
    if (index === -1) index = 0;

    const prevIndex = (index - 1 + playlist.songs.length) % playlist.songs.length; // loop
    const prevSong = playlist.songs[prevIndex].toObject();
    prevSong.id = prevSong._id.toString();

    res.status(200).json(prevSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
