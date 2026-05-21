import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";

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
              <AppIcon name="document" size={30} />
              <h3>{doc.title}</h3>
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
