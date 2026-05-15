(function () {
  const { Storage } = window.ROA;

  function hashPassword(value) {
    return btoa(unescape(encodeURIComponent(value || "")));
  }

  function currentUser() {
    const app = window.ROA.App;
    return app && app.data ? app.data.users.find((user) => user.id === app.data.currentUserId) || null : null;
  }

  function serverSettings(settings) {
    const clean = Object.assign({}, settings || {});
    if (clean.banner && window.ROA.Api && window.ROA.Api.assetUrl) clean.banner = window.ROA.Api.assetUrl(clean.banner);
    return clean;
  }

  function showLogin() {
    const root = document.querySelector("#loginRoot");
    const shell = document.querySelector("#appShell");
    const api = window.ROA.Api || {};
    const offline = api.connection && api.connection.checked && !api.connection.ok;
    root.classList.remove("hidden");
    shell.classList.add("hidden");
    root.innerHTML = `
      <div class="login-card">
        <div class="brand-plate login-brand"><span>RAT</span><span>Ontological</span><span>Archive</span></div>
        <div>
          <h1>${api.requiresServer ? "Acceso online" : "Acceso local"}</h1>
          <p>${api.requiresServer ? "Conecta con el backend configurado para usar usuarios, documentos y foro compartido." : "Inicia sesion o crea un usuario para administrar tus proyectos narrativos en este dispositivo."}</p>
        </div>
        ${offline ? `
          <section class="server-alert">
            <strong>Servidor no disponible</strong>
            <span>${window.ROA.UI.escape(api.connection.message || "No se pudo conectar con el backend.")}</span>
            <small>API actual: ${window.ROA.UI.escape(api.baseUrl || "Sin configurar")}</small>
            <button class="ghost-action" type="button" data-action="retry-server-connection">Reintentar conexion</button>
          </section>
        ` : ""}
        <form id="loginForm" class="form-grid one">
          <label class="field">Usuario<input name="username" required autocomplete="username"></label>
          <label class="field">Contraseña<input name="password" type="password" autocomplete="current-password" minlength="4"></label>
          <div class="inline-actions">
            <button class="action" type="submit" data-mode="login">Entrar</button>
            <button class="ghost-action" type="submit" data-mode="register">Crear usuario</button>
          </div>
        </form>
        <p class="meta">${api.requiresServer ? "En GitHub Pages se requiere un backend online configurado en js/config.js." : "Servidor conectado si API_URL esta configurada. En modo local, la cuenta queda solo en este navegador."}</p>
      </div>
    `;
    root.querySelector("#loginForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const submitter = event.submitter;
      const mode = submitter ? submitter.dataset.mode : "login";
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (mode === "register") register(values.username, values.password);
      else login(values.username, values.password);
    });
  }

  function hideLogin() {
    document.querySelector("#loginRoot").classList.add("hidden");
    document.querySelector("#appShell").classList.remove("hidden");
  }

  async function register(username, password) {
    const app = window.ROA.App;
    const cleanName = String(username || "").trim();
    if (!cleanName) return;
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try {
        const data = await window.ROA.Api.register(cleanName, password);
        const user = Storage.normalizeUser({ id: data.user.id, username: data.user.username, avatar: window.ROA.Api.assetUrl(data.user.avatar_url || data.user.avatar), createdAt: data.user.createdAt, settings: serverSettings(data.user.settings) });
        app.data.users = app.data.users.filter((item) => item.id !== user.id).concat(user);
        app.data.currentUserId = user.id;
        app.data.settings = Object.assign(Storage.defaultSettings(), user.settings || {});
        app.data.activeProjectId = null;
        await syncProjectsFromServer();
        app.save();
        hideLogin();
        app.navigate("welcome");
        window.ROA.UI.toast("Usuario creado en servidor.");
        return;
      } catch (error) {
        window.ROA.UI.toast(error.message || "No se pudo crear usuario en servidor.");
      }
    }
    if (window.ROA.Api && window.ROA.Api.requiresServer) {
      window.ROA.UI.toast("Este despliegue necesita un backend online. Configura API_URL en js/config.js.");
      showLogin();
      return;
    }
    if (app.data.users.some((user) => user.username.toLowerCase() === cleanName.toLowerCase())) {
      window.ROA.UI.toast("Ese usuario ya existe.");
      return;
    }
    const user = Storage.normalizeUser({
      id: Storage.uid("user"),
      username: cleanName,
      passwordHash: hashPassword(password),
      createdAt: Storage.now()
    });
    app.data.users.push(user);
    app.data.currentUserId = user.id;
    app.data.settings = Object.assign({}, user.settings);
    app.data.activeProjectId = null;
    app.save();
    hideLogin();
    app.navigate("welcome");
    window.ROA.UI.toast("Usuario creado.");
  }

  async function login(username, password) {
    const app = window.ROA.App;
    const cleanName = String(username || "").trim().toLowerCase();
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try {
        const data = await window.ROA.Api.login(username, password);
        const user = Storage.normalizeUser({ id: data.user.id, username: data.user.username, avatar: window.ROA.Api.assetUrl(data.user.avatar_url || data.user.avatar), createdAt: data.user.createdAt, settings: serverSettings(data.user.settings) });
        app.data.users = app.data.users.filter((item) => item.id !== user.id).concat(user);
        app.data.currentUserId = user.id;
        app.data.settings = Object.assign(Storage.defaultSettings(), user.settings || {});
        app.data.activeProjectId = null;
        await syncProjectsFromServer();
        app.save();
        hideLogin();
        app.navigate("welcome");
        return;
      } catch (error) {
        window.ROA.UI.toast(error.message || "No se pudo iniciar sesión en servidor.");
      }
    }
    if (window.ROA.Api && window.ROA.Api.requiresServer) {
      window.ROA.UI.toast("Este despliegue necesita un backend online. Configura API_URL en js/config.js.");
      showLogin();
      return;
    }
    const user = app.data.users.find((item) => item.username.toLowerCase() === cleanName);
    if (!user || user.passwordHash !== hashPassword(password)) {
      window.ROA.UI.toast("Usuario o contraseña incorrectos.");
      return;
    }
    app.data.currentUserId = user.id;
    app.data.settings = Object.assign(Storage.defaultSettings(), user.settings || {});
    app.data.activeProjectId = null;
    app.save();
    hideLogin();
    app.navigate("welcome");
  }

  async function logout() {
    const app = window.ROA.App;
    const user = currentUser();
    if (user) user.settings = Object.assign({}, app.data.settings);
    if (window.ROA.Api) await window.ROA.Api.logout();
    app.data.currentUserId = null;
    app.data.activeProjectId = null;
    app.save();
    if (window.ROA.UI) window.ROA.UI.closeModal();
    showLogin();
  }

  async function syncProjectsFromServer() {
    if (!window.ROA.Api || !window.ROA.Api.serverMode) return;
    const app = window.ROA.App;
    const data = await window.ROA.Api.getProjects();
    const projects = [];
    for (const project of data.projects || []) {
      const normalized = Storage.normalizeProject({
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      visibility: project.visibility,
      editors: project.editors,
      readers: project.readers,
      dashboardModules: project.dashboardModules,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
      }, app.data);
      try {
        const [files, sections, tags, gallery] = await Promise.all([
          window.ROA.Api.getFiles(project.id).catch(() => ({ files: [] })),
          window.ROA.Api.getSections(project.id).catch(() => ({ sections: [] })),
          window.ROA.Api.getTags(project.id).catch(() => ({ tags: [] })),
          window.ROA.Api.getGallery(project.id).catch(() => ({ media: [] }))
        ]);
        normalized.files = (files.files || []).map(Storage.normalizeFile);
        normalized.sections = (sections.sections || []).map((section) => Storage.normalizeSection({
          id: section.id,
          parentId: section.parentId || section.parent_id || null,
          name: section.name,
          description: section.description,
          visibility: section.visibility,
          createdAt: section.createdAt || section.created_at,
          updatedAt: section.updatedAt || section.updated_at
        }));
        normalized.tags = (tags.tags || []).map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color || "#ffd800",
          description: tag.description || "",
          category: tag.category || "Personalizada",
          createdAt: tag.createdAt || tag.created_at || Storage.now()
        }));
        normalized.gallery = (gallery.media || gallery.gallery || []).map(Storage.normalizeMedia);
      } catch (error) {
        console.warn("No se pudo sincronizar contenido del proyecto", project.id, error);
      }
      projects.push(normalized);
    }
    app.data.projects = projects;
  }

  window.ROA = window.ROA || {};
  window.ROA.Auth = { showLogin, hideLogin, register, login, logout, currentUser, hashPassword, syncProjectsFromServer, serverSettings };
})();
