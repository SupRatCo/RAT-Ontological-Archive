const path = require("path");
const fs = require("fs/promises");

const provider = (process.env.STORAGE_PROVIDER || (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local")).toLowerCase();
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "";

function isExternalStorageConfigured() {
  return provider === "supabase" && supabaseUrl && supabaseKey && bucket;
}

function safeSegment(value) {
  return String(value || "file").replace(/[^a-z0-9_.-]/gi, "-");
}

function buildKey(folder, fileName) {
  return `${safeSegment(folder)}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeSegment(fileName)}`;
}

function publicUrl(key) {
  if (!isExternalStorageConfigured()) return "";
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function uploadSupabase(buffer, key, mimeType) {
  const url = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": mimeType || "application/octet-stream",
      "x-upsert": "true"
    },
    body: buffer
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase Storage upload failed: ${response.status} ${text}`);
  }
  return {
    provider: "supabase",
    key,
    publicUrl: publicUrl(key)
  };
}

async function uploadFile(file, folder) {
  if (!isExternalStorageConfigured()) {
    return {
      provider: "local",
      key: file.filename || path.basename(file.path || ""),
      publicUrl: "",
      localPath: file.path || ""
    };
  }
  if (!file || !file.buffer) throw new Error("External storage requires memory upload buffer.");
  const key = buildKey(folder, file.originalname || file.filename || "upload.bin");
  return uploadSupabase(file.buffer, key, file.mimetype);
}

async function deleteSupabase(key) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prefixes: [key] })
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Supabase Storage delete failed: ${response.status} ${text}`);
  }
}

async function deleteFile(record) {
  if (!record) return;
  if (record.storage_provider === "supabase" && record.storage_key && isExternalStorageConfigured()) {
    await deleteSupabase(record.storage_key);
    return;
  }
  if (record.file_path && record.file_path.startsWith("/uploads/")) {
    const localPath = path.join(__dirname, record.file_path.replace(/^\/uploads\//, "uploads/"));
    await fs.unlink(localPath).catch(() => {});
  }
}

module.exports = {
  provider,
  isExternalStorageConfigured,
  uploadFile,
  deleteFile,
  getPublicUrl: publicUrl
};
