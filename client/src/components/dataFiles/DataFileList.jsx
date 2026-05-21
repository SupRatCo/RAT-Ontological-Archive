import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import { formatDate } from "../../utils/formatDate";

export default function DataFileList({ dataFiles = [], onOpen, onCreate }) {
  return (
    <section className="roa-panel">
      <div className="list-header">
        <h2 className="roa-panel-title">Archivos de Datos</h2>
        <Button variant="primary" onClick={onCreate}><AppIcon name="add" />Archivo de Datos</Button>
      </div>
      {dataFiles.length ? (
        <div className="compact-grid">
          {dataFiles.map((file) => (
            <Card key={file.id} className="compact-card">
              <div className="compact-card-heading">
                <AppIcon name="data" size={30} />
                <div>
                  <h3>{file.title}</h3>
                  <span>{formatDate(file.updated_at || file.updatedAt || file.created_at || file.createdAt)}</span>
                </div>
              </div>
              {file.description && <p>{file.description}</p>}
              <Button onClick={() => onOpen(file)}>Abrir</Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="NO DATA" kicker="/YET/" message="Crea fichas flexibles para personajes, mundos u objetos." actionLabel="Crear Archivo de Datos" onAction={onCreate} />
      )}
    </section>
  );
}
