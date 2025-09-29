import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const LikedSong = sequelize.define("LikedSong", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  songId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

export default LikedSong;
