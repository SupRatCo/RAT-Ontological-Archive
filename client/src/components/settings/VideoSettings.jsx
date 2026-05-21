import Select from "../ui/Select";
import AppIcon from "../ui/AppIcon";

const themeColors = [
  ["gold", "Dorado", "#ffd800"],
  ["purple", "Morado", "#9b5cff"],
  ["blue", "Azul", "#277cff"],
  ["cyan", "Celeste", "#31d6ff"],
  ["red", "Rojo", "#ff3f4f"],
  ["green", "Verde", "#36ff88"]
];

export default function VideoSettings({ settings, onChange }) {
  const themeColor = settings.themeColor || settings.theme_color || "gold";
  const visualMode = settings.visualMode || settings.visual_mode || "dark";
  const reducedMotion = Boolean(settings.reducedMotion ?? settings.reduced_motion ?? true);

  return (
    <div className="settings-section">
      <div className="settings-section-title">
        <AppIcon name="video" size={24} />
        <div>
          <h3>Configuración visual</h3>
          <p>Color, contraste y rendimiento de la interfaz.</p>
        </div>
      </div>

      <div className="settings-option-group">
        <span className="settings-option-label">Tema de color</span>
        <div className="theme-swatch-grid">
          {themeColors.map(([value, label, color]) => (
            <button
              key={value}
              className={`theme-swatch ${themeColor === value ? "active" : ""}`}
              type="button"
              onClick={() => onChange({ themeColor: value, theme_color: value })}
            >
              <span className="theme-swatch-dot" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-option-group">
        <span className="settings-option-label">Modo visual</span>
        <div className="segmented-control">
          <button className={visualMode === "dark" ? "active" : ""} type="button" onClick={() => onChange({ visualMode: "dark", visual_mode: "dark" })}>Oscuro</button>
          <button className={visualMode === "light" ? "active" : ""} type="button" onClick={() => onChange({ visualMode: "light", visual_mode: "light" })}>Claro</button>
        </div>
      </div>

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
