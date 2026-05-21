import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import { formatDate } from "../../utils/formatDate";
import { stripHtml } from "../../utils/sanitize";

export default function DocumentList({ documents = [], onOpen, onCreate, onDelete }) {
  return (
    <section className="roa-panel">
      <div className="list-header">
        <h2 className="roa-panel-title">Documentos</h2>
        <Button variant="primary" onClick={onCreate}><AppIcon name="add" />Documento</Button>
      </div>
      {documents.length ? (
        <div className="compact-grid">
          {documents.map((doc) => (
            <Card key={doc.id} className="compact-card">
              <div className="compact-card-heading">
                <AppIcon name="document" size={30} />
                <div>
                  <h3>{doc.title}</h3>
                  <span>{formatDate(doc.updated_at || doc.updatedAt || doc.created_at || doc.createdAt)}</span>
                </div>
              </div>
              <p>{stripHtml(doc.content_html || doc.contentHtml || "").slice(0, 120) || "Documento sin contenido."}</p>
              <div className="actions-row">
                <Button onClick={() => onOpen(doc)}>Abrir</Button>
                <Button variant="danger" onClick={() => onDelete(doc)}><AppIcon name="delete" size={16} />Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="NO DOCS" kicker="/YET/" message="Escribe capitulos, escenas o lore." actionLabel="Crear documento" onAction={onCreate} />
      )}
    </section>
  );
}
