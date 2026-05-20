import ProfileEditor from "../profile/ProfileEditor";
import Button from "../ui/Button";

export default function AccountSettings({ user, onSaveProfile, onLogout }) {
  return (
    <div className="settings-section">
      <ProfileEditor user={user} onSave={onSaveProfile} />
      <Button variant="danger" onClick={onLogout}>Cerrar sesión</Button>
    </div>
  );
}
