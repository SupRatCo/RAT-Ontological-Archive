import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi } from "./api/auth.api";
import { projectsApi } from "./api/projects.api";
import { usersApi } from "./api/users.api";
import { settingsApi } from "./api/settings.api";
import { AuthContext } from "./store/authStore";
import { ProjectContext } from "./store/projectStore";
import { UiContext } from "./store/uiStore";
import { setToken, clearToken, getToken, getUiPrefs, setUiPrefs } from "./utils/storage";
import { LAST_PROJECT_KEY } from "./utils/constants";
import AppShell from "./components/layout/AppShell";
import AuthGuard from "./components/auth/AuthGuard";
import SettingsModal from "./components/settings/SettingsModal";
import FriendsModal from "./components/social/FriendsModal";
import ProjectCreateModal from "./components/projects/ProjectCreateModal";
import { ToastList } from "./components/ui/Toast";
import HomePage from "./pages/HomePage";
import ForumPage from "./pages/ForumPage";
import ProjectPage from "./pages/ProjectPage";
import DocumentPage from "./pages/DocumentPage";
import DataFilePage from "./pages/DataFilePage";
import GalleryPage from "./pages/GalleryPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(getUiPrefs());
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [view, setView] = useState("forum");
  const [search, setSearch] = useState("");
  const [booting, setBooting] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toastItem) => toastItem.id !== id)), 4200);
  }, []);

  async function loadProjects() {
    const data = await projectsApi.list();
    setProjects(data.projects || []);
    const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
    const project = (data.projects || []).find((item) => item.id === lastProjectId);
    if (project) setActiveProject(project);
  }

  useEffect(() => {
    async function boot() {
      if (!getToken()) {
        setBooting(false);
        return;
      }
      try {
        const data = await authApi.me();
        setUser(data.user);
        setSettings(data.user?.settings || getUiPrefs());
        await loadProjects();
      } catch (_error) {
        clearToken();
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  const authValue = useMemo(() => ({
    user,
    async login(payload) {
      const data = await authApi.login(payload);
      setToken(data.token);
      setUser(data.user);
      setSettings(data.user?.settings || {});
      await loadProjects();
      toast(`Bienvenido, ${data.user.username}.`);
    },
    async register(payload) {
      const data = await authApi.register(payload);
      setToken(data.token);
      setUser(data.user);
      setSettings(data.user?.settings || {});
      await loadProjects();
      toast(`Cuenta creada, ${data.user.username}.`);
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        clearToken();
        setUser(null);
        setProjects([]);
        setActiveProject(null);
        setView("forum");
      }
    }
  }), [user, toast]);

  const projectValue = useMemo(() => ({ projects, activeProject, setActiveProject }), [projects, activeProject]);
  const uiValue = useMemo(() => ({ toast, view, setView }), [toast, view]);

  async function createProject(payload) {
    const data = await projectsApi.create(payload);
    setProjects((current) => [data.project, ...current]);
    setActiveProject(data.project);
    localStorage.setItem(LAST_PROJECT_KEY, data.project.id);
    setView("project");
    setCreateProjectOpen(false);
    toast("Proyecto creado.");
  }

  function openProject(project) {
    setActiveProject(project);
    localStorage.setItem(LAST_PROJECT_KEY, project.id);
    setView("project");
  }

  async function changeSettings(payload) {
    const next = { ...settings, ...payload };
    setSettings(next);
    setUiPrefs(next);
    try {
      await settingsApi.update(payload);
    } catch (error) {
      toast(error.message);
    }
  }

  async function saveProfile(payload) {
    const data = await usersApi.updateMe(payload);
    setUser(data.user);
    toast("Perfil actualizado.");
  }

  function renderView() {
    if (view === "profile") return <ProfilePage user={user} />;
    if (view === "project") return activeProject ? <ProjectPage project={activeProject} onModule={setView} /> : <HomePage onCreateProject={() => setCreateProjectOpen(true)} />;
    if (view === "docs") return <DocumentPage project={activeProject} toast={toast} />;
    if (view === "data") return <DataFilePage project={activeProject} toast={toast} />;
    if (view === "gallery") return <GalleryPage project={activeProject} toast={toast} />;
    return <ForumPage toast={toast} />;
  }

  if (booting) return <div className="roa-app auth-page"><div className="roa-panel">Inicializando archivo...</div></div>;

  return (
    <AuthContext.Provider value={authValue}>
      <ProjectContext.Provider value={projectValue}>
        <UiContext.Provider value={uiValue}>
          <AuthGuard user={user}>
            <AppShell
              user={user}
              projects={projects}
              activeProjectId={activeProject?.id}
              search={search}
              onSearch={setSearch}
              onForum={() => setView("forum")}
              onSettings={() => setSettingsOpen(true)}
              onSocial={() => setSocialOpen(true)}
              onProfile={() => setView("profile")}
              onProject={openProject}
              onCreateProject={() => setCreateProjectOpen(true)}
            >
              {renderView()}
            </AppShell>
            {settingsOpen && (
              <SettingsModal
                user={user}
                settings={settings}
                projects={projects}
                onClose={() => setSettingsOpen(false)}
                onChangeSettings={changeSettings}
                onSaveProfile={saveProfile}
                onLogout={authValue.logout}
              />
            )}
            {socialOpen && <FriendsModal onClose={() => setSocialOpen(false)} />}
            {createProjectOpen && <ProjectCreateModal onClose={() => setCreateProjectOpen(false)} onCreate={createProject} />}
          </AuthGuard>
          <ToastList toasts={toasts} />
        </UiContext.Provider>
      </ProjectContext.Provider>
    </AuthContext.Provider>
  );
}
