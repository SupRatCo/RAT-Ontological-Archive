const express = require("express");
const { run, get, all } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { projectRole, canEditRole } = require("../middleware/permissions.middleware");
const { notify } = require("./notifications.routes");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

router.post("/projects/:projectId/request", requireAuth, async (req, res, next) => {
  try {
    const { project, role } = await projectRole(req.params.projectId, req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (role) return res.json({ ok: true, status: "already-has-access" });
    const existing = await get("SELECT * FROM access_requests WHERE project_id = ? AND user_id = ? AND status = 'pendiente'", [project.id, req.user.id]);
    if (existing) return res.json({ request: existing });
    const id = uid("request");
    await run("INSERT INTO access_requests (id, project_id, user_id, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, project.id, req.user.id, req.body.message || "", "pendiente", now(), now()]);
    await notify(project.owner_id, "Solicitud de acceso", `${req.user.username} solicita acceso a ${project.name}.`, "access-request", { projectId: project.id, requestId: id });
    res.json({ request: await get("SELECT * FROM access_requests WHERE id = ?", [id]) });
  } catch (error) { next(error); }
});

router.get("/requests", requireAuth, async (req, res, next) => {
  try {
    const rows = await all(`SELECT ar.*, p.name as project_name, u.username
      FROM access_requests ar
      JOIN projects p ON p.id = ar.project_id
      JOIN users u ON u.id = ar.user_id
      WHERE p.owner_id = ? OR EXISTS (
        SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = ? AND pm.role IN ('owner','editor')
      )
      ORDER BY ar.created_at DESC`, [req.user.id, req.user.id]);
    res.json({ requests: rows });
  } catch (error) { next(error); }
});

router.post("/requests/:requestId/decision", requireAuth, async (req, res, next) => {
  try {
    const request = await get("SELECT * FROM access_requests WHERE id = ?", [req.params.requestId]);
    if (!request) return res.status(404).json({ error: "Request not found" });
    const { project, role } = await projectRole(request.project_id, req.user.id);
    if (!project || !canEditRole(role)) return res.status(403).json({ error: "Editor access required" });
    const status = req.body.accept ? "aceptada" : "rechazada";
    await run("UPDATE access_requests SET status = ?, updated_at = ? WHERE id = ?", [status, now(), request.id]);
    if (req.body.accept) {
      await run("INSERT OR REPLACE INTO project_members (id, project_id, user_id, role, created_at) VALUES (?, ?, ?, 'reader', ?)", [uid("member"), project.id, request.user_id, now()]);
    }
    await notify(request.user_id, status === "aceptada" ? "Acceso aceptado" : "Acceso rechazado", `Tu solicitud para ${project.name} fue ${status}.`, "access-result", { projectId: project.id, status });
    res.json({ ok: true, status });
  } catch (error) { next(error); }
});

module.exports = router;
