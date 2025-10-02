import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const username = process.env.MONGODB_USERNAME;
const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
const cluster = process.env.MONGODB_CLUSTER;
const database = process.env.MONGODB_DATABASE;

const mongoURI = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
