const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectReader, requireProjectEditor } = require("../middleware/permissions.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

router.get("/project/:projectId", requireAuth, requireProjectReader("projectId"), async (req, res, next) => {
  try { res.json({ tags: await all("SELECT * FROM tags WHERE project_id = ? ORDER BY name", [req.params.projectId]) }); }
  catch (error) { next(error); }
});

router.post("/project/:projectId", requireAuth, requireProjectEditor("projectId"), async (req, res, next) => {
  try {
    const id = uid("tag");
    await run("INSERT INTO tags (id, project_id, name, color, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, req.params.projectId, req.body.name, req.body.color || "#ffd800", req.body.description || "", req.body.category || "Personalizada", now(), now()]);
    res.json({ tag: await get("SELECT * FROM tags WHERE id = ?", [id]) });
  } catch (error) { next(error); }
});

router.patch("/:tagId", requireAuth, async (req, res, next) => {
  try {
    const tag = await get("SELECT * FROM tags WHERE id = ?", [req.params.tagId]);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    req.params.projectId = tag.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await run("UPDATE tags SET name = COALESCE(?, name), color = COALESCE(?, color), description = COALESCE(?, description), category = COALESCE(?, category), updated_at = ? WHERE id = ?", [req.body.name ?? null, req.body.color ?? null, req.body.description ?? null, req.body.category ?? null, now(), req.params.tagId]);
      res.json({ tag: await get("SELECT * FROM tags WHERE id = ?", [req.params.tagId]) });
    });
  } catch (error) { next(error); }
});

router.delete("/:tagId", requireAuth, async (req, res, next) => {
  try {
    const tag = await get("SELECT * FROM tags WHERE id = ?", [req.params.tagId]);
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    req.params.projectId = tag.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await run("DELETE FROM tags WHERE id = ?", [req.params.tagId]);
      res.json({ ok: true });
    });
  } catch (error) { next(error); }
});

module.exports = router;
