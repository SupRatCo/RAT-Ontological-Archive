(function () {
  let longPressTimer = null;

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
    if (type === "tag") return [
      item("Ver relacionados", "open-tag-panel", { "tag-id": id("tagId") }),
      item("Editar", "edit-tag", { "tag-id": id("tagId") }),
      item("Eliminar", "delete-tag", { "tag-id": id("tagId") })
    ];
    if (type === "image" || type === "video" || type === "media") return [
      item("Abrir", "open-image", { "image-id": id("imageId") }),
      item("Editar", "edit-image", { "image-id": id("imageId") }),
      item("Papelera", "delete-image", { "image-id": id("imageId") })
    ];
    if (type === "section") return [
      item("Abrir", "open-section", { "section-id": id("sectionId") }),
      item("Crear subseccion", "create-subsection", { "section-id": id("sectionId") }),
      item("Editar", "edit-section", { "section-id": id("sectionId") }),
      item("Eliminar", "delete-section", { "section-id": id("sectionId") })
    ];
    if (type === "post") return [
      item("Abrir", "open-forum-post", { "post-id": id("postId") }),
      item("Like", "vote-forum", { "target-type": "post", "target-id": id("postId"), "vote-type": "up" }),
      item("Autor", "open-public-profile", { "user-id": id("userId") }),
      item("Guardar", "save-forum-post", { "post-id": id("postId") })
    ];
    if (type === "comment") return [
      item("Responder", "show-reply-box", { "comment-id": id("commentId") }),
      item("Like", "vote-forum", { "target-type": "comment", "target-id": id("commentId"), "vote-type": "up" }),
      item("Ver perfil", "open-public-profile", { "user-id": id("userId") })
    ];
    if (type === "user") return [
      item("Ver perfil", "open-public-profile", { "user-id": id("userId") })
    ];
    if (type === "module") return [
      item("Abrir", target.dataset.action || "open-dashboard", { "module-id": id("moduleId") }),
      item("Personalizar", "customize-dashboard")
    ];
    return [];
  }

  function open(event, target) {
    close();
    const html = options(target.dataset.contextType, target).join("");
    if (!html) return;
    const menu = document.createElement("nav");
    menu.id = "contextMenu";
    menu.className = "context-menu";
    menu.innerHTML = html;
    menu.style.left = `${Math.min(event.clientX, window.innerWidth - 220)}px`;
    menu.style.top = `${Math.min(event.clientY, window.innerHeight - 240)}px`;
    document.body.appendChild(menu);
  }

  function compatibleTarget(event) {
    const target = event.target.closest("[data-context-type]");
    if (!target) return null;
    return options(target.dataset.contextType, target).length ? target : null;
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#contextMenu")) return setTimeout(close, 0);
    close();
  }, true);

  document.addEventListener("contextmenu", (event) => {
    const target = compatibleTarget(event);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    open(event, target);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") return;
    const target = compatibleTarget(event);
    if (!target) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => open(event, target), 620);
  }, { passive: true });

  ["pointerup", "pointercancel", "pointermove"].forEach((type) => {
    document.addEventListener(type, () => {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }, { passive: true });
  });

  window.ROA = window.ROA || {};
  window.ROA.ContextMenu = { open, close };
})();
