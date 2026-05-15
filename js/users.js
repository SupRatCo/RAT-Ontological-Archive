(function () {
  const { UI, Storage } = window.ROA;

  function initials(username) {
    return String(username || "ROA").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "ROA";
  }

  function renderProfileButton() {
    const user = window.ROA.Auth.currentUser();
    const name = document.querySelector("#topbarUsername");
    const button = document.querySelector("#profileButton");
    const initialsNode = document.querySelector("#profileInitials");
    if (!user || !name || !button) return;
    document.body.classList.toggle("sidebar-collapsed", !!(user.settings && user.settings.sidebarCollapsed));
    name.textContent = user.username;
    if (user.avatar) {
      button.style.backgroundImage = `url("${user.avatar}")`;
      button.classList.add("has-avatar");
      if (initialsNode) initialsNode.textContent = "";
    } else {
      button.style.backgroundImage = "";
      button.classList.remove("has-avatar");
      if (initialsNode) initialsNode.textContent = initials(user.username);
    }
  }

  function projectRows(user) {
    const app = window.ROA.App;
    const owned = app.data.projects.filter((project) => project.ownerId === user.id);
    return owned.map((project) => `
      <article class="list-row">
        <div>
          <strong>${UI.escape(project.name)}</strong>
          <span class="meta">${UI.escape(project.visibility || "private")} / ${UI.formatDate(project.createdAt)}</span>
        </div>
        <div class="inline-actions">
          <button class="action" data-action="select-project" data-project-id="${project.id}" type="button">Seleccionar</button>
          <button class="ghost-action" data-action="export-project-by-id" data-project-id="${project.id}" type="button">Exportar</button>
          <button class="danger-action" data-action="delete-project-by-id" data-project-id="${project.id}" type="button">Eliminar</button>
        </div>
      </article>
    `).join("") || `<p class="meta">No has creado proyectos todavia.</p>`;
  }

  function notificationRows(user) {
    const app = window.ROA.App;
    return (user.notifications || []).map((notice) => {
      const project = notice.meta && notice.meta.projectId ? app.data.projects.find((item) => item.id === notice.meta.projectId) : null;
      const request = project && notice.meta ? (project.accessRequests || []).find((item) => item.id === notice.meta.requestId) : null;
      return `
        <article class="list-row">
          <div>
            <strong>${UI.escape(notice.title)}</strong>
            <span class="meta">${UI.formatDate(notice.createdAt)}</span>
            <span>${UI.escape(notice.message || "")}</span>
            ${request ? `<span class="meta">Mensaje: ${UI.escape(request.message || "Sin mensaje")}</span>` : ""}
          </div>
          ${request && request.status === "pendiente" ? `
            <div class="inline-actions">
              <button class="action" data-action="accept-access-request" data-project-id="${project.id}" data-request-id="${request.id}" type="button">Aceptar</button>
              <button class="danger-action" data-action="reject-access-request" data-project-id="${project.id}" data-request-id="${request.id}" type="button">Rechazar</button>
            </div>
          ` : `<span class="pill-mini">${UI.escape((request && request.status) || notice.type || "sistema")}</span>`}
        </article>
      `;
    }).join("") || `<p class="meta">No tienes notificaciones.</p>`;
  }

  function accessRequestRows(user) {
    const app = window.ROA.App;
    const rows = [];
    app.data.projects.filter((project) => window.ROA.Permissions.canEdit(project, user.id)).forEach((project) => {
      (project.accessRequests || []).filter((request) => request.status === "pendiente").forEach((request) => {
        rows.push(`
          <article class="list-row">
            <div>
              <strong>${UI.escape(request.username)} solicita ${UI.escape(project.name)}</strong>
              <span>${UI.escape(request.message || "Sin mensaje.")}</span>
            </div>
            <div class="inline-actions">
              <button class="action" data-action="accept-access-request" data-project-id="${project.id}" data-request-id="${request.id}" type="button">Aceptar</button>
              <button class="danger-action" data-action="reject-access-request" data-project-id="${project.id}" data-request-id="${request.id}" type="button">Rechazar</button>
            </div>
          </article>
        `);
      });
    });
    return rows.join("") || `<p class="meta">No hay solicitudes pendientes.</p>`;
  }

  function openProfile() {
    const user = window.ROA.Auth.currentUser();
    if (!user) return;
    UI.openModal("Perfil", `
      <div class="profile-layout">
        <section class="panel profile-editor-card">
          <div class="profile-banner preview" style="${user.settings && user.settings.banner ? `background-image:url('${UI.escape(user.settings.banner)}')` : ""}"></div>
          <div class="profile-preview">
            <button class="profile-avatar-large" type="button" data-action="trigger-avatar-upload" style="${user.avatar ? `background-image:url('${user.avatar}')` : ""}">
              ${user.avatar ? "" : UI.escape(initials(user.username))}
            </button>
            <div>
              <label class="field">Nombre de usuario<input id="profileUsername" value="${UI.escape(user.username)}"></label>
              <label class="field">Sobre mi<textarea id="profileBio" rows="3">${UI.escape((user.settings && user.settings.bio) || "")}</textarea></label>
              <label class="field">Links<input id="profileLinks" value="${UI.escape((user.settings && user.settings.links) || "")}" placeholder="https://..."></label>
              <label class="field">Color de perfil<input id="profileAccent" type="color" value="${UI.escape((user.settings && user.settings.accent) || "#ffd800")}"></label>
              <p class="meta">Creado: ${UI.formatDate(user.createdAt)}</p>
              <div class="inline-actions">
                <button class="ghost-action" type="button" data-action="trigger-avatar-upload">Avatar</button>
                <button class="ghost-action" type="button" data-action="trigger-profile-banner-upload">Banner</button>
                <button class="action" type="button" data-action="save-profile">Guardar</button>
              </div>
            </div>
          </div>
        </section>
        <section class="panel">
          <h3>Acciones</h3>
          <div class="inline-actions">
            <button class="action" type="button" data-action="create-project">Crear proyecto</button>
            <button class="ghost-action" type="button" data-action="delete-project">Eliminar proyecto activo</button>
            <button class="danger-action" type="button" data-action="logout">Cerrar sesion</button>
          </div>
        </section>
        <section class="panel">
          <h3>Proyectos creados</h3>
          <div class="item-list">${projectRows(user)}</div>
        </section>
        <section class="panel">
          <h3>Solicitudes de acceso</h3>
          <div class="item-list">${accessRequestRows(user)}</div>
        </section>
        <section class="panel">
          <h3>Notificaciones</h3>
          <div class="item-list">${notificationRows(user)}</div>
        </section>
      </div>
    `);
  }

  async function saveProfile() {
    const app = window.ROA.App;
    const user = window.ROA.Auth.currentUser();
    if (!user) return;
    const next = document.querySelector("#profileUsername").value.trim();
    if (!next) return;
    user.username = next;
    user.settings = user.settings || {};
    user.settings.bio = document.querySelector("#profileBio").value.trim();
    user.settings.links = document.querySelector("#profileLinks").value.trim();
    user.settings.accent = document.querySelector("#profileAccent").value;
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try {
        const data = await window.ROA.Api.updateMe({ username: user.username, settings: user.settings });
        user.username = data.user.username;
        user.avatar = window.ROA.Api.assetUrl(data.user.avatar || data.user.avatar_url) || user.avatar;
        user.settings = Object.assign(user.settings, data.user.settings || {});
      } catch (error) {
        UI.toast(error.message || "No se pudo guardar el perfil.");
        return;
      }
    }
    app.save();
    renderProfileButton();
    UI.toast("Perfil actualizado.");
    openProfile();
  }

  function setAvatar(file) {
    const user = window.ROA.Auth.currentUser();
    if (!user || !file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      user.avatar = reader.result;
      if (window.ROA.Api && window.ROA.Api.serverMode) {
        try {
          const data = await window.ROA.Api.uploadAvatar(file);
          user.avatar = window.ROA.Api.assetUrl(data.user.avatar || data.user.avatar_url) || user.avatar;
        } catch (error) {
          UI.toast(error.message || "No se pudo subir el avatar al servidor.");
        }
      }
      window.ROA.App.save();
      renderProfileButton();
      openProfile();
    };
    reader.readAsDataURL(file);
  }

  function setBanner(file) {
    const user = window.ROA.Auth.currentUser();
    if (!user || !file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      user.settings = user.settings || {};
      user.settings.banner = reader.result;
      if (window.ROA.Api && window.ROA.Api.serverMode) {
        try { await window.ROA.Api.updateMe({ settings: user.settings }); }
        catch (error) { UI.toast(error.message || "No se pudo guardar el banner."); }
      }
      window.ROA.App.save();
      openProfile();
    };
    reader.readAsDataURL(file);
  }

  window.ROA = window.ROA || {};
  window.ROA.Users = { openProfile, saveProfile, setAvatar, setBanner, renderProfileButton, initials };
})();
