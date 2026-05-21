import Button from "../ui/Button";
import useServerStatus from "../../hooks/useServerStatus";
import { getDataDiagnostics } from "../../services/settingsService";

export default function DataSettings() {
  const { status, test } = useServerStatus();
  const diagnostics = getDataDiagnostics();

  return (
    <div className="settings-section">
      <p>Estado: {status.state}</p>
      <p>Auth: {diagnostics.auth}</p>
      <p>Database: {diagnostics.database}</p>
      <p>Media: {diagnostics.media} ({status.cloudinary || "checking"})</p>
      <p>Firebase Storage: {diagnostics.firebaseStorage}</p>
      <p>Backend Express: {diagnostics.backend}</p>
      {status.latency && <p>Latencia: {status.latency}ms</p>}
      {status.error && <p style={{ color: "var(--roa-danger)" }}>{status.error}</p>}
      <Button onClick={() => test().catch(() => {})}>Probar configuracion</Button>
      <p>localStorage se reserva solo para preferencias pequenas y el ultimo proyecto abierto.</p>
    </div>
  );
}
