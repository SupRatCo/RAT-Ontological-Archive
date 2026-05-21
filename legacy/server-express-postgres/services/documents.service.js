const { query } = require("../db/pool");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { sanitizeHtml } = require("../utils/sanitize");
const { assertProjectEditor, canViewProject } = require("./permissions.service");

async function listDocuments(projectId, userId) {
  if (!(await canViewProject(projectId, userId))) throw forbidden("No tienes acceso a este proyecto.");
  const result = await query(
    `SELECT * FROM documents
      WHERE project_id = $1 AND deleted_at IS NULL
      ORDER BY updated_at DESC`,
    [projectId]
  );
  return result.rows;
}

async function createDocument(projectId, userId, payload = {}) {
  if (!(await assertProjectEditor(projectId, userId))) throw forbidden("No puedes crear documentos en este proyecto.");
  const title = String(payload.title || "").trim();
  if (!title) throw badRequest("El título del documento es obligatorio.");
  const result = await query(
    `INSERT INTO documents (project_id, author_id, title, content_html, content_json, visibility)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)
     RETURNING *`,
    [
      projectId,
      userId,
      title,
      sanitizeHtml(payload.content_html || payload.contentHtml || ""),
      JSON.stringify(payload.content_json || payload.contentJson || {}),
      payload.visibility || "inherit"
    ]
  );
  return result.rows[0];
}

async function getDocument(documentId, userId) {
  const result = await query("SELECT * FROM documents WHERE id = $1 AND deleted_at IS NULL", [documentId]);
  const document = result.rows[0];
  if (!document) throw notFound("Documento no encontrado.");
  if (!(await canViewProject(document.project_id, userId))) throw forbidden("No tienes acceso a este documento.");
  return document;
}

async function updateDocument(documentId, userId, payload = {}) {
  const document = await getDocument(documentId, userId);
  if (!(await assertProjectEditor(document.project_id, userId))) throw forbidden("No puedes editar este documento.");
  const result = await query(
    `UPDATE documents
        SET title = COALESCE($2, title),
            content_html = COALESCE($3, content_html),
            content_json = COALESCE($4::jsonb, content_json),
            visibility = COALESCE($5, visibility),
            status = COALESCE($6, status),
            favorite = COALESCE($7, favorite),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      documentId,
      payload.title ? String(payload.title).trim() : null,
      payload.content_html !== undefined || payload.contentHtml !== undefined
        ? sanitizeHtml(payload.content_html || payload.contentHtml || "")
        : null,
      payload.content_json !== undefined || payload.contentJson !== undefined
        ? JSON.stringify(payload.content_json || payload.contentJson || {})
        : null,
      payload.visibility ?? null,
      payload.status ?? null,
      payload.favorite ?? null
    ]
  );
  return result.rows[0];
}

async function deleteDocument(documentId, userId) {
  const document = await getDocument(documentId, userId);
  if (!(await assertProjectEditor(document.project_id, userId))) throw forbidden("No puedes eliminar este documento.");
  await query("UPDATE documents SET deleted_at = now(), updated_at = now() WHERE id = $1", [documentId]);
  return { deleted: true };
}

module.exports = {
  listDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument
};
