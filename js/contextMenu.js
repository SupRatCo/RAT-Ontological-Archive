(function () {
  function close() {
    const old = document.querySelector("#contextMenu");
    if (old) old.remove();
  }

  function item(label, action, attrs) {
    const data = Object.entries(attrs || {}).map(([key, value]) => `data-${key}="${String(value).replace(/"/g, "&quot;")}"`).join(" ");
    return `<button type="button" data-action="${action}" ${data}>${label}</button>`;
  }

  function options(type, target) {
    const id = (name) => target.dataset[name] || "";
    if (type === "project") return [
      item("Abrir", "select-project", { "project-id": id("projectId") }),
      item("Exportar", "export-project-by-id", { "project-id": id("projectId") }),
      item("Visibilidad", "toggle-project-visibility", { "project-id": id("projectId") }),
      item("Eliminar", "delete-project-by-id", { "project-id": id("projectId") })
    ];
    if (type === "file") return [
      item("Abrir", "open-file", { "file-id": id("fileId") }),
      item("Publicar", "publish-file-by-id", { "file-id": id("fileId") }),
      item("Favorito", "toggle-favorite", { "file-id": id("fileId") }),
      item("Eliminar", "trash-file", { "file-id": id("fileId") })
    ];
    if (type === "post") return [
      item("Abrir", "open-forum-post", { "post-id": id("postId") }),
      item("Like", "vote-forum", { "target-type": "post", "target-id": id("postId"), "vote-type": "up" }),
      item("Autor", "open-public-profile", { "user-id": id("userId") }),
      item("Guardar", "save-forum-post", { "post-id": id("postId") })
    ];
    if (type === "module") return [
      item("Abrir", target.dataset.action || "open-dashboard", { "module-id": id("moduleId") }),
      item("Personalizar", "customize-dashboard")
    ];
    return [];
  }

  function open(event, target) {
    close();
    const type = target.dataset.contextType;
    const html = options(type, target).join("");
    if (!html) return;
    const menu = document.createElement("nav");
    menu.id = "contextMenu";
    menu.className = "context-menu";
    menu.innerHTML = html;
    menu.style.left = `${Math.min(event.clientX, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.min(event.clientY, window.innerHeight - 240)}px`;
    document.body.appendChild(menu);
  }

  document.addEventListener("click", (event) => {
    const menu = event.target.closest("#contextMenu");
    if (menu) return setTimeout(close, 0);
    const target = event.target.closest("[data-context-type]");
    const actionTarget = event.target.closest("[data-action]");
    if (!target || (actionTarget && actionTarget !== target)) return close();
    event.preventDefault();
    event.stopPropagation();
    open(event, target);
  }, true);

  window.ROA = window.ROA || {};
  window.ROA.ContextMenu = { open, close };
})();
