import { useState } from "react";
import Modal from "../ui/Modal";
import GeneralSettings from "./GeneralSettings";
import AccountSettings from "./AccountSettings";
import VideoSettings from "./VideoSettings";
import AudioSettings from "./AudioSettings";
import DataSettings from "./DataSettings";
import ProjectSettingsPanel from "./ProjectSettingsPanel";

const tabs = [
  { value: "general", label: "General" },
  { value: "account", label: "Cuenta" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "data", label: "Datos" },
  { value: "projects", label: "Proyectos" },
  { value: "security", label: "Seguridad" }
];

export default function SettingsModal({ user, settings, projects, onClose, onChangeSettings, onSaveProfile, onLogout }) {
  const [tab, setTab] = useState("general");

  return (
    <Modal title="CONFIGURACION" onClose={onClose}>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Secciones de configuracion">
          {tabs.map((item) => (
            <button key={item.value} className={`settings-nav-item ${tab === item.value ? "active" : ""}`} type="button" onClick={() => setTab(item.value)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="settings-content">
          {tab === "general" && <GeneralSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "account" && <AccountSettings user={user} onSaveProfile={onSaveProfile} onLogout={onLogout} />}
          {tab === "video" && <VideoSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "audio" && <AudioSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "data" && <DataSettings />}
          {tab === "projects" && <ProjectSettingsPanel projects={projects} />}
          {tab === "security" && <p>Seguridad de cuenta y sesiones se ampliara con controles dedicados.</p>}
        </div>
      </div>
    </Modal>
  );
}
