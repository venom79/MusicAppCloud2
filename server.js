import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}/`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

startServer();
