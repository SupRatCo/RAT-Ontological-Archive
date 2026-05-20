import Card from "../ui/Card";
import Button from "../ui/Button";

export default function DataFileList({ dataFiles = [], onOpen, onCreate }) {
  return (
    <section className="roa-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h2 className="roa-panel-title">Archivos de Datos</h2>
        <Button variant="primary" onClick={onCreate}>+ Archivo de Datos</Button>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {dataFiles.map((file) => (
          <Card key={file.id}>
            <h3>{file.title}</h3>
            <p>{file.description}</p>
            <Button onClick={() => onOpen(file)}>Abrir</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
