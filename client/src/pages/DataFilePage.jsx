import { useEffect, useState } from "react";
import {
  createDataFile as createDataFileRecord,
  createField as createFieldRecord,
  createSection as createSectionRecord,
  deleteField as deleteFieldRecord,
  deleteSection as deleteSectionRecord,
  getDataFile,
  getDataFiles,
  updateField as updateFieldRecord,
  updateSection as updateSectionRecord
} from "../services/dataFileService";
import DataFileList from "../components/dataFiles/DataFileList";
import DataFileEditor from "../components/dataFiles/DataFileEditor";
import EmptyState from "../components/ui/EmptyState";

export default function DataFilePage({ project, toast }) {
  const [dataFiles, setDataFiles] = useState([]);
  const [active, setActive] = useState(null);

  async function load() {
    if (!project?.id) return;
    const data = await getDataFiles(project.id);
    setDataFiles(data.dataFiles || []);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [project?.id]);

  async function createDataFile() {
    const title = prompt("Nombre del Archivo de Datos");
    if (!title) return;
    const data = await createDataFileRecord(project.id, { title });
    setDataFiles((current) => [data.dataFile, ...current]);
    const full = await getDataFile(project.id, data.dataFile.id);
    setActive(full.dataFile);
  }

  async function openDataFile(file) {
    const data = await getDataFile(project.id, file.id);
    setActive(data.dataFile);
  }

  async function addSection() {
    const title = prompt("Nombre de la sección");
    if (!title) return;
    const data = await createSectionRecord(project.id, active.id, { title });
    setActive((current) => ({ ...current, sections: [...(current.sections || []), data.section] }));
  }

  async function addField(section, payload) {
    const data = await createFieldRecord(project.id, active.id, section.id, payload);
    setActive((current) => ({ ...current, fields: [...(current.fields || []), data.field] }));
  }

  async function updateField(field, value) {
    const data = await updateFieldRecord(project.id, active.id, field.section_id, field.id, { value_json: value });
    setActive((current) => ({ ...current, fields: current.fields.map((item) => item.id === field.id ? data.field : item) }));
  }

  async function deleteSection(section) {
    await deleteSectionRecord(project.id, active.id, section.id);
    setActive((current) => ({
      ...current,
      sections: current.sections.filter((item) => item.id !== section.id),
      fields: current.fields.filter((item) => item.section_id !== section.id)
    }));
  }

  async function renameSection(section, title) {
    await updateSectionRecord(project.id, active.id, section.id, { title });
    setActive((current) => ({
      ...current,
      sections: current.sections.map((item) => item.id === section.id ? { ...item, title } : item)
    }));
  }

  async function deleteField(field) {
    await deleteFieldRecord(project.id, active.id, field.section_id, field.id);
    setActive((current) => ({ ...current, fields: current.fields.filter((item) => item.id !== field.id) }));
  }

  if (!project) return <EmptyState title="NO PROJECT" message="Selecciona un proyecto para abrir Archivos de Datos." />;

  return active ? (
    <DataFileEditor dataFile={active} onAddSection={addSection} onAddField={addField} onFieldChange={updateField} onDeleteField={deleteField} onDeleteSection={deleteSection} onRenameSection={renameSection} />
  ) : (
    <DataFileList dataFiles={dataFiles} onOpen={openDataFile} onCreate={createDataFile} />
  );
}
