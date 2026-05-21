import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Textarea from "../ui/Textarea";

function toText(value) {
  if (Array.isArray(value)) return value.join("\n");
  return value ?? "";
}

export default function DataFileField({ field, onChange, onDelete }) {
  const value = field.value_json ?? "";
  const type = field.field_type || "short_text";
  const options = field.options?.length ? field.options : ["Opcion 1", "Opcion 2"];

  const update = (nextValue) => onChange(field, nextValue);

  return (
    <label className="data-field">
      <span>
        {field.label}
        <Button type="button" onClick={() => onDelete(field)} title="Eliminar campo"><AppIcon name="delete" size={16} /></Button>
      </span>
      {type === "long_text" && <Textarea value={toText(value)} onChange={(event) => update(event.target.value)} />}
      {type === "checkbox" && <input type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} />}
      {type === "number" && <Input type="number" value={toText(value)} onChange={(event) => update(event.target.value)} />}
      {type === "date" && <Input type="date" value={toText(value)} onChange={(event) => update(event.target.value)} />}
      {type === "url" && <Input type="url" value={toText(value)} onChange={(event) => update(event.target.value)} />}
      {type === "list" && <Textarea value={toText(value)} placeholder="Un item por linea" onChange={(event) => update(event.target.value.split("\n").filter(Boolean))} />}
      {type === "select" && (
        <Select value={toText(value)} onChange={(event) => update(event.target.value)}>
          <option value="">Seleccionar</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </Select>
      )}
      {["short_text", "image", "tag", "relation"].includes(type) && <Input value={toText(value)} onChange={(event) => update(event.target.value)} placeholder={type === "image" ? "URL de imagen" : ""} />}
    </label>
  );
}
