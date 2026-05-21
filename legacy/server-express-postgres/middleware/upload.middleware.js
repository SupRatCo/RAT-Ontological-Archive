const multer = require("multer");
const { badRequest } = require("../utils/errors");

const imageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const videoTypes = new Set(["video/mp4", "video/webm", "video/ogg"]);
const allowedTypes = new Set([...imageTypes, ...videoTypes]);

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 50);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024
  },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      return callback(badRequest("Tipo de archivo no permitido."));
    }
    callback(null, true);
  }
});

function mediaTypeFromMime(mimeType) {
  if (imageTypes.has(mimeType)) return "image";
  if (videoTypes.has(mimeType)) return "video";
  return "file";
}

module.exports = {
  upload,
  mediaTypeFromMime,
  allowedTypes,
  maxUploadMb
};
