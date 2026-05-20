import ProjectDashboard from "../components/projects/ProjectDashboard";

export default function ProjectPage({ project, onModule }) {
  if (!project) return null;
  return <ProjectDashboard project={project} onModule={onModule} />;
}
