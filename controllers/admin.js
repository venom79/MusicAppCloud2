import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// Admin register
export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin registered", admin: newAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error registering admin", error: error.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, { httpOnly: true }).json({
      message: "Login successful",
      admin: { id: admin.id, username: admin.username, email: admin.email, role: "admin" },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get logged in admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: ["id", "username", "email", "role"], // include role
    });

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin profile", error: error.message });
  }
};


// Logout
export const logoutAdmin = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out successfully" });
};
