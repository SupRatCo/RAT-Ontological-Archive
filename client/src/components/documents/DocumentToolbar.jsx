import Button from "../ui/Button";

export default function DocumentToolbar({ onCommand, onSave, onPublish, status }) {
  const commands = [
    ["bold", "B"],
    ["italic", "I"],
    ["underline", "U"],
    ["strikeThrough", "S"],
    ["formatBlock", "Título", "h2"],
    ["insertUnorderedList", "Lista"],
    ["insertOrderedList", "1."],
    ["justifyLeft", "Izq"],
    ["justifyCenter", "Centro"],
    ["justifyRight", "Der"]
  ];

  return (
    <div className="docs-toolbar">
      <Button variant="primary" onClick={onSave}>Guardar</Button>
      {commands.map(([command, label, value]) => (
        <Button key={`${command}-${label}`} onClick={() => onCommand(command, value)}>{label}</Button>
      ))}
      <Button onClick={() => onCommand("insertHorizontalRule")}>HR</Button>
      <Button onClick={onPublish}>Publicar</Button>
      <span style={{ marginLeft: "auto", color: "var(--roa-muted)" }}>{status}</span>
    </div>
  );
}
