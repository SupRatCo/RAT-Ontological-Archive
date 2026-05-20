import { useEffect, useState } from "react";
import { dataFilesApi } from "../api/dataFiles.api";
import DataFileList from "../components/dataFiles/DataFileList";
import DataFileEditor from "../components/dataFiles/DataFileEditor";
import EmptyState from "../components/ui/EmptyState";

export default function DataFilePage({ project, toast }) {
  const [dataFiles, setDataFiles] = useState([]);
  const [active, setActive] = useState(null);

  async function load() {
    if (!project?.id) return;
    const data = await dataFilesApi.list(project.id);
    setDataFiles(data.dataFiles || []);
  }

  useEffect(() => {
    load().catch((error) => toast(error.message));
  }, [project?.id]);

  async function createDataFile() {
    const title = prompt("Nombre del Archivo de Datos");
    if (!title) return;
    const data = await dataFilesApi.create(project.id, { title });
    setDataFiles((current) => [data.dataFile, ...current]);
    const full = await dataFilesApi.get(data.dataFile.id);
    setActive(full.dataFile);
  }

  async function openDataFile(file) {
    const data = await dataFilesApi.get(file.id);
    setActive(data.dataFile);
  }

  async function addSection() {
    const title = prompt("Nombre de la sección");
    if (!title) return;
    const data = await dataFilesApi.createSection(active.id, { title });
    setActive((current) => ({ ...current, sections: [...(current.sections || []), data.section] }));
  }

  async function addField(section) {
    const label = prompt("Nombre del campo");
    if (!label) return;
    const data = await dataFilesApi.createField(section.id, { label, field_type: "short_text" });
    setActive((current) => ({ ...current, fields: [...(current.fields || []), data.field] }));
  }

  async function updateField(field, value) {
    const data = await dataFilesApi.updateField(field.id, { value_json: value });
    setActive((current) => ({ ...current, fields: current.fields.map((item) => item.id === field.id ? data.field : item) }));
  }

  async function deleteSection(section) {
    await dataFilesApi.deleteSection(section.id);
    setActive((current) => ({
      ...current,
      sections: current.sections.filter((item) => item.id !== section.id),
      fields: current.fields.filter((item) => item.section_id !== section.id)
    }));
  }

  if (!project) return <EmptyState title="NO PROJECT" message="Selecciona un proyecto para abrir Archivos de Datos." />;

  return active ? (
    <DataFileEditor dataFile={active} onAddSection={addSection} onAddField={addField} onFieldChange={updateField} onDeleteSection={deleteSection} />
  ) : (
    <DataFileList dataFiles={dataFiles} onOpen={openDataFile} onCreate={createDataFile} />
  );
}
