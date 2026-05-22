import AppIcon from "../ui/AppIcon";
import IconButton from "../ui/IconButton";

function Avatar({ user }) {
  const avatar = user?.profile?.avatar_url;
  const name = user?.profile?.display_name || user?.username || "U";
  return (
    <div className="roa-avatar">
      {avatar ? <img src={avatar} alt="" /> : name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function Topbar({ user, onForum, onSettings, onSocial, onProfile, search, onSearch }) {
  return (
    <header className="roa-topbar">
      <button className="roa-logo" onClick={onForum} type="button">
        <span className="roa-logo-mark">R</span>
        <span className="roa-logo-text">
          <strong>RAT ONTOLOGICAL</strong>
          <span>ARCHIVE</span>
        </span>
      </button>
      <div className="roa-top-actions">
        <IconButton label="Configuracion" onClick={onSettings}><AppIcon name="settings" size={25} /></IconButton>
        <IconButton label="Social" onClick={onSocial}><AppIcon name="social" size={25} /></IconButton>
      </div>
      <label className="roa-global-search">
        <AppIcon name="search" size={36} />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar" />
      </label>
      <button className="roa-btn" onClick={onProfile} type="button">
        {user?.profile?.display_name || user?.username || "USERNAME"}
      </button>
      <button className="roa-user-chip" onClick={onProfile} type="button" aria-label="Perfil">
        <Avatar user={user} />
      </button>
    </header>
  );
}
