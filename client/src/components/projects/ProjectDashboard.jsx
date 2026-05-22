import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";

const modules = [
  ["Documentos", "docs", "document", "Capitulos, escenas, notas y textos narrativos", 12],
  ["Archivos de Datos", "data", "data", "Personajes, mundos, objetos y elementos de lore", 34],
  ["Galeria", "gallery", "gallery", "Imagenes, videos y recursos visuales", 8],
  ["Etiquetas", "tags", "tag", "Organiza y categoriza tu contenido", 15],
  ["Favoritos", "favorites", "bookmark", "Elementos marcados como importantes", 7],
  ["Papelera", "trash", "trash", "Elementos eliminados recientemente", 3],
  ["Colaboradores", "members", "social", "Miembros y permisos", 0],
  ["Configuracion", "settings", "settings", "Ajustes del proyecto", 0]
];

export default function ProjectDashboard({ project, onModule, onPublishProject }) {
  return (
    <section className="roa-panel project-dashboard">
      <div className="project-hero">
        <div className="project-cover">
          {project.cover_url ? <img src={project.cover_url} alt="" /> : <AppIcon name="project" size={48} />}
        </div>
        <div className="project-hero-copy">
          <p className="forum-kicker">PROJECT ARCHIVE</p>
          <h1 className="roa-panel-title">{project.name}</h1>
          {project.description && <p className="project-summary">{project.description}</p>}
          <div className="actions-row">
            <Button onClick={() => onModule("settings")}><AppIcon name="settings" />Editar</Button>
            <Button variant="primary" onClick={onPublishProject}><AppIcon name="forum" />Publicar proyecto</Button>
          </div>
        </div>
      </div>
      <h2 className="project-content-title">CONTENIDO DEL PROYECTO</h2>
      <div className="project-module-grid">
        {modules.map(([title, value, icon, description, count]) => (
          <Card key={value} className="project-module-card">
            <div className="project-card-top">
              <span className="project-card-icon"><AppIcon name={icon} size={32} /></span>
              {count > 0 && <strong>{count}</strong>}
            </div>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
            <Button onClick={() => onModule(value)}>Abrir</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
