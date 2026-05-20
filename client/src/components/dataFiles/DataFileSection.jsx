import Button from "../ui/Button";
import DataFileField from "./DataFileField";

export default function DataFileSection({ section, fields, onFieldChange, onAddField, onDeleteSection }) {
  return (
    <section className="roa-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h3 className="roa-panel-title">{section.title}</h3>
        <Button variant="danger" onClick={() => onDeleteSection(section)}>Eliminar sección</Button>
      </div>
      <div className="data-field-grid">
        {fields.map((field) => <DataFileField key={field.id} field={field} onChange={onFieldChange} />)}
      </div>
      <Button onClick={() => onAddField(section)}>+ Agregar campo</Button>
    </section>
  );
}
