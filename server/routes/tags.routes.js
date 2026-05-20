const express = require("express");
const { query } = require("../db/pool");
const { requireAuth } = require("../middleware/auth.middleware");
const { assertProjectEditor, canViewProject } = require("../services/permissions.service");
const { badRequest, forbidden } = require("../utils/errors");

const router = express.Router();

router.get("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (!(await canViewProject(req.params.projectId, req.user.id))) throw forbidden("No tienes acceso a las etiquetas.");
    const result = await query("SELECT * FROM tags WHERE project_id = $1 ORDER BY name ASC", [req.params.projectId]);
    res.json({ ok: true, data: { tags: result.rows } });
  } catch (error) {
    next(error);
  }
});

router.post("/project/:projectId", requireAuth, async (req, res, next) => {
  try {
    if (!(await assertProjectEditor(req.params.projectId, req.user.id))) throw forbidden("No puedes crear etiquetas.");
    const name = String(req.body.name || "").trim();
    if (!name) throw badRequest("El nombre de la etiqueta es obligatorio.");
    const result = await query(
      `INSERT INTO tags (project_id, name, color, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.projectId, name, req.body.color || "#ffd800", req.body.description || ""]
    );
    res.status(201).json({ ok: true, data: { tag: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:tagId", requireAuth, async (req, res, next) => {
  try {
    const current = await query("SELECT * FROM tags WHERE id = $1", [req.params.tagId]);
    const tag = current.rows[0];
    if (!tag) throw badRequest("Etiqueta no encontrada.");
    if (!(await assertProjectEditor(tag.project_id, req.user.id))) throw forbidden("No puedes editar etiquetas.");
    const result = await query(
      `UPDATE tags
          SET name = COALESCE($2, name),
              color = COALESCE($3, color),
              description = COALESCE($4, description),
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [req.params.tagId, req.body.name ?? null, req.body.color ?? null, req.body.description ?? null]
    );
    res.json({ ok: true, data: { tag: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:tagId", requireAuth, async (req, res, next) => {
  try {
    const current = await query("SELECT * FROM tags WHERE id = $1", [req.params.tagId]);
    const tag = current.rows[0];
    if (!tag) throw badRequest("Etiqueta no encontrada.");
    if (!(await assertProjectEditor(tag.project_id, req.user.id))) throw forbidden("No puedes borrar etiquetas.");
    await query("DELETE FROM tags WHERE id = $1", [req.params.tagId]);
    res.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
