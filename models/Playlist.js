import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Playlist = sequelize.define("Playlist", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // false = private, true = public
  },
});

export default Playlist;
