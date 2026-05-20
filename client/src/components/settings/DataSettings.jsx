import Button from "../ui/Button";
import useServerStatus from "../../hooks/useServerStatus";
import { API_URL, apiPath } from "../../api/apiClient";

export default function DataSettings() {
  const { status, test } = useServerStatus();
  return (
    <div className="settings-section">
      <p>Estado: {status.state}</p>
      <p>API URL: {API_URL}</p>
      <p>Health URL: {apiPath("/health")}</p>
      {status.latency && <p>Latencia: {status.latency}ms</p>}
      {status.error && <p style={{ color: "var(--roa-danger)" }}>{status.error}</p>}
      <Button onClick={() => test().catch(() => {})}>Probar conexión</Button>
      <p>localStorage se reserva solo para token y preferencias pequeñas.</p>
    </div>
  );
}
