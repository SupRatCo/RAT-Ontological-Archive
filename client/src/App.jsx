import { useCallback, useEffect, useMemo, useState } from "react";
import { loginUser, logoutUser, registerUser, subscribeToAuthState } from "./services/authService";
import { createProject as createProjectRecord, getUserProjects } from "./services/projectService";
import { createPost as createForumPost } from "./services/forumService";
import { updateMe } from "./services/userService";
import { updateSettings } from "./services/settingsService";
import { AuthContext } from "./store/authStore";
import { ProjectContext } from "./store/projectStore";
import { UiContext } from "./store/uiStore";
import { getUiPrefs, setUiPrefs } from "./utils/storage";
import { LAST_PROJECT_KEY } from "./utils/constants";
import AppShell from "./components/layout/AppShell";
import AuthGuard from "./components/auth/AuthGuard";
import SettingsModal from "./components/settings/SettingsModal";
import FriendsModal from "./components/social/FriendsModal";
import ProjectCreateModal from "./components/projects/ProjectCreateModal";
import ForumComposer from "./components/forum/ForumComposer";
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
  const [initError, setInitError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [publishProjectOpen, setPublishProjectOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toastItem) => toastItem.id !== id)), 4200);
  }, []);

  async function loadProjects() {
    const data = await getUserProjects();
    const nextProjects = data.projects || [];
    setProjects(nextProjects);
    const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
    const project = nextProjects.find((item) => item.id === lastProjectId);
    if (project) {
      setActiveProject(project);
      return nextProjects;
    }
    if (lastProjectId) {
      localStorage.removeItem(LAST_PROJECT_KEY);
      setActiveProject(null);
      setView("forum");
    }
    return nextProjects;
  }

  useEffect(() => {
    let unsubscribed = false;
    let unsubscribe = () => {};
    unsubscribe = subscribeToAuthState(async (nextUser) => {
      if (unsubscribed) return;
      setInitError("");
      try {
        setUser(nextUser);
        setSettings(nextUser?.settings || getUiPrefs());
        if (nextUser) {
          try {
            await loadProjects();
          } catch (error) {
            console.error("[ROA Init] Failed loading projects", error);
            setProjects([]);
            setActiveProject(null);
            localStorage.removeItem(LAST_PROJECT_KEY);
            setView("forum");
            setInitError("No se pudieron cargar tus proyectos por permisos. Puedes reintentar o cerrar sesión.");
          }
        } else {
          setProjects([]);
          setActiveProject(null);
          setView("forum");
        }
      } catch (error) {
        console.error("[ROA Init] Initialization failed", error);
        setInitError(error.message || "No se pudo inicializar RAT Ontological Archive.");
      } finally {
        if (unsubscribed) return;
        setBooting(false);
      }
    }, (error) => {
      if (unsubscribed) return;
      console.error("[ROA Init] Initialization failed", error);
      setInitError(error.message || "No se pudo restaurar la sesión.");
      setBooting(false);
    });
    return () => {
      unsubscribed = true;
      unsubscribe();
    };
  }, [toast]);

  useEffect(() => {
    const themeColor = settings.themeColor || settings.theme_color || "gold";
    const visualMode = settings.visualMode || settings.visual_mode || "dark";
    const reducedMotion = Boolean(settings.reducedMotion ?? settings.reduced_motion ?? true);
    document.documentElement.dataset.themeColor = themeColor;
    document.documentElement.dataset.visualMode = visualMode;
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [settings]);

  const authValue = useMemo(() => ({
    user,
    async login(payload) {
      const data = await loginUser(payload);
      setUser(data.user);
      setSettings(data.user?.settings || {});
      setInitError("");
      try {
        await loadProjects();
      } catch (error) {
        console.error("[ROA Init] Failed loading projects", error);
        setInitError("Sesión iniciada, pero no se pudieron cargar tus proyectos por permisos.");
      }
      toast(`Bienvenido, ${data.user.username}.`);
    },
    async register(payload) {
      const data = await registerUser(payload);
      setUser(data.user);
      setSettings(data.user?.settings || {});
      setInitError("");
      try {
        await loadProjects();
      } catch (error) {
        console.error("[ROA Init] Failed loading projects", error);
        setInitError("Cuenta creada, pero no se pudieron cargar tus proyectos por permisos.");
      }
      toast(`Cuenta creada, ${data.user.username}.`);
    },
    async logout() {
      try {
        await logoutUser();
      } finally {
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
    const data = await createProjectRecord(payload);
    setProjects((current) => [data.project, ...current]);
    setActiveProject(data.project);
    localStorage.setItem(LAST_PROJECT_KEY, data.project.id);
    setView("project");
    setCreateProjectOpen(false);
    toast("Proyecto creado.");
  }

  async function publishProject(payload) {
    if (!activeProject) return;
    const data = await createForumPost({
      ...payload,
      type: "project",
      sourceType: "project",
      sourceProjectId: activeProject.id,
      coverUrl: activeProject.coverUrl || activeProject.cover_url || "",
      content_html: payload.content_html || payload.summary || activeProject.description || activeProject.name
    });
    setPublishProjectOpen(false);
    toast(`Proyecto publicado: ${data.post.title}`);
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
      await updateSettings(payload);
    } catch (error) {
      toast(error.message);
    }
  }

  async function saveProfile(payload) {
    const data = await updateMe(payload);
    setUser(data.user);
    toast("Perfil actualizado.");
  }

  function renderView() {
    if (view === "profile") return <ProfilePage user={user} />;
    if (view === "project") return activeProject ? <ProjectPage project={activeProject} onModule={setView} onPublishProject={() => setPublishProjectOpen(true)} /> : <HomePage onCreateProject={() => setCreateProjectOpen(true)} />;
    if (view === "docs") return <DocumentPage project={activeProject} toast={toast} />;
    if (view === "data") return <DataFilePage project={activeProject} toast={toast} />;
    if (view === "gallery") return <GalleryPage project={activeProject} toast={toast} />;
    return <ForumPage toast={toast} />;
  }

  if (booting) return <div className="roa-app auth-page"><div className="roa-panel">Inicializando archivo...</div></div>;

  if (initError) {
    return (
      <div className="roa-app auth-page">
        <div className="roa-panel auth-card">
          <p className="eyebrow">ROA INIT</p>
          <h1>No se pudo cargar el archivo</h1>
          <p>{initError}</p>
          <div className="actions-row">
            <button className="roa-btn primary" type="button" onClick={() => window.location.reload()}>
              Reintentar
            </button>
            <button className="roa-btn" type="button" onClick={async () => {
              try {
                await logoutUser();
              } finally {
                setUser(null);
                setProjects([]);
                setActiveProject(null);
                setInitError("");
                setView("forum");
              }
            }}>
              Cerrar sesión
            </button>
            <button className="roa-btn" type="button" onClick={() => {
              localStorage.removeItem(LAST_PROJECT_KEY);
              setInitError("");
              setView("forum");
              window.location.reload();
            }}>
              Limpiar datos locales
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {publishProjectOpen && activeProject && (
              <ForumComposer
                title="Publicar proyecto"
                submitLabel="Publicar proyecto"
                initial={{
                  title: activeProject.name || "",
                  summary: activeProject.description || "",
                  content_html: activeProject.description || activeProject.name || ""
                }}
                onClose={() => setPublishProjectOpen(false)}
                onPublish={publishProject}
              />
            )}
          </AuthGuard>
          <ToastList toasts={toasts} />
        </UiContext.Provider>
      </ProjectContext.Provider>
    </AuthContext.Provider>
  );
}
