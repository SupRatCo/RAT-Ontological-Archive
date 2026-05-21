(function () {
  const { Storage } = window.ROA;

  function notify(userId, title, message, meta) {
    const app = window.ROA.App;
    const user = app.data.users.find((item) => item.id === userId);
    if (!user) return;
    user.notifications = user.notifications || [];
    user.notifications.unshift({
      id: Storage.uid("notice"),
      title,
      message,
      type: (meta && meta.type) || "system",
      read: false,
      createdAt: Storage.now(),
      meta: meta || {}
    });
  }

  function requestAccess(projectId, message) {
    const app = window.ROA.App;
    const user = window.ROA.Permissions.currentUser();
    const project = app.data.projects.find((item) => item.id === projectId);
    if (!user || !project) return;
    project.accessRequests = project.accessRequests || [];
    const existing = project.accessRequests.find((request) => request.userId === user.id && request.status === "pendiente");
    if (existing) {
      window.ROA.UI.toast("Ya tienes una solicitud pendiente.");
      return;
    }
    const request = {
      id: Storage.uid("request"),
      projectId,
      userId: user.id,
      username: user.username,
      message,
      status: "pendiente",
      createdAt: Storage.now(),
      updatedAt: Storage.now()
    };
    project.accessRequests.push(request);
    const targets = Array.from(new Set([project.ownerId].concat(project.editors || []).filter(Boolean)));
    targets.forEach((targetId) => notify(targetId, "Solicitud de acceso", `${user.username} solicita acceso a ${project.name}.`, {
      type: "access-request",
      projectId,
      requestId: request.id
    }));
    app.save();
    app.render();
    window.ROA.UI.toast("Solicitud enviada.");
  }

  function decideRequest(projectId, requestId, accepted) {
    const app = window.ROA.App;
    const project = app.data.projects.find((item) => item.id === projectId);
    if (!project || !window.ROA.Permissions.canEdit(project)) return;
    const request = (project.accessRequests || []).find((item) => item.id === requestId);
    if (!request) return;
    request.status = accepted ? "aceptada" : "rechazada";
    request.updatedAt = Storage.now();
    if (accepted && !(project.readers || []).includes(request.userId)) {
      project.readers = project.readers || [];
      project.readers.push(request.userId);
    }
    notify(
      request.userId,
      accepted ? "Acceso aceptado" : "Acceso rechazado",
      accepted ? `Ahora puedes leer ${project.name}.` : `Tu solicitud para ${project.name} fue rechazada.`,
      { type: "access-result", projectId, status: request.status }
    );
    app.save();
    window.ROA.Users.openProfile();
  }

  window.ROA = window.ROA || {};
  window.ROA.Notifications = { notify, requestAccess, decideRequest };
})();
