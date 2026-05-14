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
    UI.openModal("Perfil de usuario", `
      <div class="profile-layout">
        <section class="panel">
          <h3>Cuenta</h3>
          <div class="profile-preview">
            <button class="profile-avatar-large" type="button" data-action="trigger-avatar-upload" style="${user.avatar ? `background-image:url('${user.avatar}')` : ""}">
              ${user.avatar ? "" : UI.escape(initials(user.username))}
            </button>
            <div>
              <label class="field">Nombre de usuario<input id="profileUsername" value="${UI.escape(user.username)}"></label>
              <p class="meta">Creado: ${UI.formatDate(user.createdAt)}</p>
              <button class="action" type="button" data-action="save-profile">Guardar perfil</button>
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

  function saveProfile() {
    const app = window.ROA.App;
    const user = window.ROA.Auth.currentUser();
    if (!user) return;
    const next = document.querySelector("#profileUsername").value.trim();
    if (!next) return;
    user.username = next;
    app.save();
    renderProfileButton();
    UI.toast("Perfil actualizado.");
    openProfile();
  }

  function setAvatar(file) {
    const user = window.ROA.Auth.currentUser();
    if (!user || !file) return;
    const reader = new FileReader();
    reader.onload = () => {
      user.avatar = reader.result;
      window.ROA.App.save();
      renderProfileButton();
      openProfile();
    };
    reader.readAsDataURL(file);
  }

  window.ROA = window.ROA || {};
  window.ROA.Users = { openProfile, saveProfile, setAvatar, renderProfileButton, initials };
})();
