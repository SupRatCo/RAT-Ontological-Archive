(function () {
  const { UI, Storage } = window.ROA;

  const App = {
    data: null,
    view: { name: "dashboard", params: {} },

    init() {
      this.data = Storage.loadAppData();
      this.save();
      this.bindEvents();
      window.ROA.State.startAutosave();
      if (!this.data.currentUserId) {
        window.ROA.Auth.showLogin();
      } else {
        window.ROA.Auth.hideLogin();
        this.render();
      }
    },

    save() {
      this.data = Storage.saveAppData(this.data);
      UI.renderShell();
    },

    navigate(name, params) {
      if (window.ROA.State.pendingChanges && this.view.name === "file" && name !== "file") {
        window.ROA.State.pendingNavigation = { name, params: params || {} };
        UI.openModal("Cambios sin guardar", `
          <p>Tienes cambios sin guardar. ¿Quieres salir de todos modos?</p>
          <div class="inline-actions">
            <button class="action" type="button" data-action="save-and-leave">Guardar y salir</button>
            <button class="danger-action" type="button" data-action="leave-without-save">Salir sin guardar</button>
            <button class="ghost-action" type="button" data-action="cancel-navigation">Cancelar</button>
          </div>
        `, { size: "small" });
        return;
      }
      this.view = { name, params: params || {} };
      this.render();
    },

    render() {
      UI.renderShell();
      if (!this.data.currentUserId) return;
      const project = UI.currentProject();
      if (!project && !["welcome", "forum"].includes(this.view.name)) {
        UI.renderWelcome();
        return;
      }
      const params = this.view.params || {};
      switch (this.view.name) {
        case "welcome":
          UI.renderWelcome();
          break;
        case "forum":
          window.ROA.Forum.renderFeed(params || {});
          break;
        case "sections":
          window.ROA.Sections.renderSections();
          break;
        case "section":
          window.ROA.Sections.renderSection(params.sectionId);
          break;
        case "file":
          window.ROA.Files.openFile(params.fileId);
          break;
        case "filesText":
          window.ROA.Files.renderCollection("text", "Archivos de texto", "Bloc de notas wiki con enlaces internos.");
          break;
        case "characters":
          window.ROA.Files.renderCollection("character", "Personajes", "Fichas completas de personajes y entidades.");
          break;
        case "worlds":
          window.ROA.Files.renderCollection("world", "Mundos / Planetas", "Planetas, dimensiones y mundos del proyecto.");
          break;
        case "organizations":
          window.ROA.Files.renderCollection("organization", "Organizaciones", "Corporaciones, fundaciones, cultos e imperios.");
          break;
        case "ideas":
          window.ROA.Files.renderCollection("idea", "Ideas", "Conceptos sin asignar y semillas narrativas.");
          break;
        case "tags":
          window.ROA.Tags.renderTags();
          break;
        case "gallery":
          window.ROA.Gallery.renderGallery(params.filterTag, params.filterType);
          break;
        case "timeline":
          window.ROA.Files.renderTimeline();
          break;
        case "favorites":
          window.ROA.Files.renderFavorites();
          break;
        case "relations":
          window.ROA.Files.renderRelations();
          break;
        case "trash":
          window.ROA.Files.renderTrash();
          break;
        case "search":
          window.ROA.Files.renderSearch();
          break;
        case "dashboard":
        default:
          window.ROA.Projects.renderDashboard();
          break;
      }
    },

    bindEvents() {
      document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        this.handleAction(action, button, event).catch((error) => {
          console.error(error);
          UI.toast(error.message || "Ocurrio un error en la accion.");
        });
      });

      document.addEventListener("input", (event) => {
        if (event.target.matches("[data-stat]")) {
          const label = event.target.parentElement.querySelector("strong");
          if (label) label.textContent = event.target.value;
        }
      });

      document.addEventListener("change", (event) => {
        if (event.target.matches("[data-action='gallery-filter']")) {
          this.navigate("gallery", { filterTag: event.target.value, filterType: this.view.params.filterType || "" });
        }
        if (event.target.matches("[data-action='gallery-type-filter']")) {
          this.navigate("gallery", { filterTag: this.view.params.filterTag || "", filterType: event.target.value });
        }
        if (event.target.matches("[data-action='editor-font']")) {
          window.ROA.Editor.applyFont(event.target.value);
        }
        if (event.target.matches("[data-action='editor-size']")) {
          window.ROA.Editor.applySize(event.target.value);
        }
      });

      UI.qs("#projectImportInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) window.ROA.Projects.importProjectFile(file);
        event.target.value = "";
      });

      UI.qs("#backupImportInput").addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) window.ROA.Settings.importBackupFile(file);
        event.target.value = "";
      });

      UI.qs("#galleryInput").addEventListener("change", (event) => {
        window.ROA.Gallery.handleUpload(Array.from(event.target.files || []));
        event.target.value = "";
      });

      UI.qs("#avatarInput").addEventListener("change", (event) => {
        window.ROA.Users.setAvatar(event.target.files[0]);
        event.target.value = "";
      });

      UI.qs("#backgroundInput").addEventListener("change", (event) => {
        window.ROA.Backgrounds.setCustom(event.target.files[0]);
        event.target.value = "";
      });

      UI.qs("#modalRoot").addEventListener("click", (event) => {
        if (event.target.id === "modalRoot") UI.closeModal();
      });
    },

    async handleAction(action, el, event) {
      if (action !== "toggle-user-menu") {
        UI.qs("#userMenu").classList.add("hidden");
      }
      const projectId = el.dataset.projectId;
      const fileId = el.dataset.fileId;
      const sectionId = el.dataset.sectionId;
      const tagId = el.dataset.tagId;
      const imageId = el.dataset.imageId;
      const type = el.dataset.type;
      const moduleId = el.dataset.moduleId;

      switch (action) {
        case "close-modal":
          UI.closeModal();
          break;
        case "go-home":
          this.navigate("forum", { filter: el.dataset.filter || "recent" });
          break;
        case "open-forum":
          this.navigate("forum", { filter: el.dataset.filter || "recent" });
          break;
        case "open-dashboard":
          this.navigate("dashboard");
          break;
        case "toggle-sidebar":
          document.body.classList.toggle("sidebar-collapsed");
          if (window.ROA.Auth.currentUser()) {
            window.ROA.Auth.currentUser().settings.sidebarCollapsed = document.body.classList.contains("sidebar-collapsed");
            this.save();
          }
          break;
        case "save-and-leave":
          if (window.ROA.State.pendingFileId) {
            const ok = await window.ROA.Files.saveFile(window.ROA.State.pendingFileId, true);
            if (!ok) return;
          }
          UI.closeModal();
          this.view = window.ROA.State.pendingNavigation || { name: "dashboard", params: {} };
          window.ROA.State.pendingNavigation = null;
          this.render();
          break;
        case "leave-without-save":
          window.ROA.State.markSaved();
          UI.closeModal();
          this.view = window.ROA.State.pendingNavigation || { name: "dashboard", params: {} };
          window.ROA.State.pendingNavigation = null;
          this.render();
          break;
        case "cancel-navigation":
          window.ROA.State.pendingNavigation = null;
          UI.closeModal();
          break;
        case "toggle-user-menu":
        case "open-profile":
          window.ROA.Users.openProfile();
          break;
        case "save-profile":
          window.ROA.Users.saveProfile();
          break;
        case "trigger-avatar-upload":
          UI.qs("#avatarInput").click();
          break;
        case "logout":
          window.ROA.Auth.logout();
          break;
        case "create-project":
          window.ROA.Projects.createProject();
          break;
        case "select-project":
          window.ROA.Projects.selectProject(projectId);
          break;
        case "delete-project":
          window.ROA.Projects.deleteProject();
          break;
        case "delete-project-by-id":
          window.ROA.Projects.deleteProject(projectId);
          break;
        case "export-project":
          window.ROA.Projects.exportProject();
          break;
        case "export-project-by-id":
          window.ROA.Projects.exportProject(projectId);
          break;
        case "toggle-project-visibility":
          window.ROA.Projects.toggleProjectVisibility(projectId);
          break;
        case "app-info":
          window.ROA.Projects.appInfo();
          break;
        case "open-settings":
          window.ROA.Settings.openSettings();
          break;
        case "export-all":
          window.ROA.Settings.exportAll();
          break;
        case "trigger-backup-import":
          UI.qs("#backupImportInput").click();
          break;
        case "trigger-background-upload":
          UI.qs("#backgroundInput").click();
          break;
        case "reset-all-data":
          window.ROA.Settings.resetAllData();
          break;
        case "open-sections":
          this.navigate("sections");
          break;
        case "create-section":
          window.ROA.Sections.createSection(null);
          break;
        case "create-subsection":
          window.ROA.Sections.createSection(sectionId);
          break;
        case "edit-section":
          window.ROA.Sections.editSection(sectionId);
          break;
        case "delete-section":
          window.ROA.Sections.deleteSection(sectionId);
          break;
        case "open-section":
          UI.closeModal();
          this.navigate("section", { sectionId });
          break;
        case "open-files-text":
          this.navigate("filesText");
          break;
        case "open-characters":
          this.navigate("characters");
          break;
        case "open-worlds":
          this.navigate("worlds");
          break;
        case "open-organizations":
          this.navigate("organizations");
          break;
        case "open-ideas":
          this.navigate("ideas");
          break;
        case "create-file":
          window.ROA.Files.createFile(type || "", sectionId || "", "", moduleId || "");
          break;
        case "open-custom-module":
          window.ROA.Dashboard.openCustomModule(moduleId);
          break;
        case "customize-dashboard":
          window.ROA.Dashboard.openCustomizer();
          break;
        case "edit-dashboard-module":
          window.ROA.Dashboard.editModule(moduleId);
          break;
        case "remove-dashboard-module":
          window.ROA.Dashboard.removeModule(moduleId);
          break;
        case "open-file":
          UI.closeModal();
          this.navigate("file", { fileId });
          break;
        case "save-file":
          await window.ROA.Files.saveFile(fileId);
          break;
        case "trash-file":
          window.ROA.Files.trashFile(fileId);
          break;
        case "toggle-favorite":
          window.ROA.Files.toggleFavorite(fileId);
          break;
        case "create-linked-file":
          window.ROA.Files.createLinkedFile(el.dataset.title || "");
          break;
        case "editor-format":
          window.ROA.Editor.applyFormat(el.dataset.format);
          break;
        case "editor-font":
        case "editor-size":
          break;
        case "insert-internal-link":
          window.ROA.Editor.insertInternalLink();
          break;
        case "insert-normal-link":
          window.ROA.Editor.insertNormalLink();
          break;
        case "insert-gallery-image":
          window.ROA.Editor.insertGalleryImage();
          break;
        case "choose-editor-image":
          window.ROA.Editor.chooseImage(imageId);
          break;
        case "toggle-preview":
          window.ROA.Editor.togglePreview();
          break;
        case "open-emoji-panel":
          window.ROA.Editor.openEmojiPanel();
          break;
        case "insert-emoji":
          window.ROA.Editor.insertEmoji(el.dataset.emoji);
          break;
        case "clear-text":
          window.ROA.Editor.clearText();
          break;
        case "toggle-keyboard":
          window.ROA.Editor.toggleKeyboard();
          break;
        case "keyboard-key":
          window.ROA.Editor.keyboardKey(el.dataset.key);
          break;
        case "keyboard-backspace":
          window.ROA.Editor.keyboardBackspace();
          break;
        case "toggle-speech":
          window.ROA.Editor.toggleSpeech();
          break;
        case "manual-save-current-file":
          if (this.view.params.fileId) await window.ROA.Files.saveFile(this.view.params.fileId);
          break;
        case "add-internal-section":
          window.ROA.Files.addInternalSection(fileId);
          break;
        case "switch-internal-section":
          window.ROA.Files.switchInternalSection(fileId, el.dataset.internalSectionId);
          break;
        case "rename-internal-section":
          window.ROA.Files.renameInternalSection(fileId, el.dataset.internalSectionId);
          break;
        case "delete-internal-section":
          window.ROA.Files.deleteInternalSection(fileId, el.dataset.internalSectionId);
          break;
        case "add-custom-field":
          window.ROA.Files.addCustomField(fileId, el.dataset.internalSectionId);
          break;
        case "delete-custom-field":
          window.ROA.Files.deleteCustomField(fileId, el.dataset.internalSectionId, el.dataset.fieldId);
          break;
        case "save-character":
          window.ROA.Characters.saveCharacter(fileId);
          break;
        case "switch-tab":
          window.ROA.Characters.switchTab(el.dataset.tab);
          break;
        case "add-relation":
          window.ROA.Characters.addRelation(fileId);
          break;
        case "delete-relation":
          window.ROA.Characters.deleteRelation(fileId, el.dataset.relationId);
          break;
        case "assign-character-image":
          window.ROA.Characters.assignImage(fileId);
          break;
        case "choose-character-image":
          window.ROA.Characters.chooseImage(fileId, imageId);
          break;
        case "add-sector":
          window.ROA.Files.addSector(fileId);
          break;
        case "delete-sector":
          window.ROA.Files.deleteSector(fileId, el.dataset.sectorId);
          break;
        case "open-tags":
          this.navigate("tags");
          break;
        case "create-tag":
          window.ROA.Tags.createTag();
          break;
        case "edit-tag":
          window.ROA.Tags.editTag(tagId);
          break;
        case "delete-tag":
          window.ROA.Tags.deleteTag(tagId);
          break;
        case "open-tag-panel":
          window.ROA.Tags.openTagPanel(tagId);
          break;
        case "open-gallery":
          this.navigate("gallery", this.view.name === "file" ? { returnTo: "file", fileId: this.view.params.fileId } : {});
          break;
        case "return-from-gallery":
          if (this.view.params.returnTo === "file") this.navigate("file", { fileId: this.view.params.fileId });
          else this.navigate("dashboard");
          break;
        case "trigger-gallery-upload":
          UI.qs("#galleryInput").click();
          break;
        case "open-image":
          window.ROA.Gallery.openImage(imageId);
          break;
        case "edit-image":
          window.ROA.Gallery.editImage(imageId);
          break;
        case "delete-image":
          window.ROA.Gallery.deleteImage(imageId);
          break;
        case "open-timeline":
          this.navigate("timeline");
          break;
        case "add-event":
          window.ROA.Files.addEvent();
          break;
        case "delete-event":
          window.ROA.Files.deleteEvent(el.dataset.eventId);
          break;
        case "open-favorites":
          this.navigate("favorites");
          break;
        case "open-relations":
          this.navigate("relations");
          break;
        case "open-trash":
          this.navigate("trash");
          break;
        case "restore-trash":
          window.ROA.Files.restoreTrash(el.dataset.trashId);
          break;
        case "delete-trash":
          window.ROA.Files.deleteTrash(el.dataset.trashId);
          break;
        case "open-search":
          this.navigate("search");
          break;
        case "create-forum-post":
          window.ROA.Forum.openPostComposer();
          break;
        case "submit-forum-post":
          window.ROA.Forum.submitPost();
          break;
        case "open-forum-post":
          window.ROA.Forum.openPost(el.dataset.postId);
          break;
        case "submit-forum-comment":
          window.ROA.Forum.submitComment(el.dataset.postId, el.dataset.parentCommentId || null);
          break;
        case "vote-forum":
          window.ROA.Forum.vote(el.dataset.targetType, el.dataset.targetId, el.dataset.voteType || "up");
          break;
        case "save-forum-post":
          window.ROA.Forum.savePost(el.dataset.postId);
          break;
        case "open-public-profile":
          window.ROA.Forum.openPublicProfile(el.dataset.userId);
          break;
        case "request-project-access":
          UI.promptFields("Solicitar acceso", [
            { name: "message", label: "Mensaje", type: "textarea", value: "Hola, quisiera acceder a este proyecto para leer la documentacion." }
          ], "Enviar").then((result) => window.ROA.Notifications.requestAccess(projectId, result.message));
          break;
        case "accept-access-request":
          window.ROA.Notifications.decideRequest(projectId, el.dataset.requestId, true);
          break;
        case "reject-access-request":
          window.ROA.Notifications.decideRequest(projectId, el.dataset.requestId, false);
          break;
        default:
          console.warn("Unhandled action", action);
      }
    }
  };

  window.ROA.App = App;
  document.addEventListener("DOMContentLoaded", () => App.init());
})();
