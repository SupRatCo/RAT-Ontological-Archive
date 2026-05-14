const { get } = require("../database");

async function projectRole(projectId, userId) {
  const project = await get("SELECT * FROM projects WHERE id = ?", [projectId]);
  if (!project || !userId) return { project, role: null };
  if (project.owner_id === userId) return { project, role: "owner" };
  const member = await get("SELECT role FROM project_members WHERE project_id = ? AND user_id = ?", [projectId, userId]);
  if (member) return { project, role: member.role };
  if (project.visibility === "public") return { project, role: "reader" };
  return { project, role: null };
}

function canEditRole(role) {
  return role === "owner" || role === "editor";
}

function requireProjectReader(reqProjectKey = "projectId") {
  return async (req, res, next) => {
    const projectId = req.params[reqProjectKey] || req.body.projectId;
    const { project, role } = await projectRole(projectId, req.user && req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!role) return res.status(403).json({ error: "No access" });
    req.project = project;
    req.projectRole = role;
    next();
  };
}

function requireProjectEditor(reqProjectKey = "projectId") {
  return async (req, res, next) => {
    const projectId = req.params[reqProjectKey] || req.body.projectId;
    const { project, role } = await projectRole(projectId, req.user && req.user.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!canEditRole(role)) return res.status(403).json({ error: "Editor access required" });
    req.project = project;
    req.projectRole = role;
    next();
  };
}

module.exports = { projectRole, canEditRole, requireProjectReader, requireProjectEditor };
