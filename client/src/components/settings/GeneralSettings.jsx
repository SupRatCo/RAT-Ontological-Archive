import Select from "../ui/Select";

export default function GeneralSettings({ settings, onChange }) {
  return (
    <div className="settings-section">
      <label>Idioma
        <Select value={settings.language || "es-LATAM"} onChange={(event) => onChange({ language: event.target.value })}>
          <option value="es-LATAM">Español LATAM</option>
          <option value="es-ES">Español España</option>
          <option value="en">English</option>
          <option value="pt-BR">Português</option>
        </Select>
      </label>
    </div>
  );
}
