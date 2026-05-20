export default function Sidebar({ projects, activeProjectId, onForum, onProject, onCreateProject }) {
  return (
    <aside className="roa-sidebar">
      <button className="roa-forum-button" type="button" onClick={onForum}>FORUM</button>
      <div className="roa-project-rail">
        {projects.map((project) => (
          <button
            key={project.id}
            className={`roa-sidebar-project ${activeProjectId === project.id ? "active" : ""}`}
            type="button"
            onClick={() => onProject(project)}
            title={project.name}
          >
            {project.cover_url ? <img src={project.cover_url} alt="" /> : project.name.slice(0, 12)}
          </button>
        ))}
      </div>
      <button className="roa-sidebar-add" type="button" onClick={onCreateProject}>+</button>
    </aside>
  );
}
