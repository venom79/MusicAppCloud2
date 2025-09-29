import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.mimetype.startsWith("audio/")) {
      return {
        folder: "musicApp/songs",
        resource_type: "auto",
      };
    }
    if (file.mimetype.startsWith("image/")) {
      return {
        folder: "musicApp/covers",
        resource_type: "image",
      };
    }
  },
});

export const upload = multer({ storage });