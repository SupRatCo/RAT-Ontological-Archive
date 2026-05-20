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
        RAT<br />Ontological<br />Archive
      </button>
      <div className="roa-top-actions">
        <IconButton label="Configuración" onClick={onSettings}>⚙</IconButton>
        <IconButton label="Social" onClick={onSocial}>👥</IconButton>
      </div>
      <label className="roa-global-search">
        <span aria-hidden="true" style={{ fontSize: 36 }}>⌕</span>
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar" />
      </label>
      <button className="roa-btn" onClick={onProfile} type="button">
        {user?.profile?.display_name || user?.username || "USERNAME"}
      </button>
      <button className="roa-user-chip" onClick={onProfile} type="button">
        <Avatar user={user} />
      </button>
    </header>
  );
}
