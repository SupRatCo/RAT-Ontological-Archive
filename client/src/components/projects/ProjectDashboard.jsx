import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";

const modules = [
  ["Documentos", "docs", "document", "Escribe capitulos, notas y lore."],
  ["Archivos de Datos", "data", "data", "Fichas flexibles para tu mundo."],
  ["Galeria", "gallery", "gallery", "Imagenes y videos en Cloudinary."],
  ["Etiquetas", "tags", "tag", "Clasifica contenido."],
  ["Colaboradores", "members", "social", "Miembros y permisos."],
  ["Favoritos", "favorites", "bookmark", "Accesos guardados."],
  ["Papelera", "trash", "trash", "Contenido eliminado."],
  ["Configuracion", "settings", "settings", "Ajustes del proyecto."]
];

export default function ProjectDashboard({ project, onModule, onPublishProject }) {
  return (
    <section className="roa-panel project-dashboard">
      <p className="forum-kicker">PROJECT ARCHIVE</p>
      <h1 className="roa-panel-title">{project.name}</h1>
      {project.description && <p className="project-summary">{project.description}</p>}
      <div className="actions-row">
        <Button variant="primary" onClick={onPublishProject}><AppIcon name="forum" />Publicar proyecto</Button>
      </div>
      <div className="project-module-grid">
        {modules.map(([title, value, icon, description]) => (
          <Card key={value} className="project-module-card">
            <AppIcon name={icon} size={32} />
            <h3>{title}</h3>
            <p>{description}</p>
            <Button onClick={() => onModule(value)}>Abrir</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
