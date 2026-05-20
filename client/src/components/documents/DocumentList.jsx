import Card from "../ui/Card";
import Button from "../ui/Button";

export default function DocumentList({ documents = [], onOpen, onCreate }) {
  return (
    <section className="roa-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 className="roa-panel-title">Documentos</h2>
        <Button variant="primary" onClick={onCreate}>+ Documento</Button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {documents.map((doc) => (
          <Card key={doc.id}>
            <h3>{doc.title}</h3>
            <Button onClick={() => onOpen(doc)}>Abrir</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
