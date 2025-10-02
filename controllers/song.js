import cloudinary from "../config/cloudinary.js";
import Song from "../models/Song.js";
import User from "../models/User.js";
import LikedSong from "../models/LikedSong.js";
import mongoose from "mongoose";

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

    // Convert to plain object and add id field
    const songResponse = song.toObject();
    songResponse.id = song._id.toString();

    res.status(201).json({ message: "Song uploaded successfully", song: songResponse });
  } catch (error) {
    console.error("Error uploading song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all songs
export const getSongs = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : undefined;
    // Use aggregation pipeline to calculate likesCount and likedByUser
    const songs = await Song.aggregate([
      {
        $lookup: {
          from: "likedsongs",
          localField: "_id",
          foreignField: "songId",
          as: "likes"
        }
      },
      {
        $addFields: {
          id: { $toString: "$_id" }, // Add id field as string
          likesCount: { $size: "$likes" },
          likedByUser: userId ? {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.userId"]
          } : false
        }
      },
      {
        $project: {
          likes: 0 // remove the likes array from output
        }
      }
    ]);

    // normalize fields
    const formatted = songs.map((song) => ({
      ...song,
      likedByUser: Boolean(song.likedByUser),
      artist: Array.isArray(song.artist) ? song.artist : 
              (typeof song.artist === 'string' ? JSON.parse(song.artist) : song.artist)
    }));

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

    const songAggregation = await Song.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "likedsongs",
          localField: "_id",
          foreignField: "songId",
          as: "likes"
        }
      },
      {
        $addFields: {
          id: { $toString: "$_id" }, // Add id field as string
          likesCount: { $size: "$likes" },
          likedByUser: userId ? {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.userId"]
          } : false
        }
      },
      {
        $project: {
          likes: 0
        }
      }
    ]);

    if (!songAggregation || songAggregation.length === 0) {
      return res.status(404).json({ message: "Song not found" });
    }

    const song = songAggregation[0];
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
    const song = await Song.findById(id);

    if (!song) return res.status(404).json({ message: "Song not found" });

    if (song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: "video" });
    }
    if (song.coverPublicId) {
      await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: "image" });
    }

    await Song.findByIdAndDelete(id);
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

    const song = await Song.findById(songId);

    if (!song) return res.status(404).json({ message: "Song not found" });

    const alreadyLiked = await LikedSong.findOne({ userId, songId });
    if (alreadyLiked) return res.status(400).json({ message: "Song already liked" });

    // Create liked song entry
    await LikedSong.create({ userId, songId });
    
    // Increment likes count
    song.likesCount += 1;
    await song.save();

    res.json({ 
      message: "Song liked successfully", 
      data: { 
        songId: song._id.toString(), 
        id: song._id.toString(), // Add id field
        likesCount: song.likesCount 
      } 
    });
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

    const song = await Song.findById(songId);

    if (!song) return res.status(404).json({ message: "Song not found" });

    const likedEntry = await LikedSong.findOne({ userId, songId });
    if (!likedEntry) return res.status(400).json({ message: "Song not liked yet" });

    // Delete liked song entry
    await LikedSong.deleteOne({ userId, songId });
    
    // Decrement likes count
    if (song.likesCount > 0) song.likesCount -= 1;
    await song.save();

    res.json({ 
      message: "Song unliked successfully", 
      data: { 
        songId: song._id.toString(), 
        id: song._id.toString(), // Add id field
        likesCount: song.likesCount 
      } 
    });
  } catch (error) {
    console.error("Error unliking song:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all liked songs of logged-in user
export const getUserLikedSongs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const likedSongs = await LikedSong.find({ userId }).populate('songId');

    // Extract songs and add id field
    const songs = likedSongs.map(liked => {
      const song = liked.songId.toObject();
      song.id = song._id.toString();
      return song;
    });

    res.json({ message: "success", data: songs });
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
    const songs = await Song.find({ genre }).lean(); // Use .lean() for better performance

    if (!songs || songs.length === 0) {
      return res.status(404).json({ message: `No songs found for genre: ${genre}` });
    }

    // Add id field to each song
    const songsWithId = songs.map(song => ({
      ...song,
      id: song._id.toString()
    }));

    res.status(200).json(songsWithId);
  } catch (error) {
    console.error("Error fetching songs by genre:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
