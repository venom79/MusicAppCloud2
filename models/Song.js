import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Song = sequelize.define("Song", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  artist: {
    type: DataTypes.JSON, 
    allowNull: false,
  },

  album: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  genre: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  releaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },

  duration: {
    type: DataTypes.STRING, // example: "3:45" OR keep as INTEGER (seconds)
    allowNull: true,
  },

  audioUrl: {
    type: DataTypes.STRING,
    allowNull: false, // Cloudinary URL for the song file
  },

  audioPublicId: {
    type: DataTypes.STRING,
    allowNull: false, // Cloudinary public_id for deletion
  },

  coverImageUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Cloudinary URL for artwork/thumbnail
  },

  coverPublicId: {
    type: DataTypes.STRING,
    allowNull: true, // Cloudinary public_id for deletion
  },
  
  likesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0, // stores total likes
  },
});

export default Song;
