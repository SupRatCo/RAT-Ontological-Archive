import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import DataFileSection from "./DataFileSection";

export default function DataFileEditor({ dataFile, onAddSection, onAddField, onFieldChange, onDeleteField, onDeleteSection, onRenameSection }) {
  const fieldsBySection = new Map();
  (dataFile.fields || []).forEach((field) => {
    const list = fieldsBySection.get(field.section_id) || [];
    list.push(field);
    fieldsBySection.set(field.section_id, list);
  });

  return (
    <div className="data-file-layout">
      <section className="roa-panel data-file-hero">
        <div>
          <p className="forum-kicker">DATA FILE</p>
          <h1 className="roa-panel-title">Archivo de Datos: {dataFile.title}</h1>
          {dataFile.description && <p>{dataFile.description}</p>}
        </div>
        <Button variant="primary" onClick={onAddSection}><AppIcon name="add" />Nueva seccion</Button>
      </section>
      {(dataFile.sections || []).map((section) => (
        <DataFileSection
          key={section.id}
          section={section}
          fields={fieldsBySection.get(section.id) || []}
          onFieldChange={onFieldChange}
          onDeleteField={onDeleteField}
          onAddField={onAddField}
          onDeleteSection={onDeleteSection}
          onRenameSection={onRenameSection}
        />
      ))}
    </div>
  );
}
