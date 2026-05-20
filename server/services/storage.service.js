const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { badRequest } = require("../utils/errors");
const { mediaTypeFromMime, allowedTypes, maxUploadMb } = require("../middleware/upload.middleware");

const provider = process.env.STORAGE_PROVIDER || "supabase";

function requireSupabaseConfig() {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"].filter((key) => !process.env[key]);
  if (missing.length) {
    const error = new Error(`Faltan variables de Supabase Storage: ${missing.join(", ")}`);
    error.statusCode = 503;
    error.missing = missing;
    throw error;
  }
}

function getSupabase() {
  requireSupabaseConfig();
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function validateFile(file) {
  if (!file) throw badRequest("No se recibió ningún archivo.");
  if (!allowedTypes.has(file.mimetype)) throw badRequest("Tipo de archivo no permitido.");
  if (file.size > maxUploadMb * 1024 * 1024) throw badRequest("El archivo supera el tamaño permitido.");
}

function safeExtension(filename = "", mimeType = "") {
  const original = path.extname(filename).toLowerCase();
  if (original && original.length <= 8) return original;
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/ogg") return ".ogg";
  return "";
}

async function uploadFile(file, options = {}) {
  validateFile(file);
  const supabase = getSupabase();
  const mediaType = options.mediaType || mediaTypeFromMime(file.mimetype);
  const prefix = options.prefix || mediaType;
  const storageKey = `${prefix}/${options.userId || "system"}/${Date.now()}-${cryptoRandom()}${safeExtension(file.originalname, file.mimetype)}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET)
    .upload(storageKey, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) {
    const uploadError = new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`);
    uploadError.statusCode = 502;
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(storageKey);

  return {
    storage_provider: provider,
    storage_key: storageKey,
    public_url: data.publicUrl,
    mime_type: file.mimetype,
    media_type: mediaType,
    size: file.size
  };
}

async function deleteFile(storageKey) {
  requireSupabaseConfig();
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_STORAGE_BUCKET)
    .remove([storageKey]);
  if (error) {
    const deleteError = new Error(`No se pudo borrar el archivo de Supabase Storage: ${error.message}`);
    deleteError.statusCode = 502;
    throw deleteError;
  }
  return { deleted: true };
}

function isConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_STORAGE_BUCKET);
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2, 12);
}

module.exports = {
  uploadFile,
  deleteFile,
  isConfigured,
  provider
};
