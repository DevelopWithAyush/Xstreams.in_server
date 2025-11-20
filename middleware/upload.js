import multer from "multer";

// Multer setup for file storage
const storage = multer.memoryStorage(); // Store files in memory for Cloudinary

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // Max file size: 25MB
  }
});

