import ProfileEditor from "../profile/ProfileEditor";
import AppIcon from "../ui/AppIcon";
import Button from "../ui/Button";

export default function AccountSettings({ user, onSaveProfile, onLogout }) {
  return (
    <div className="settings-section">
      <ProfileEditor user={user} onSave={onSaveProfile} />
      <Button variant="danger" onClick={onLogout}><AppIcon name="logout" size={18} />Cerrar sesion</Button>
    </div>
  );
}
