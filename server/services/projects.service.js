const { query, transaction } = require("../db/pool");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { getProjectRole } = require("./permissions.service");

async function listProjects(userId) {
  const result = await query(
    `SELECT p.*, pm.role,
            (SELECT count(*)::int FROM documents d WHERE d.project_id = p.id AND d.deleted_at IS NULL) AS documents_count,
            (SELECT count(*)::int FROM data_files df WHERE df.project_id = p.id AND df.deleted_at IS NULL) AS data_files_count,
            (SELECT count(*)::int FROM media m WHERE m.project_id = p.id AND m.deleted_at IS NULL) AS media_count
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      WHERE p.deleted_at IS NULL
        AND (p.visibility = 'public' OR pm.user_id IS NOT NULL)
      ORDER BY p.updated_at DESC`,
    [userId]
  );
  return result.rows;
}

async function createProject(userId, payload = {}) {
  const name = String(payload.name || "").trim();
  if (!name) throw badRequest("El nombre del proyecto es obligatorio.");

  return transaction(async (client) => {
    const projectResult = await client.query(
      `INSERT INTO projects (owner_id, name, description, visibility, cover_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        name,
        payload.description || "",
        payload.visibility === "public" ? "public" : "private",
        payload.cover_url || payload.coverUrl || null
      ]
    );
    const project = projectResult.rows[0];
    await client.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [project.id, userId]
    );
    return { ...project, role: "owner" };
  });
}

async function getProject(projectId, userId) {
  const result = await query(
    `SELECT p.*, pm.role
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
      WHERE p.id = $1 AND p.deleted_at IS NULL`,
    [projectId, userId || null]
  );
  const project = result.rows[0];
  if (!project) throw notFound("Proyecto no encontrado.");
  if (project.visibility !== "public" && !project.role) throw forbidden("No tienes acceso a este proyecto.");
  return project;
}

async function updateProject(projectId, userId, payload = {}) {
  const role = await getProjectRole(projectId, userId);
  if (!["owner", "editor"].includes(role)) throw forbidden("No tienes permisos para editar este proyecto.");

  const result = await query(
    `UPDATE projects
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            visibility = COALESCE($4, visibility),
            cover_url = COALESCE($5, cover_url),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      projectId,
      payload.name ? String(payload.name).trim() : null,
      payload.description ?? null,
      payload.visibility ?? null,
      payload.cover_url ?? payload.coverUrl ?? null
    ]
  );
  if (!result.rows[0]) throw notFound("Proyecto no encontrado.");
  return { ...result.rows[0], role };
}

async function deleteProject(projectId, userId, confirmationName) {
  const project = await getProject(projectId, userId);
  if (project.role !== "owner") throw forbidden("Solo el owner puede eliminar el proyecto.");
  if (confirmationName !== project.name) throw badRequest("El nombre de confirmación no coincide.");

  await query("UPDATE projects SET deleted_at = now(), updated_at = now() WHERE id = $1", [projectId]);
  return { deleted: true };
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
};
