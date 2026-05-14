const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectReader, requireProjectEditor } = require("../middleware/permissions.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

router.get("/project/:projectId", requireAuth, requireProjectReader("projectId"), async (req, res, next) => {
  try {
    const rows = await all("SELECT * FROM sections WHERE project_id = ? ORDER BY created_at", [req.params.projectId]);
    res.json({ sections: rows.map((s) => ({ id: s.id, projectId: s.project_id, parentId: s.parent_id, name: s.name, description: s.description, visibility: s.visibility, createdAt: s.created_at, updatedAt: s.updated_at })) });
  } catch (error) { next(error); }
});

router.post("/project/:projectId", requireAuth, requireProjectEditor("projectId"), async (req, res, next) => {
  try {
    const id = uid("section");
    await run("INSERT INTO sections (id, project_id, parent_id, name, description, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, req.params.projectId, req.body.parentId || null, req.body.name, req.body.description || "", req.body.visibility || "inherit", now(), now()]);
    const row = await get("SELECT * FROM sections WHERE id = ?", [id]);
    res.json({ section: row });
  } catch (error) { next(error); }
});

router.patch("/:sectionId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT project_id FROM sections WHERE id = ?", [req.params.sectionId]);
    if (!row) return res.status(404).json({ error: "Section not found" });
    req.params.projectId = row.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await run("UPDATE sections SET name = COALESCE(?, name), description = COALESCE(?, description), visibility = COALESCE(?, visibility), updated_at = ? WHERE id = ?", [req.body.name ?? null, req.body.description ?? null, req.body.visibility ?? null, now(), req.params.sectionId]);
      res.json({ section: await get("SELECT * FROM sections WHERE id = ?", [req.params.sectionId]) });
    });
  } catch (error) { next(error); }
});

router.delete("/:sectionId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT project_id FROM sections WHERE id = ?", [req.params.sectionId]);
    if (!row) return res.status(404).json({ error: "Section not found" });
    req.params.projectId = row.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await run("DELETE FROM sections WHERE id = ?", [req.params.sectionId]);
      res.json({ ok: true });
    });
  } catch (error) { next(error); }
});

module.exports = router;
