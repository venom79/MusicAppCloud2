import mongoose from "mongoose";

const likedSongSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  songId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true,
  },
}, {
  timestamps: true,
});

// Create compound index to prevent duplicate likes
likedSongSchema.index({ userId: 1, songId: 1 }, { unique: true });

const LikedSong = mongoose.model("LikedSong", likedSongSchema);

export default LikedSong;
