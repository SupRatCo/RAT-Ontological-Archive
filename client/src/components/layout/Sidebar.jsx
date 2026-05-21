import AppIcon from "../ui/AppIcon";

export default function Sidebar({ projects, activeProjectId, onForum, onProject, onCreateProject }) {
  return (
    <aside className="roa-sidebar">
      <button className="roa-forum-button" type="button" onClick={onForum}>
        <AppIcon name="forum" size={28} />
        <span>FORUM</span>
      </button>
      <div className="roa-project-rail">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`roa-sidebar-project ${activeProjectId === project.id ? "active" : ""}`}
            type="button"
            onClick={() => onProject(project)}
            title={project.name}
          >
            {project.cover_url ? <img src={project.cover_url} alt="" /> : <AppIcon name="project" size={24} />}
            <span>{project.name}</span>
          </button>
        ))}
      </div>
      <button className="roa-sidebar-add" type="button" onClick={onCreateProject} aria-label="Crear proyecto">
        <AppIcon name="add" size={32} />
      </button>
    </aside>
  );
}
