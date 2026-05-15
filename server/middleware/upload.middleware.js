const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { isExternalStorageConfigured } = require("../storage");

function storageFor(kind) {
  const dir = path.join(__dirname, "..", "uploads", kind);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-z0-9_.-]/gi, "-");
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`);
    }
  });
}

const mediaUpload = multer({
  storage: isExternalStorageConfigured() ? multer.memoryStorage() : storageFor("images"),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/|^video\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported media type"));
  }
});

const avatarUpload = multer({
  storage: isExternalStorageConfigured() ? multer.memoryStorage() : storageFor("avatars"),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported avatar type"))
});

module.exports = { mediaUpload, avatarUpload };
