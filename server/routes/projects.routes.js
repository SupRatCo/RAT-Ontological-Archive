const express = require("express");
const { run, get, all } = require("../database");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { projectRole, canEditRole } = require("../middleware/permissions.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

const coreModules = () => [
  { id: "module_sections", name: "Secciones", type: "core", action: "open-sections", locked: true, visible: true, order: 10 },
  { id: "module_text_files", name: "Archivos de Texto", type: "core", action: "open-files-text", locked: true, visible: true, order: 20 },
  { id: "module_gallery", name: "Galeria", type: "core", action: "open-gallery", locked: true, visible: true, order: 30 },
  { id: "module_tags", name: "Etiquetas", type: "core", action: "open-tags", locked: true, visible: true, order: 40 },
  { id: "module_favorites", name: "Favoritos", type: "core", action: "open-favorites", locked: true, visible: true, order: 50 },
  { id: "module_trash", name: "Papelera", type: "core", action: "open-trash", locked: true, visible: true, order: 60 }
];

async function hydrateProject(row, userId) {
  const members = await all("SELECT user_id, role FROM project_members WHERE project_id = ?", [row.id]);
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description || "",
    visibility: row.visibility,
    editors: members.filter((m) => m.role === "editor" || m.role === "owner").map((m) => m.user_id),
    readers: members.filter((m) => m.role === "reader").map((m) => m.user_id),
    dashboardModules: JSON.parse(row.dashboard_json || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    role: (await projectRole(row.id, userId)).role
  };
}

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    const rows = await all(
      `SELECT DISTINCT p.* FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE p.visibility = 'public' OR p.owner_id = ? OR pm.user_id = ?
       ORDER BY p.updated_at DESC`,
      [userId || "", userId || ""]
    );
    res.json({ projects: await Promise.all(rows.map((row) => hydrateProject(row, userId))) });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const id = uid("project");
    const dashboard = JSON.stringify(req.body.dashboardModules || coreModules());
    await run(
      "INSERT INTO projects (id, owner_id, name, description, visibility, dashboard_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, req.user.id, req.body.name, req.body.description || "", req.body.visibility === "public" ? "public" : "private", dashboard, now(), now()]
    );
    await run("INSERT INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)", [uid("member"), id, req.user.id, "owner", now()]);
    const row = await get("SELECT * FROM projects WHERE id = ?", [id]);
    res.json({ project: await hydrateProject(row, req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.get("/:projectId", optionalAuth, async (req, res, next) => {
  try {
    const { project, role } = await projectRole(req.params.projectId, req.user && req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!role) return res.status(403).json({ error: "Project is private" });
    res.json({ project: await hydrateProject(project, req.user && req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:projectId", requireAuth, async (req, res, next) => {
  try {
    const { project, role } = await projectRole(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canEditRole(role)) return res.status(403).json({ error: "Editor access required" });
    await run(
      "UPDATE projects SET name = COALESCE(?, name), description = COALESCE(?, description), visibility = COALESCE(?, visibility), dashboard_json = COALESCE(?, dashboard_json), updated_at = ? WHERE id = ?",
      [
        req.body.name ?? null,
        req.body.description ?? null,
        req.body.visibility ?? null,
        req.body.dashboardModules ? JSON.stringify(req.body.dashboardModules) : null,
        now(),
        req.params.projectId
      ]
    );
    const row = await get("SELECT * FROM projects WHERE id = ?", [req.params.projectId]);
    res.json({ project: await hydrateProject(row, req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.delete("/:projectId", requireAuth, async (req, res, next) => {
  try {
    const project = await get("SELECT * FROM projects WHERE id = ?", [req.params.projectId]);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (project.owner_id !== req.user.id) return res.status(403).json({ error: "Owner access required" });
    await run("DELETE FROM projects WHERE id = ?", [req.params.projectId]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
