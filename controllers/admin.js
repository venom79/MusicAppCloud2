import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const JWT_SECRET = process.env.JWT_SECRET;

// Admin register
export const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      username,
      email,
      password: hashedPassword,
    });

    // Exclude password from response
    const adminResponse = newAdmin.toObject();
    delete adminResponse.password;
    adminResponse.id = adminResponse._id.toString();

    res.status(201).json({ message: "Admin registered", admin: adminResponse });
  } catch (error) {
    res.status(500).json({ message: "Error registering admin", error: error.message });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Convert ObjectId to string for JWT
    const token = jwt.sign(
      { id: admin._id.toString(), email: admin.email, role: "admin" }, 
      JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.cookie("token", token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/"
    }).json({
      message: "Login successful",
      admin: { 
        id: admin._id.toString(), 
        username: admin.username, 
        email: admin.email, 
        role: "admin" 
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get logged in admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("username email role");

    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const adminResponse = admin.toObject();
    adminResponse.id = adminResponse._id.toString();

    res.json(adminResponse);
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Error fetching admin profile", error: error.message });
  }
};

// Logout
export const logoutAdmin = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/"
  }).json({ message: "Logged out successfully" });
};
