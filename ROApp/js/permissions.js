(function () {
  function currentUser() {
    const app = window.ROA.App;
    if (!app || !app.data) return null;
    return app.data.users.find((user) => user.id === app.data.currentUserId) || null;
  }

  function roleFor(project, userId) {
    if (!project || !userId) return "none";
    if (project.ownerId === userId) return "owner";
    if ((project.editors || []).includes(userId)) return "editor";
    if ((project.readers || []).includes(userId)) return "reader";
    if (project.visibility === "public") return "reader";
    return "none";
  }

  function hasProjectAccess(project, userId) {
    return roleFor(project, userId) !== "none";
  }

  function canEdit(project, userId) {
    const role = roleFor(project, userId || (currentUser() || {}).id);
    return role === "owner" || role === "editor";
  }

  function canManageProject(project, userId) {
    return roleFor(project, userId || (currentUser() || {}).id) === "owner";
  }

  function effectiveVisibility(item, project) {
    if (!item || !item.visibility || item.visibility === "inherit") return project.visibility || "private";
    return item.visibility;
  }

  function canViewItem(project, item, userId) {
    const role = roleFor(project, userId || (currentUser() || {}).id);
    if (role === "owner" || role === "editor") return true;
    if (role === "none") return false;
    return effectiveVisibility(item, project) === "public" || project.visibility === "public";
  }

  function filterFiles(project, files) {
    const user = currentUser();
    return (files || []).filter((file) => canViewItem(project, file, user && user.id));
  }

  function filterSections(project, sections) {
    const user = currentUser();
    return (sections || []).filter((section) => canViewItem(project, section, user && user.id));
  }

  function accessScreen(project) {
    const user = currentUser();
    const pending = project.accessRequests && project.accessRequests.some((request) => request.userId === user.id && request.status === "pendiente");
    document.querySelector("#mainView").innerHTML = `
      <section class="empty-state">
        <div>
          <h1>Proyecto privado</h1>
          <p>Este archivo pertenece a otro usuario y requiere autorizacion para abrirse.</p>
          <p class="meta">${project.name}</p>
          ${pending ? `<span class="pill-mini">Solicitud pendiente</span>` : `<button class="action" type="button" data-action="request-project-access" data-project-id="${project.id}">Solicitar acceso</button>`}
        </div>
      </section>
    `;
  }

  window.ROA = window.ROA || {};
  window.ROA.Permissions = {
    currentUser,
    roleFor,
    hasProjectAccess,
    canEdit,
    canManageProject,
    canViewItem,
    filterFiles,
    filterSections,
    accessScreen
  };
})();
