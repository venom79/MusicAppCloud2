import User from "./User.js";
import Song from "./Song.js";
import Playlist from "./Playlist.js";
import PlaylistSong from "./PlaylistSong.js";
import LikedSong from "./LikedSong.js";

// User ↔ Playlist (1-to-Many)
User.hasMany(Playlist, { foreignKey: "userId", onDelete: "CASCADE" });
Playlist.belongsTo(User, { foreignKey: "userId" });

// Playlist ↔ Song (Many-to-Many)
Playlist.belongsToMany(Song, { 
  through: PlaylistSong, 
  foreignKey: "playlistId", 
  otherKey: "songId" 
});
Song.belongsToMany(Playlist, { 
  through: PlaylistSong, 
  foreignKey: "songId", 
  otherKey: "playlistId" 
});

// User ↔ Song (Liked Songs, Many-to-Many)
User.belongsToMany(Song, { 
  through: LikedSong, 
  foreignKey: "userId", 
  otherKey: "songId", 
  as: "LikedSongs" 
});
Song.belongsToMany(User, { 
  through: LikedSong, 
  foreignKey: "songId", 
  otherKey: "userId", 
  as: "Likers" 
});

export { User, Song, Playlist, PlaylistSong, LikedSong };
