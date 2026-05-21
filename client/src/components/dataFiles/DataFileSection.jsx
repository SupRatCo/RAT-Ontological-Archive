import { useState } from "react";
import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Input from "../ui/Input";
import DataFileField from "./DataFileField";
import FieldTypePicker from "./FieldTypePicker";

export default function DataFileSection({ section, fields, onFieldChange, onDeleteField, onAddField, onDeleteSection, onRenameSection }) {
  const [draft, setDraft] = useState({ label: "", field_type: "short_text" });
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);

  async function submitField(event) {
    event.preventDefault();
    if (!draft.label.trim()) return;
    await onAddField(section, draft);
    setDraft({ label: "", field_type: "short_text" });
  }

  async function saveTitle() {
    const next = title.trim() || section.title;
    setTitle(next);
    setEditingTitle(false);
    if (next !== section.title) await onRenameSection(section, next);
  }

  return (
    <section className="roa-panel data-section-card">
      <div className="data-section-header">
        {editingTitle ? (
          <Input value={title} onChange={(event) => setTitle(event.target.value)} onBlur={saveTitle} onKeyDown={(event) => event.key === "Enter" && saveTitle()} autoFocus />
        ) : (
          <h3 className="roa-panel-title">{section.title}</h3>
        )}
        <div className="data-section-actions">
          <Button onClick={() => setEditingTitle(true)}><AppIcon name="edit" />Editar</Button>
          <Button variant="danger" onClick={() => onDeleteSection(section)}><AppIcon name="delete" />Eliminar</Button>
        </div>
      </div>
      <div className="data-field-grid">
        {fields.map((field) => <DataFileField key={field.id} field={field} onChange={onFieldChange} onDelete={onDeleteField} />)}
      </div>
      <form className="data-field-form" onSubmit={submitField}>
        <Input placeholder="Nombre del campo" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
        <FieldTypePicker value={draft.field_type} onChange={(event) => setDraft({ ...draft, field_type: event.target.value })} />
        <Button variant="primary"><AppIcon name="add" />Agregar campo</Button>
      </form>
    </section>
  );
}
