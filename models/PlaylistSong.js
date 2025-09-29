import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const PlaylistSong = sequelize.define("PlaylistSong", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
});

export default PlaylistSong;
