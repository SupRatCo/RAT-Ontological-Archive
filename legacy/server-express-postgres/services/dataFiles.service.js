const { query, transaction } = require("../db/pool");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { assertProjectEditor, canViewProject } = require("./permissions.service");

const allowedFieldTypes = new Set(["short_text", "long_text", "number", "checkbox", "list", "select", "date", "url", "image", "tag", "relation"]);

async function listDataFiles(projectId, userId) {
  if (!(await canViewProject(projectId, userId))) throw forbidden("No tienes acceso a este proyecto.");
  const result = await query(
    `SELECT * FROM data_files
      WHERE project_id = $1 AND deleted_at IS NULL
      ORDER BY updated_at DESC`,
    [projectId]
  );
  return result.rows;
}

async function createDataFile(projectId, userId, payload = {}) {
  if (!(await assertProjectEditor(projectId, userId))) throw forbidden("No puedes crear archivos de datos en este proyecto.");
  const title = String(payload.title || "").trim();
  if (!title) throw badRequest("El título del Archivo de Datos es obligatorio.");
  const result = await query(
    `INSERT INTO data_files (project_id, author_id, title, description, cover_url, visibility)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [projectId, userId, title, payload.description || "", payload.cover_url || payload.coverUrl || null, payload.visibility || "inherit"]
  );
  return result.rows[0];
}

async function getDataFile(dataFileId, userId) {
  const fileResult = await query("SELECT * FROM data_files WHERE id = $1 AND deleted_at IS NULL", [dataFileId]);
  const dataFile = fileResult.rows[0];
  if (!dataFile) throw notFound("Archivo de Datos no encontrado.");
  if (!(await canViewProject(dataFile.project_id, userId))) throw forbidden("No tienes acceso a este Archivo de Datos.");

  const sections = await query(
    `SELECT * FROM data_file_sections WHERE data_file_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [dataFileId]
  );
  const fields = await query(
    `SELECT f.*
       FROM data_file_fields f
       JOIN data_file_sections s ON s.id = f.section_id
      WHERE s.data_file_id = $1
      ORDER BY f.sort_order ASC, f.created_at ASC`,
    [dataFileId]
  );
  return { ...dataFile, sections: sections.rows, fields: fields.rows };
}

async function updateDataFile(dataFileId, userId, payload = {}) {
  const dataFile = await getDataFile(dataFileId, userId);
  if (!(await assertProjectEditor(dataFile.project_id, userId))) throw forbidden("No puedes editar este Archivo de Datos.");
  const result = await query(
    `UPDATE data_files
        SET title = COALESCE($2, title),
            description = COALESCE($3, description),
            cover_url = COALESCE($4, cover_url),
            visibility = COALESCE($5, visibility),
            favorite = COALESCE($6, favorite),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      dataFileId,
      payload.title ? String(payload.title).trim() : null,
      payload.description ?? null,
      payload.cover_url ?? payload.coverUrl ?? null,
      payload.visibility ?? null,
      payload.favorite ?? null
    ]
  );
  return result.rows[0];
}

async function deleteDataFile(dataFileId, userId) {
  const dataFile = await getDataFile(dataFileId, userId);
  if (!(await assertProjectEditor(dataFile.project_id, userId))) throw forbidden("No puedes eliminar este Archivo de Datos.");
  await query("UPDATE data_files SET deleted_at = now(), updated_at = now() WHERE id = $1", [dataFileId]);
  return { deleted: true };
}

async function createSection(dataFileId, userId, payload = {}) {
  const dataFile = await getDataFile(dataFileId, userId);
  if (!(await assertProjectEditor(dataFile.project_id, userId))) throw forbidden("No puedes editar secciones.");
  const title = String(payload.title || "").trim();
  if (!title) throw badRequest("El nombre de la sección es obligatorio.");
  const result = await query(
    `INSERT INTO data_file_sections (data_file_id, title, sort_order)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [dataFileId, title, payload.sort_order || payload.sortOrder || 0]
  );
  return result.rows[0];
}

