const express = require("express");
const { query } = require("../db/pool");
const { requireAuth } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");
const { assertProjectEditor, canViewProject } = require("../services/permissions.service");
const storageService = require("../services/storage.service");
const { forbidden, notFound } = require("../utils/errors");

const router = express.Router();

router.get("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (!(await canViewProject(req.params.projectId, req.user.id))) throw forbidden("No tienes acceso a la galería.");
    const result = await query(
      `SELECT * FROM media WHERE project_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    res.json({ ok: true, data: { media: result.rows } });
  } catch (error) {
    next(error);
  }
});

router.post("/project/:projectId", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!(await assertProjectEditor(req.params.projectId, req.user.id))) throw forbidden("No puedes subir media a este proyecto.");
    const uploaded = await storageService.uploadFile(req.file, { userId: req.user.id, prefix: `projects/${req.params.projectId}` });
    const result = await query(
      `INSERT INTO media (project_id, uploaded_by, storage_provider, storage_key, public_url, mime_type, media_type, size, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.params.projectId,
        req.user.id,
        uploaded.storage_provider,
        uploaded.storage_key,
        uploaded.public_url,
        uploaded.mime_type,
        uploaded.media_type,
        uploaded.size,
        req.body.title || req.file.originalname,
        req.body.description || ""
      ]
    );
    res.status(201).json({ ok: true, data: { media: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:mediaId", requireAuth, async (req, res, next) => {
  try {
    const mediaResult = await query("SELECT * FROM media WHERE id = $1 AND deleted_at IS NULL", [req.params.mediaId]);
    const media = mediaResult.rows[0];
    if (!media) throw notFound("Media no encontrada.");
    if (media.project_id && !(await assertProjectEditor(media.project_id, req.user.id))) throw forbidden("No puedes borrar este archivo.");
    await query("UPDATE media SET deleted_at = now(), updated_at = now() WHERE id = $1", [media.id]);
    res.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
