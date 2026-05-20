import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import MainPanel from "./MainPanel";

export default function AppShell({ user, projects, activeProjectId, search, onSearch, onForum, onSettings, onSocial, onProfile, onProject, onCreateProject, children }) {
  return (
    <div className="roa-app">
      <div className="roa-shell">
        <Topbar
          user={user}
          search={search}
          onSearch={onSearch}
          onForum={onForum}
          onSettings={onSettings}
          onSocial={onSocial}
          onProfile={onProfile}
        />
        <div className="roa-main-grid">
          <Sidebar projects={projects} activeProjectId={activeProjectId} onForum={onForum} onProject={onProject} onCreateProject={onCreateProject} />
          <MainPanel>{children}</MainPanel>
        </div>
      </div>
    </div>
  );
}
