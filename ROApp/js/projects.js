(function () {
  const { UI, Storage } = window.ROA;

  async function createProject() {
    UI.openModal("Crear proyecto", `
      <form id="projectForm" class="form-grid one">
        <label class="field">Nombre del proyecto<input name="name" required></label>
        <label class="field">Descripcion<textarea name="description"></textarea></label>
        <label class="field">Visibilidad
          <select name="visibility">
            <option value="private">Privado</option>
            <option value="public">Publico</option>
          </select>
        </label>
        <div class="inline-actions">
          <button class="action" type="submit">Crear</button>
          <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    `, { size: "small" });
    document.querySelector("#projectForm").addEventListener("submit", (event) => {
      event.preventDefault();
      (async () => {
      const result = Object.fromEntries(new FormData(event.currentTarget).entries());
      const app = window.ROA.App;
      const user = window.ROA.Auth.currentUser();
      if (window.ROA.Api && window.ROA.Api.serverMode) {
        try {
          const response = await window.ROA.Api.createProject(result);
          const serverProject = response.project;
          const normalized = Storage.normalizeProject({
            id: serverProject.id,
            name: serverProject.name,
            description: serverProject.description,
            visibility: serverProject.visibility,
            ownerId: serverProject.ownerId,
            editors: serverProject.editors,
            readers: serverProject.readers,
            dashboardModules: serverProject.dashboardModules,
            createdAt: serverProject.createdAt,
            updatedAt: serverProject.updatedAt
          }, app.data);
          app.data.projects.push(normalized);
          app.data.activeProjectId = normalized.id;
          app.save();
          UI.closeModal();
          app.navigate("dashboard");
          UI.toast(`Proyecto ${normalized.name} creado.`);
          return;
        } catch (error) {
          UI.toast(error.message || "No se pudo crear el proyecto en servidor.");
        }
      }
      const project = Storage.normalizeProject({
        id: Storage.uid("project"),
        name: result.name,
        description: result.description,
        visibility: result.visibility === "public" ? "public" : "private",
        ownerId: user && user.id,
        editors: user ? [user.id] : [],
        readers: [],
        dashboardModules: Storage.coreDashboardModules(),
        createdAt: Storage.now(),
        updatedAt: Storage.now()
      }, app.data);
      app.data.projects.push(project);
      app.data.activeProjectId = project.id;
      if (user) user.projectIds = Array.from(new Set([...(user.projectIds || []), project.id]));
      app.save();
      UI.closeModal();
      app.navigate("dashboard");
      UI.toast(`Proyecto ${project.name} creado.`);
      })();
    });
  }

  function selectProject(projectId) {
    const app = window.ROA.App;
    const project = app.data.projects.find((item) => item.id === projectId);
    if (!project) return;
    app.data.activeProjectId = projectId;
    app.save();
    app.navigate("dashboard");
    window.ROA.Settings.playSound("open");
  }

  async function deleteProject(projectId) {
    const app = window.ROA.App;
    const project = projectId ? app.data.projects.find((item) => item.id === projectId) : UI.currentProject();
    if (!project) {
      UI.toast("No hay proyecto activo.");
      return;
    }
    if (!window.ROA.Permissions.canManageProject(project)) {
      UI.toast("Solo el creador puede eliminar este proyecto.");
      return;
    }
    const first = await UI.confirm("Eliminar proyecto", `Seguro que quieres eliminar "${project.name}"?`, "Continuar", true);
    if (!first) return;
    const second = await UI.promptFields("Confirmacion requerida", [
      { name: "name", label: `Escribe exactamente: ${project.name}`, required: true }
    ], "Eliminar");
    if (second.name !== project.name) {
      UI.toast("El nombre no coincide. El proyecto sigue intacto.");
      return;
    }
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try { await window.ROA.Api.deleteProject(project.id); } catch (error) { UI.toast(error.message); return; }
    }
    app.data.projects = app.data.projects.filter((item) => item.id !== project.id);
    if (app.data.activeProjectId === project.id) app.data.activeProjectId = null;
    app.save();
    app.navigate("welcome");
    UI.toast("Proyecto eliminado.");
  }

  function exportProject(projectId) {
    const app = window.ROA.App;
    const project = projectId ? app.data.projects.find((item) => item.id === projectId) : UI.currentProject();
    if (!project) {
      UI.toast("No hay proyecto activo para exportar.");
      return;
    }
    const fileName = `${project.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") || "project"}-roa.json`;
    Storage.download(fileName, Storage.exportProject(project.id, app.data));
    UI.toast("Proyecto exportado.");
  }

  function importProjectFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        window.ROA.App.data = Storage.importProject(reader.result, window.ROA.App.data);
        window.ROA.App.render();
        UI.toast("Proyecto importado.");
      } catch (error) {
        UI.toast("No se pudo importar el proyecto.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  }

  function appInfo() {
    UI.openModal("Informacion de R.O.A.", `
      <section class="panel">
        <h3>RAT Ontological Archive</h3>
        <p>Aplicacion local/offline para organizar proyectos narrativos, worldbuilding, personajes, mundos, organizaciones, ideas, etiquetas y archivos enlazados.</p>
        <p class="meta">Version de datos: 1. Guardado en localStorage.</p>
      </section>
    `, { size: "small" });
  }

  function renderDashboard() {
    const project = UI.currentProject();
    if (!project) {
      UI.renderWelcome();
      return;
    }
    if (!window.ROA.Permissions.hasProjectAccess(project, (window.ROA.Auth.currentUser() || {}).id)) {
      window.ROA.Permissions.accessScreen(project);
      return;
    }
    const canEdit = window.ROA.Permissions.canEdit(project);
    const role = window.ROA.Permissions.roleFor(project, (window.ROA.Auth.currentUser() || {}).id);
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div>
          <h1>${UI.escape(project.name)}</h1>
          <p>${UI.escape(project.description || "Proyecto narrativo sin descripcion.")}</p>
          <span class="pill-mini">${UI.escape(project.visibility || "private")} / rol: ${UI.escape(role)}</span>
        </div>
        <div class="toolbar">
          <button class="action" type="button" data-action="open-search">Buscar</button>
          ${canEdit ? `<button class="ghost-action" type="button" data-action="customize-dashboard">Personalizar Dashboard</button>` : ""}
          ${canEdit ? `<button class="ghost-action" type="button" data-action="create-section">Nueva seccion</button>` : ""}
          ${canEdit ? `<button class="ghost-action" type="button" data-action="create-file">Nuevo archivo</button>` : ""}
        </div>
      </section>
      <section class="dashboard-grid">
        ${window.ROA.Dashboard.renderCards(project)}
      </section>
    `;
  }

  function toggleProjectVisibility(projectId) {
    const app = window.ROA.App;
    const project = app.data.projects.find((item) => item.id === projectId);
    if (!project || !window.ROA.Permissions.canManageProject(project)) {
      UI.toast("Solo el creador puede cambiar la visibilidad.");
      return;
    }
    project.visibility = project.visibility === "public" ? "private" : "public";
    project.updatedAt = Storage.now();
    app.save();
    window.ROA.Settings.openSettings();
  }

  window.ROA.Projects = {
    createProject,
    selectProject,
    deleteProject,
    exportProject,
    importProjectFile,
    appInfo,
    renderDashboard,
    toggleProjectVisibility
  };
})();
