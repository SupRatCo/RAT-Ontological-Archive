import Select from "../ui/Select";

const themeColors = [
  ["gold", "Dorado"],
  ["purple", "Morado"],
  ["blue", "Azul"],
  ["cyan", "Celeste"],
  ["red", "Rojo"],
  ["green", "Verde"]
];

export default function VideoSettings({ settings, onChange }) {
  const themeColor = settings.themeColor || settings.theme_color || "gold";
  const visualMode = settings.visualMode || settings.visual_mode || "dark";
  const reducedMotion = Boolean(settings.reducedMotion ?? settings.reduced_motion ?? true);

  return (
    <div className="settings-section">
      <label>Tema de color
        <Select value={themeColor} onChange={(event) => onChange({ themeColor: event.target.value, theme_color: event.target.value })}>
          {themeColors.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </label>
      <label>Modo visual
        <Select value={visualMode} onChange={(event) => onChange({ visualMode: event.target.value, visual_mode: event.target.value })}>
          <option value="dark">Oscuro</option>
          <option value="light">Claro</option>
        </Select>
      </label>
      <label>Calidad visual
        <Select value={settings.visualQuality || settings.visual_quality || "medium"} onChange={(event) => onChange({ visualQuality: event.target.value, visual_quality: event.target.value })}>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
          <option value="ultra-low">Ultra baja</option>
        </Select>
      </label>
      <label className="settings-check">
        <input type="checkbox" checked={reducedMotion} onChange={(event) => onChange({ reducedMotion: event.target.checked, reduced_motion: event.target.checked })} />
        Reducir animaciones
      </label>
    </div>
  );
}
