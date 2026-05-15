const express = require("express");
const path = require("path");
const { run, all, get } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectReader, requireProjectEditor } = require("../middleware/permissions.middleware");
const { mediaUpload } = require("../middleware/upload.middleware");
const storage = require("../storage");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

function out(row) {
  const publicUrl = row.public_url || row.file_path;
  return {
    id: row.id,
    projectId: row.project_id,
    uploadedBy: row.uploaded_by,
    filePath: publicUrl,
    src: publicUrl,
    data: publicUrl,
    kind: row.type,
    type: row.type,
    mimeType: row.mime_type,
    name: row.title,
    title: row.title,
    description: row.description,
    metadata: JSON.parse(row.metadata_json || "{}"),
    storageProvider: row.storage_provider || "local",
    storageKey: row.storage_key || "",
    publicUrl,
    size: Number(row.size || 0),
    uploadedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/project/:projectId", requireAuth, requireProjectReader("projectId"), async (req, res, next) => {
  try {
    const rows = await all("SELECT * FROM media WHERE project_id = ? ORDER BY created_at DESC", [req.params.projectId]);
    res.json({ media: rows.map(out) });
  } catch (error) { next(error); }
});

router.post("/project/:projectId", requireAuth, requireProjectEditor("projectId"), mediaUpload.single("media"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio ningun archivo multimedia." });
    const isVideo = /^video\//.test(req.file.mimetype);
    const folder = isVideo ? "videos" : "images";
    const stored = await storage.uploadFile(req.file, folder);
    let publicPath = stored.publicUrl;
    if (stored.provider === "local") {
      const oldPath = req.file.path;
      const fileName = path.basename(oldPath);
      publicPath = `/uploads/${folder}/${fileName}`;
      if (!oldPath.includes(`${path.sep}${folder}${path.sep}`)) {
      const fs = require("fs");
      const target = path.join(__dirname, "..", "uploads", folder, fileName);
      fs.renameSync(oldPath, target);
      }
    }
    const id = uid(isVideo ? "video" : "image");
    await run("INSERT INTO media (id, project_id, uploaded_by, file_path, type, mime_type, title, description, metadata_json, storage_provider, storage_key, public_url, size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id, req.params.projectId, req.user.id, publicPath, isVideo ? "video" : "image", req.file.mimetype, req.body.title || req.file.originalname, req.body.description || "", JSON.stringify({ size: req.file.size, relatedFiles: req.body.relatedFiles || "" }), stored.provider, stored.key || "", stored.publicUrl || publicPath, req.file.size || 0, now(), now()
    ]);
    res.json({ media: out(await get("SELECT * FROM media WHERE id = ?", [id])) });
  } catch (error) { next(error); }
});

router.delete("/:mediaId", requireAuth, async (req, res, next) => {
  try {
    const media = await get("SELECT * FROM media WHERE id = ?", [req.params.mediaId]);
    if (!media) return res.status(404).json({ error: "Media not found" });
    req.params.projectId = media.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await storage.deleteFile(media).catch((error) => console.warn("Could not delete stored media", error));
      await run("DELETE FROM media WHERE id = ?", [req.params.mediaId]);
      res.json({ ok: true });
    });
  } catch (error) { next(error); }
});

module.exports = router;
