import mongoose from "mongoose";

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: mongoose.Schema.Types.Mixed, // for JSON data
    required: true,
  },
  album: {
    type: String,
    required: false,
  },
  genre: {
    type: String,
    required: false,
  },
  releaseDate: {
    type: Date,
    required: false,
  },
  duration: {
    type: String, // "3:45" format
    required: false,
  },
  audioUrl: {
    type: String,
    required: true, // Cloudinary URL for the song file
  },
  audioPublicId: {
    type: String,
    required: true, // Cloudinary public_id for deletion
  },
  coverImageUrl: {
    type: String,
    required: false, // Cloudinary URL for artwork/thumbnail
  },
  coverPublicId: {
    type: String,
    required: false, // Cloudinary public_id for deletion
  },
  likesCount: {
    type: Number,
    required: true,
    default: 0, // stores total likes
  },
}, {
  timestamps: true,
});

const Song = mongoose.model("Song", songSchema);

export default Song;
