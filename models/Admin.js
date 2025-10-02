import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "admin", // always admin
  },
}, {
  timestamps: true, // automatically adds createdAt and updatedAt fields
});

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
