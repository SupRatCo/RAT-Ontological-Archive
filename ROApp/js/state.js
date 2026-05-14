(function () {
  const state = {
    currentUser: null,
    activeProjectId: null,
    activeFileId: null,
    view: "welcome",
    pendingChanges: false,
    pendingFileId: null,
    lastSavedAt: null,
    saveStatus: "Guardado",
    cache: { projects: [], forumPosts: [] },
    pendingNavigation: null,
    listeners: [],
    autosaveTimer: null,

    subscribe(fn) {
      this.listeners.push(fn);
    },

    emit() {
      this.listeners.forEach((fn) => fn(this));
      this.updateSaveStatus();
    },

    markDirty(fileId) {
      this.pendingChanges = true;
      this.pendingFileId = fileId || this.pendingFileId;
      this.saveStatus = "Cambios sin guardar";
      this.emit();
    },

    markSaving() {
      this.saveStatus = "Guardando...";
      this.emit();
    },

    markSaved() {
      this.pendingChanges = false;
      this.pendingFileId = null;
      this.lastSavedAt = new Date();
      this.saveStatus = "Guardado";
      this.emit();
    },

    markError() {
      this.saveStatus = "Error al guardar";
      this.emit();
    },

    updateSaveStatus() {
      const node = document.querySelector("#saveStatus");
      if (node) node.textContent = this.saveStatus;
    },

    startAutosave() {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = setInterval(async () => {
        if (this.pendingChanges && this.pendingFileId && window.ROA.Files) {
          const ok = await window.ROA.Files.saveFile(this.pendingFileId, true);
          if (ok) {
            this.saveStatus = "Autoguardado hace menos de 1 min";
            this.emit();
          }
        }
      }, 60000);
    },

    updateProject(project) {
      const app = window.ROA.App;
      if (!app || !project) return;
      const index = app.data.projects.findIndex((item) => item.id === project.id);
      if (index >= 0) app.data.projects[index] = Object.assign(app.data.projects[index], project);
      else app.data.projects.push(project);
      app.save();
      app.render();
    },

    updateFile(fileId, data) {
      const project = window.ROA.UI.currentProject();
      if (!project) return;
      const index = project.files.findIndex((file) => file.id === fileId);
      if (index >= 0) project.files[index] = Object.assign(project.files[index], data);
      window.ROA.App.save();
      window.ROA.App.render();
    }
  };

  window.addEventListener("beforeunload", (event) => {
    if (!state.pendingChanges) return;
    event.preventDefault();
    event.returnValue = "Tienes cambios sin guardar. ¿Quieres salir de todos modos?";
  });

  window.ROA = window.ROA || {};
  window.ROA.State = state;
})();
