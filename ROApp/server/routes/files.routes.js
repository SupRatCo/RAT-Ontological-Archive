const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireProjectReader, requireProjectEditor } = require("../middleware/permissions.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

function fileOut(row, fields = []) {
  const data = JSON.parse(row.data_json || "{}");
  let internalSections = Array.isArray(data.internalSections) ? data.internalSections : [];
  if (fields.length) {
    const bySection = new Map(internalSections.map((section) => [section.id, Object.assign({}, section, { fields: [] })]));
    fields.forEach((field) => {
      const sectionId = field.internal_section_id || "default";
      if (!bySection.has(sectionId)) {
        bySection.set(sectionId, { id: sectionId, name: field.internal_section_name || "General", locked: false, order: bySection.size + 1, fields: [] });
      }
      let value = field.value;
      try { value = JSON.parse(field.value); } catch (_error) {}
      bySection.get(sectionId).fields.push({
        id: field.id,
        label: field.label,
        kind: field.field_type,
        value
      });
    });
    internalSections = Array.from(bySection.values());
    data.dynamicFields = fields;
  }
  return {
    id: row.id,
    projectId: row.project_id,
    sectionId: row.section_id,
    type: row.type,
    title: row.title,
    content: row.content || "",
    data,
    internalSections,
    visibility: row.visibility,
    favorite: !!row.favorite,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/project/:projectId", requireAuth, requireProjectReader("projectId"), async (req, res, next) => {
  try {
    const rows = await all("SELECT * FROM files WHERE project_id = ? ORDER BY updated_at DESC", [req.params.projectId]);
    res.json({ files: rows.map((row) => fileOut(row)) });
  } catch (error) { next(error); }
});

router.post("/project/:projectId", requireAuth, requireProjectEditor("projectId"), async (req, res, next) => {
  try {
    const id = req.body.id || uid("file");
    const dataJson = Object.assign({}, req.body.data || {}, { internalSections: req.body.internalSections || (req.body.data || {}).internalSections || [] });
    await run("INSERT INTO files (id, project_id, section_id, type, title, content, data_json, visibility, favorite, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id, req.params.projectId, req.body.sectionId || null, req.body.type || "text", req.body.title || "Archivo", req.body.content || "", JSON.stringify(dataJson), req.body.visibility || "inherit", req.body.favorite ? 1 : 0, req.body.status || "Borrador", now(), now()
    ]);
    res.json({ file: fileOut(await get("SELECT * FROM files WHERE id = ?", [id])) });
  } catch (error) { next(error); }
});

router.get("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM files WHERE id = ?", [req.params.fileId]);
    if (!row) return res.status(404).json({ error: "File not found" });
    const fields = await all("SELECT * FROM file_fields WHERE file_id = ? ORDER BY sort_order", [req.params.fileId]);
    res.json({ file: fileOut(row, fields) });
  } catch (error) { next(error); }
});

router.patch("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM files WHERE id = ?", [req.params.fileId]);
    if (!row) return res.status(404).json({ error: "File not found" });
    req.params.projectId = row.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      const dataJson = req.body.data ? Object.assign({}, req.body.data || {}, { internalSections: req.body.internalSections || (req.body.data || {}).internalSections || [] }) : null;
      await run(
        "UPDATE files SET section_id = COALESCE(?, section_id), type = COALESCE(?, type), title = COALESCE(?, title), content = COALESCE(?, content), data_json = COALESCE(?, data_json), visibility = COALESCE(?, visibility), favorite = COALESCE(?, favorite), status = COALESCE(?, status), updated_at = ? WHERE id = ?",
        [req.body.sectionId ?? null, req.body.type ?? null, req.body.title ?? null, req.body.content ?? null, dataJson ? JSON.stringify(dataJson) : null, req.body.visibility ?? null, req.body.favorite == null ? null : (req.body.favorite ? 1 : 0), req.body.status ?? null, now(), req.params.fileId]
      );
      if (Array.isArray(req.body.dynamicFields)) {
        await run("DELETE FROM file_fields WHERE file_id = ?", [req.params.fileId]);
        for (const [index, field] of req.body.dynamicFields.entries()) {
          await run("INSERT INTO file_fields (id, file_id, internal_section_id, internal_section_name, label, field_type, value, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            field.id || uid("field"), req.params.fileId, field.internalSectionId || field.internal_section_id || "default", field.internalSectionName || field.internal_section_name || "General", field.label, field.fieldType || field.field_type || field.kind || "short", JSON.stringify(field.value ?? ""), field.sortOrder || index, now(), now()
          ]);
        }
      }
      res.json({ file: fileOut(await get("SELECT * FROM files WHERE id = ?", [req.params.fileId])) });
    });
  } catch (error) { next(error); }
});

router.delete("/:fileId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT project_id FROM files WHERE id = ?", [req.params.fileId]);
    if (!row) return res.status(404).json({ error: "File not found" });
    req.params.projectId = row.project_id;
    await requireProjectEditor("projectId")(req, res, async () => {
      await run("DELETE FROM files WHERE id = ?", [req.params.fileId]);
      res.json({ ok: true });
    });
  } catch (error) { next(error); }
});

module.exports = router;
