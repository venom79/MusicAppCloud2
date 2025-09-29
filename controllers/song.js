import cloudinary from "../config/cloudinary.js";
import sequelize from "../db.js";
import { Song, User, LikedSong } from "../models/associations.js";

// Add a new song
export const addSong = async (req, res) => {
  try {
    let { title, artist, album, genre, releaseDate } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: "Title and artist are required" });
    }

    // Ensure artist is always an array
    if (typeof artist === "string") {
      try {
        artist = JSON.parse(artist);
      } catch {
        artist = [artist];
      }
    }

    // Uploaded files
    const audioFile = req.files?.audio ? req.files.audio[0] : null;
    const coverFile = req.files?.cover ? req.files.cover[0] : null;

    if (!audioFile) return res.status(400).json({ message: "Audio file is required" });

    const audioUrl = audioFile.path;
    const audioPublicId = audioFile.filename;

    let coverUrl = null;
    let coverPublicId = null;
    if (coverFile) {
      coverUrl = coverFile.path;
      coverPublicId = coverFile.filename;
    }

    // Fetch duration from Cloudinary
    const audioMetadata = await cloudinary.api.resource(audioPublicId, { resource_type: "video" });

    let duration = null;
    if (audioMetadata.duration) {
      const totalSeconds = Math.floor(audioMetadata.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    // Create song
    const song = await Song.create({
      title,
      artist,
      album,
      genre,
      releaseDate,
      duration,
      audioUrl,
      audioPublicId,
      coverImageUrl: coverUrl,
      coverPublicId,
    });

    res.status(201).json({ message: "Song uploaded successfully", song });
  } catch (error) {
    console.error("Error uploading song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all songs
export const getSongs = async (req, res) => {
  try {
    const userId = req.user?req.user.id:undefined;

    console.log("Fetching songs for userId:", userId);


    const songs = await Song.findAll({
      attributes: {
        include: [
          // dynamic likes count
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM LikedSongs WHERE LikedSongs.songId = Song.id)`
            ),
            "likesCount",
          ],
          // whether THIS user liked it
          [
            sequelize.literal(
              userId
                ? `(EXISTS(SELECT 1 FROM LikedSongs WHERE LikedSongs.songId = Song.id AND LikedSongs.userId = ${userId}))`
                : "0"
            ),
            "likedByUser",
          ],
        ],
      },
    });

    // normalize fields
    const formatted = songs.map((song) => {
      const plain = song.toJSON();

      return {
        ...plain,
        likedByUser: Boolean(Number(plain.likedByUser)), // force true/false
        artist: (() => {
          try {
            return JSON.parse(plain.artist);
          } catch {
            return plain.artist;
          }
        })(),
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get song by ID
export const getSongById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const song = await Song.findByPk(id, {
      attributes: {
        include: [
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM LikedSongs WHERE LikedSongs.songId = Song.id)`
            ),
            "likesCount",
          ],
          [
            sequelize.literal(
              userId
                ? `(CASE WHEN EXISTS (SELECT 1 FROM LikedSongs WHERE LikedSongs.songId = Song.id AND LikedSongs.userId = ${userId}) THEN 1 ELSE 0 END)`
                : "0"
            ),
            "likedByUser",
          ],
        ],
      },
    });

    if (!song) return res.status(404).json({ message: "Song not found" });

    res.status(200).json(song);
  } catch (error) {
    console.error("Error fetching song:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Delete song
export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;
    const song = await Song.findByPk(id);

    if (!song) return res.status(404).json({ message: "Song not found" });

    if (song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: "video" });
    }
    if (song.coverPublicId) {
      await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: "image" });
    }

    await song.destroy();
    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    console.error("Error deleting song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Like a song
export const likeSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const songId = req.params.id;

    const song = await Song.findByPk(songId);
    const user = await User.findByPk(userId);

    if (!song) return res.status(404).json({ message: "Song not found" });

    const alreadyLiked = await LikedSong.findOne({ where: { userId, songId } });
    if (alreadyLiked) return res.status(400).json({ message: "Song already liked" });

    await user.addLikedSong(song);
    song.likesCount += 1;
    await song.save();

    res.json({ message: "Song liked successfully", data: { songId, likesCount: song.likesCount } });
  } catch (error) {
    console.error("Error liking song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unlike a song
export const unlikeSong = async (req, res) => {
  try {
    const userId = req.user.id;
    const songId = req.params.id;

    const song = await Song.findByPk(songId);
    const user = await User.findByPk(userId);

    if (!song) return res.status(404).json({ message: "Song not found" });

    const likedEntry = await LikedSong.findOne({ where: { userId, songId } });
    if (!likedEntry) return res.status(400).json({ message: "Song not liked yet" });

    await user.removeLikedSong(song);
    if (song.likesCount > 0) song.likesCount -= 1;
    await song.save();

    res.json({ message: "Song unliked successfully", data: { songId, likesCount: song.likesCount } });
  } catch (error) {
    console.error("Error unliking song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all liked songs of logged-in user
export const getUserLikedSongs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [{ model: Song, as: "LikedSongs" }],
    });

    res.json({ message: "success", data: user.LikedSongs });
  } catch (error) {
    console.error("Error fetching liked songs:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get songs by genre
export const getSongsByGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    // Validate genre
    const validGenres = ["Pop", "Rock", "Jazz", "Classical", "HipHop", "Electronic", "R&B", "Country"];
    if (!validGenres.includes(genre)) {
      return res.status(400).json({ message: "Invalid genre selected" });
    }

    // Fetch songs of that genre
    const songs = await Song.findAll({ where: { genre } });

    if (!songs || songs.length === 0) {
      return res.status(404).json({ message: `No songs found for genre: ${genre}` });
    }

    res.status(200).json(songs);
  } catch (error) {
    console.error("Error fetching songs by genre:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};