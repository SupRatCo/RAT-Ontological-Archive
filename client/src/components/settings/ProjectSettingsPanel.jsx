export default function ProjectSettingsPanel({ projects = [] }) {
  return (
    <div className="settings-section">
      {projects.map((project) => <p key={project.id}>{project.name} · {project.visibility}</p>)}
      {!projects.length && <p>No hay proyectos todavía.</p>}
    </div>
  );
}
