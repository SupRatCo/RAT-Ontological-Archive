import { useState } from "react";
import Modal from "../ui/Modal";
import GeneralSettings from "./GeneralSettings";
import AccountSettings from "./AccountSettings";
import VideoSettings from "./VideoSettings";
import AudioSettings from "./AudioSettings";
import DataSettings from "./DataSettings";
import ProjectSettingsPanel from "./ProjectSettingsPanel";
import AppIcon from "../ui/AppIcon";

const tabs = [
  { value: "general", label: "General", icon: "settings" },
  { value: "account", label: "Cuenta", icon: "user" },
  { value: "video", label: "Video", icon: "video" },
  { value: "audio", label: "Audio", icon: "audio" },
  { value: "data", label: "Datos", icon: "data" },
  { value: "projects", label: "Proyectos", icon: "project" },
  { value: "security", label: "Seguridad", icon: "security" }
];

export default function SettingsModal({ user, settings, projects, onClose, onChangeSettings, onSaveProfile, onLogout }) {
  const [tab, setTab] = useState("general");

  return (
    <Modal title="CONFIGURACION" onClose={onClose}>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Secciones de configuracion">
          {tabs.map((item) => (
            <button key={item.value} className={`settings-nav-item ${tab === item.value ? "active" : ""}`} type="button" onClick={() => setTab(item.value)}>
              <AppIcon name={item.icon} size={18} />
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
