export default function AudioSettings({ settings, onChange }) {
  return (
    <div className="settings-section">
      <label>Volumen general
        <input type="range" min="0" max="100" value={settings.audio_volume ?? 50} onChange={(event) => onChange({ audio_volume: Number(event.target.value) })} />
      </label>
      <p>Sonidos UI y notificaciones quedan preparados para una fase posterior.</p>
    </div>
  );
}
