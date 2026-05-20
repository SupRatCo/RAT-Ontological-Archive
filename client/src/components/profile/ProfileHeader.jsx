export default function ProfileHeader({ user }) {
  const profile = user?.profile || user || {};
  const name = profile.display_name || user?.username || "Usuario";
  return (
    <section>
      <div className="profile-banner" style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})`, backgroundSize: "cover" } : undefined} />
      <div className="profile-header">
        <div className="roa-avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="roa-panel-title">{name}</h1>
          <p>{profile.bio || "Sin bio todavía."}</p>
        </div>
      </div>
    </section>
  );
}
