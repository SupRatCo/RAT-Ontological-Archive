import ProfileHeader from "../components/profile/ProfileHeader";
import Panel from "../components/ui/Panel";

export default function ProfilePage({ user }) {
  return (
    <Panel title="Perfil">
      <ProfileHeader user={user} />
    </Panel>
  );
}
