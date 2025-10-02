import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  isPublic: {
    type: Boolean,
    default: false, // false = private, true = public
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
  }],
}, {
  timestamps: true,
});

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
