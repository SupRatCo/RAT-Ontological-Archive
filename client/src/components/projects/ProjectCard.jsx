import Card from "../ui/Card";
import Button from "../ui/Button";

export default function ProjectCard({ project, onOpen }) {
  return (
    <Card>
      <h3>{project.name}</h3>
      <p>{project.description || "Sin descripción"}</p>
      <p>{project.documents_count || 0} Docs · {project.data_files_count || 0} Datos · {project.media_count || 0} Media</p>
      <Button onClick={() => onOpen(project)}>Abrir</Button>
    </Card>
  );
}
