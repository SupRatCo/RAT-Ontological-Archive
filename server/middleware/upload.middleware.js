const path = require("path");
const multer = require("multer");

function storageFor(kind) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(__dirname, "..", "uploads", kind)),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-z0-9_.-]/gi, "-");
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${safe}`);
    }
  });
}

const mediaUpload = multer({
  storage: storageFor("images"),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/|^video\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported media type"));
  }
});

const avatarUpload = multer({
  storage: storageFor("avatars"),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported avatar type"))
});

module.exports = { mediaUpload, avatarUpload };