async function updateSection(sectionId, userId, payload = {}) {
  const section = await getSectionWithFile(sectionId);
  if (!(await assertProjectEditor(section.project_id, userId))) throw forbidden("No puedes editar secciones.");
  const result = await query(
    `UPDATE data_file_sections
        SET title = COALESCE($2, title),
            sort_order = COALESCE($3, sort_order),
            collapsed = COALESCE($4, collapsed),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [sectionId, payload.title ?? null, payload.sort_order ?? payload.sortOrder ?? null, payload.collapsed ?? null]
  );
  return result.rows[0];
}

async function deleteSection(sectionId, userId) {
  const section = await getSectionWithFile(sectionId);
  if (!(await assertProjectEditor(section.project_id, userId))) throw forbidden("No puedes eliminar secciones.");
  await query("DELETE FROM data_file_sections WHERE id = $1", [sectionId]);
  return { deleted: true };
}

async function createField(sectionId, userId, payload = {}) {
  const section = await getSectionWithFile(sectionId);
  if (!(await assertProjectEditor(section.project_id, userId))) throw forbidden("No puedes editar campos.");
  const label = String(payload.label || "").trim();
  const fieldType = payload.field_type || payload.fieldType || "short_text";
  if (!label) throw badRequest("El nombre del campo es obligatorio.");
  if (!allowedFieldTypes.has(fieldType)) throw badRequest("Tipo de campo no permitido.");
  const result = await query(
    `INSERT INTO data_file_fields (section_id, label, field_type, value_json, sort_order)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING *`,
    [sectionId, label, fieldType, JSON.stringify(payload.value_json ?? payload.valueJson ?? null), payload.sort_order || payload.sortOrder || 0]
  );
  return result.rows[0];
}

async function updateField(fieldId, userId, payload = {}) {
  const field = await getFieldWithFile(fieldId);
  if (!(await assertProjectEditor(field.project_id, userId))) throw forbidden("No puedes editar campos.");
  const fieldType = payload.field_type || payload.fieldType || null;
  if (fieldType && !allowedFieldTypes.has(fieldType)) throw badRequest("Tipo de campo no permitido.");
  const result = await query(
    `UPDATE data_file_fields
        SET label = COALESCE($2, label),
            field_type = COALESCE($3, field_type),
            value_json = COALESCE($4::jsonb, value_json),
            sort_order = COALESCE($5, sort_order),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      fieldId,
      payload.label ?? null,
      fieldType,
      payload.value_json !== undefined || payload.valueJson !== undefined ? JSON.stringify(payload.value_json ?? payload.valueJson) : null,
      payload.sort_order ?? payload.sortOrder ?? null
    ]
  );
  return result.rows[0];
}

async function deleteField(fieldId, userId) {
  const field = await getFieldWithFile(fieldId);
  if (!(await assertProjectEditor(field.project_id, userId))) throw forbidden("No puedes eliminar campos.");
  await query("DELETE FROM data_file_fields WHERE id = $1", [fieldId]);
  return { deleted: true };
}

async function getSectionWithFile(sectionId) {
  const result = await query(
    `SELECT s.*, df.project_id
       FROM data_file_sections s
       JOIN data_files df ON df.id = s.data_file_id
      WHERE s.id = $1`,
    [sectionId]
  );
  if (!result.rows[0]) throw notFound("Sección no encontrada.");
  return result.rows[0];
}

async function getFieldWithFile(fieldId) {
  const result = await query(
    `SELECT f.*, df.project_id
       FROM data_file_fields f
       JOIN data_file_sections s ON s.id = f.section_id
       JOIN data_files df ON df.id = s.data_file_id
      WHERE f.id = $1`,
    [fieldId]
  );
  if (!result.rows[0]) throw notFound("Campo no encontrado.");
  return result.rows[0];
}

module.exports = {
  listDataFiles,
  createDataFile,
  getDataFile,
  updateDataFile,
  deleteDataFile,
  createSection,
  updateSection,
  deleteSection,
  createField,
  updateField,
  deleteField
};
