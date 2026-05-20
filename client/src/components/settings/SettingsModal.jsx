import { useState } from "react";
import Modal from "../ui/Modal";
import Tabs from "../ui/Tabs";
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
    <Modal title="CONFIGURACIÓN" onClose={onClose}>
      <div className="settings-layout">
        <div className="settings-nav">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
        </div>
        <div className="roa-panel">
          {tab === "general" && <GeneralSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "account" && <AccountSettings user={user} onSaveProfile={onSaveProfile} onLogout={onLogout} />}
          {tab === "video" && <VideoSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "audio" && <AudioSettings settings={settings} onChange={onChangeSettings} />}
          {tab === "data" && <DataSettings />}
          {tab === "projects" && <ProjectSettingsPanel projects={projects} />}
          {tab === "security" && <p>Seguridad de cuenta y sesiones se ampliará con endpoints dedicados.</p>}
        </div>
      </div>
    </Modal>
  );
}
