import Input from "../ui/Input";
import Textarea from "../ui/Textarea";

export default function DataFileField({ field, onChange }) {
  const value = field.value_json ?? "";
  const common = {
    value: Array.isArray(value) ? value.join("\n") : value ?? "",
    onChange: (event) => onChange(field, event.target.type === "checkbox" ? event.target.checked : event.target.value)
  };

  return (
    <label className="data-field">
      <span>{field.label}</span>
      {field.field_type === "long_text" ? <Textarea {...common} /> : null}
      {field.field_type === "checkbox" ? <input type="checkbox" checked={Boolean(value)} onChange={common.onChange} /> : null}
      {field.field_type !== "long_text" && field.field_type !== "checkbox" ? <Input type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"} {...common} /> : null}
    </label>
  );
}
