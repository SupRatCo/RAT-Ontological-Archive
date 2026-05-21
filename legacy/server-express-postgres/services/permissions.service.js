const { query } = require("../db/pool");

async function getProjectRole(projectId, userId) {
  const result = await query(
    `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  return result.rows[0]?.role || null;
}

async function canViewProject(projectId, userId) {
  const result = await query(
    `SELECT p.visibility, pm.role
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [projectId, userId || null]
  );
  const row = result.rows[0];
  if (!row) return false;
  if (row.visibility === "public") return true;
  return Boolean(row.role);
}

async function assertProjectEditor(projectId, userId) {
  const role = await getProjectRole(projectId, userId);
  return role === "owner" || role === "editor";
}

module.exports = {
  getProjectRole,
  canViewProject,
  assertProjectEditor
};
