import Button from "../ui/Button";
import DataFileSection from "./DataFileSection";

export default function DataFileEditor({ dataFile, onAddSection, onAddField, onFieldChange, onDeleteSection }) {
  const fieldsBySection = new Map();
  (dataFile.fields || []).forEach((field) => {
    const list = fieldsBySection.get(field.section_id) || [];
    list.push(field);
    fieldsBySection.set(field.section_id, list);
  });

  return (
    <div className="data-file-layout">
      <section className="roa-panel">
        <h1 className="roa-panel-title">Archivo de Datos: {dataFile.title}</h1>
        <p>{dataFile.description}</p>
        <Button variant="primary" onClick={onAddSection}>+ Nueva sección</Button>
      </section>
      {(dataFile.sections || []).map((section) => (
        <DataFileSection
          key={section.id}
          section={section}
          fields={fieldsBySection.get(section.id) || []}
          onFieldChange={onFieldChange}
          onAddField={onAddField}
          onDeleteSection={onDeleteSection}
        />
      ))}
    </div>
  );
}
