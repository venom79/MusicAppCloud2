import { Playlist, Song, PlaylistSong } from "../models/associations.js";

// Create a new playlist
export const createPlaylist = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const userId = req.user.id; //comes from JWT middleware

    if (!name) {
      return res.status(400).json({ message: "Playlist name is required" });
    }

    const playlist = await Playlist.create({ name, description, isPublic, userId });

    res.status(201).json({
      message: "success",
      data: playlist,
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
    const userId = req.user.id; // from JWT middleware

    const playlist = await Playlist.findByPk(playlistId);

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    //check ownership
    if (playlist.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot delete this playlist" });
    }

    await playlist.destroy();

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
    const playlists = await Playlist.findAll({ where: { userId } });

    res.json({ message: "success", data: playlists });
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all public playlists (from all users)
export const getAllPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.findAll({ where: { isPublic: true } });

    res.json({ message: "success", data: playlists });
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

    const playlist = await Playlist.findByPk(playlistId);
    const song = await Song.findByPk(songId);

    if (!playlist || !song) {
      return res.status(404).json({ message: "Playlist or song not found" });
    }

    // check ownership
    if (playlist.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot modify this playlist" });
    }

    await playlist.addSong(song);

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

    const playlist = await Playlist.findByPk(playlistId);
    const song = await Song.findByPk(songId);

    if (!playlist || !song) {
      return res.status(404).json({ message: "Playlist or song not found" });
    }

    // check ownership
    if (playlist.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot modify this playlist" });
    }

    await playlist.removeSong(song);

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

    const playlist = await Playlist.findByPk(playlistId, {
      include: [Song],
    });

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.json({
      message: "success",
      data: playlist.Songs,
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
    const playlistSongs = await PlaylistSong.findAll({
      where: { playlistId },
      order: [["id", "ASC"]],
    });

    if (playlistSongs.length === 0)
      return res.status(404).json({ message: "No songs in playlist" });

    let index = playlistSongs.findIndex(s => s.songId == songId);
    if (index === -1) index = 0; // fallback if song not found

    const nextIndex = (index + 1) % playlistSongs.length; // loop
    const nextSongId = playlistSongs[nextIndex].songId;
    const nextSong = await Song.findByPk(nextSongId);

    res.status(200).json(nextSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get previous song in a playlist (looping)
export const getPrevSong = async (req, res) => {
  const { playlistId, songId } = req.params;
  try {
    const playlistSongs = await PlaylistSong.findAll({
      where: { playlistId },
      order: [["id", "ASC"]],
    });

    if (playlistSongs.length === 0)
      return res.status(404).json({ message: "No songs in playlist" });

    let index = playlistSongs.findIndex(s => s.songId == songId);
    if (index === -1) index = 0;

    const prevIndex =
      (index - 1 + playlistSongs.length) % playlistSongs.length; // loop
    const prevSongId = playlistSongs[prevIndex].songId;
    const prevSong = await Song.findByPk(prevSongId);

    res.status(200).json(prevSong);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};