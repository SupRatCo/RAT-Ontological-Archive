import Select from "../ui/Select";

export default function VideoSettings({ settings, onChange }) {
  return (
    <div className="settings-section">
      <label>Calidad visual
        <Select value={settings.visual_quality || "medium"} onChange={(event) => onChange({ visual_quality: event.target.value })}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
          <option value="ultra-low">Ultra baja</option>
        </Select>
      </label>
      <label>
        <input type="checkbox" checked={Boolean(settings.reduced_motion ?? true)} onChange={(event) => onChange({ reduced_motion: event.target.checked })} />
        Reducir animaciones
      </label>
    </div>
  );
}
