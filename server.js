import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./db.js";

dotenv.config(); //loading environment variables

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}/`);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

startServer();
