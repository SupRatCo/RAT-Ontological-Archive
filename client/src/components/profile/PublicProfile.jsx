import Panel from "../ui/Panel";
import ProfileHeader from "./ProfileHeader";

export default function PublicProfile({ profile }) {
  return (
    <Panel title="Perfil público">
      <ProfileHeader user={profile?.user} />
    </Panel>
  );
}
