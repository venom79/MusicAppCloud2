import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;


// Generate JWT
const generateToken = (userId) => {
  // IMPORTANT: Convert ObjectId to string
  const token = jwt.sign({ id: userId.toString() }, JWT_SECRET, { expiresIn: "1d" });
  return token;
};

// REGISTER
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;


    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      username: name,
      email,
      password: hashedPassword,
    });


    // auto-login: set JWT in cookie
    const token = generateToken(user._id);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/", // Add this
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .status(201)
      .json({
        message: "User registered and logged in successfully",
        user: { 
          id: user._id.toString(), 
          name: user.username, 
          email: user.email 
        },
      });

  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }


    const token = generateToken(user._id);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/", // Add this
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: { 
          id: user._id.toString(), 
          name: user.username, 
          email: user.email 
        },
      });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    
    const { id } = req.user;
    
    const user = await User.findById(id).select("username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    // Add id field
    const userResponse = user.toObject();
    userResponse.id = userResponse._id.toString();

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout controller
export const logout = async (req, res) => {
  try {
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", // IMPORTANT: Must match the cookie path
    });


    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
