import Card from "../ui/Card";
import Button from "../ui/Button";

const modules = [
  ["Documentos", "docs"],
  ["Archivos de Datos", "data"],
  ["Galería", "gallery"],
  ["Etiquetas", "tags"],
  ["Colaboradores", "members"],
  ["Favoritos", "favorites"],
  ["Papelera", "trash"],
  ["Configuración", "settings"]
];

export default function ProjectDashboard({ project, onModule }) {
  return (
    <section className="roa-panel">
      <h1 className="roa-panel-title">{project.name}</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {modules.map(([title, value]) => (
          <Card key={value}>
            <h3>{title}</h3>
            <Button onClick={() => onModule(value)}>Abrir</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
