(function () {
  const UI = {};

  UI.qs = (selector, root) => (root || document).querySelector(selector);
  UI.qsa = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  UI.escape = function (value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  UI.formatDate = function (value) {
    if (!value) return "Sin registro";
    try {
      return new Date(value).toLocaleString();
    } catch (error) {
      return value;
    }
  };

  UI.currentProject = function () {
    const app = window.ROA.App;
    if (!app || !app.data.activeProjectId) return null;
    return app.data.projects.find((project) => project.id === app.data.activeProjectId) || null;
  };

  UI.canEditCurrentProject = function () {
    const project = UI.currentProject();
    return !!(project && window.ROA.Permissions && window.ROA.Permissions.canEdit(project));
  };

  UI.fileTypeLabel = function (type) {
    return {
      text: "Texto",
      character: "Personaje",
      world: "Mundo / Planeta",
      organization: "Organizacion",
      idea: "Idea",
      generic: "Generico"
    }[type] || type || "Archivo";
  };

  UI.statusOptions = function (selected) {
    return ["Canon", "Borrador", "Idea", "Rework pendiente", "Descartado", "No canon"]
      .map((item) => `<option value="${UI.escape(item)}" ${item === selected ? "selected" : ""}>${UI.escape(item)}</option>`)
      .join("");
  };

  UI.sectionOptions = function (project, selectedId) {
    const options = [`<option value="">Sin seccion</option>`];
    const children = new Map();
    project.sections.forEach((section) => {
      const key = section.parentId || "root";
      if (!children.has(key)) children.set(key, []);
      children.get(key).push(section);
    });
    function walk(parentId, level) {
      (children.get(parentId || "root") || [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((section) => {
          const prefix = level ? `${"--".repeat(level)} ` : "";
          options.push(`<option value="${section.id}" ${section.id === selectedId ? "selected" : ""}>${UI.escape(prefix + section.name)}</option>`);
          walk(section.id, level + 1);
        });
    }
    walk(null, 0);
    return options.join("");
  };

  UI.tagOptions = function (project, selectedIds) {
    const selected = selectedIds || [];
    return project.tags.map((tag) => (
      `<label class="pill-mini" style="color:${UI.escape(tag.color || "var(--accent)")};">
        <input type="checkbox" value="${tag.id}" ${selected.includes(tag.id) ? "checked" : ""}>
        ${UI.escape(tag.name)}
      </label>`
    )).join("") || `<span class="meta">No hay etiquetas creadas.</span>`;
  };

  UI.readCheckedTags = function (root) {
    return UI.qsa("[data-tag-picker] input:checked", root).map((input) => input.value);
  };

  UI.toast = function (message, kind) {
    const root = UI.qs("#toastRoot");
    const node = document.createElement("div");
    node.className = `toast ${kind || ""}`;
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      setTimeout(() => node.remove(), 240);
    }, 3200);
  };

  UI.openModal = function (title, bodyHtml, options) {
    const root = UI.qs("#modalRoot");
    const size = options && options.size === "small" ? " small" : "";
    root.classList.remove("hidden");
    root.innerHTML = `
      <section class="modal${size}" role="dialog" aria-modal="true">
        <header>
          <h2>${UI.escape(title)}</h2>
          <button class="modal-close" type="button" data-action="close-modal">X</button>
        </header>
        <div class="modal-body">${bodyHtml}</div>
      </section>
    `;
    const first = root.querySelector("input, textarea, select, button");
    if (first) setTimeout(() => first.focus(), 0);
    return root.querySelector(".modal");
  };

  UI.closeModal = function () {
    const root = UI.qs("#modalRoot");
    root.classList.add("hidden");
    root.innerHTML = "";
  };

  UI.confirm = function (title, message, confirmLabel, danger) {
    return new Promise((resolve) => {
      UI.openModal(title, `
        <p>${UI.escape(message)}</p>
        <div class="inline-actions">
          <button class="${danger ? "danger-action" : "action"}" data-confirm-yes type="button">${UI.escape(confirmLabel || "Confirmar")}</button>
          <button class="ghost-action" data-confirm-no type="button">Cancelar</button>
        </div>
      `, { size: "small" });
      const root = UI.qs("#modalRoot");
      root.querySelector("[data-confirm-yes]").addEventListener("click", () => { UI.closeModal(); resolve(true); });
      root.querySelector("[data-confirm-no]").addEventListener("click", () => { UI.closeModal(); resolve(false); });
    });
  };

  UI.promptFields = function (title, fields, submitLabel) {
    return new Promise((resolve) => {
      const body = `
        <form id="promptForm" class="form-grid one">
          ${fields.map((field) => `
            <label class="field">
              ${UI.escape(field.label)}
              ${field.type === "textarea"
                ? `<textarea name="${field.name}" ${field.required ? "required" : ""}>${UI.escape(field.value || "")}</textarea>`
                : `<input name="${field.name}" type="${field.type || "text"}" value="${UI.escape(field.value || "")}" ${field.required ? "required" : ""}>`}
            </label>
          `).join("")}
          <div class="inline-actions">
            <button class="action" type="submit">${UI.escape(submitLabel || "Guardar")}</button>
            <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
          </div>
        </form>
      `;
      UI.openModal(title, body, { size: "small" });
      UI.qs("#promptForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const result = {};
        fields.forEach((field) => { result[field.name] = String(formData.get(field.name) || "").trim(); });
        UI.closeModal();
        resolve(result);
      });
    });
  };

  UI.empty = function (title, text, actionLabel, action) {
    return `
      <section class="empty-state">
        <div>
          <h1>${UI.escape(title)}</h1>
          <p>${UI.escape(text)}</p>
          ${actionLabel ? `<button class="action" type="button" data-action="${action}">${UI.escape(actionLabel)}</button>` : ""}
        </div>
      </section>
    `;
  };

  UI.renderShell = function () {
    const app = window.ROA.App;
    if (!app || !app.data || !app.data.currentUserId) return;
    const project = UI.currentProject();
    UI.qs("#activeProjectTitle").textContent = project ? project.name : "Sin proyecto activo";
    UI.renderSidebar();
    if (window.ROA.Users) window.ROA.Users.renderProfileButton();
    window.ROA.Settings.applySettings(app.data.settings);
  };

  UI.renderSidebar = function () {
    const app = window.ROA.App;
    const root = UI.qs("#projectList");
    const user = window.ROA.Permissions.currentUser();
    root.innerHTML = app.data.projects.map((project) => `
      <button class="project-pill ${project.id === app.data.activeProjectId ? "active" : ""}" type="button" data-action="select-project" data-context-type="project" data-project-id="${project.id}">
        ${UI.escape(project.name)}
        <small>${UI.escape(project.visibility || "private")} / ${window.ROA.Permissions.roleFor(project, user && user.id)}</small>
      </button>
    `).join("") || `<div class="meta">No hay proyectos todavia.</div>`;
  };

  UI.renderWelcome = function () {
    UI.qs("#mainView").innerHTML = UI.empty(
      "Archivo listo",
      "Selecciona o crea un proyecto.",
      "Crear proyecto",
      "create-project"
    );
  };

  UI.renderBreadcrumbs = function (project, sectionId) {
    if (!sectionId) return `<nav class="crumbs"><button data-action="open-dashboard">Proyecto</button></nav>`;
    const sections = [];
    let current = project.sections.find((item) => item.id === sectionId);
    const guard = new Set();
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      sections.unshift(current);
      current = project.sections.find((item) => item.id === current.parentId);
    }
    return `
      <nav class="crumbs">
        <button data-action="open-dashboard">Proyecto</button>
        ${sections.map((section) => `<span>&gt;</span><button data-action="open-section" data-section-id="${section.id}">${UI.escape(section.name)}</button>`).join("")}
      </nav>
    `;
  };

  UI.renderTagsInline = function (project, tagIds) {
    const ids = tagIds || [];
    return ids.map((id) => {
      const tag = project.tags.find((item) => item.id === id);
      if (!tag) return "";
      return `<button class="tag-chip" style="color:${UI.escape(tag.color || "var(--accent)")}" data-action="open-tag-panel" data-context-type="tag" data-tag-id="${tag.id}" type="button">${UI.escape(tag.name)}</button>`;
    }).join("");
  };

  UI.renderWikiContent = function (content, project) {
    const escaped = UI.escape(content || "");
    return escaped.replace(/\[\[([^\]]+)\]\]/g, (match, name) => {
      const found = project.files.find((file) => file.title.toLowerCase() === name.trim().toLowerCase());
      const action = found ? "open-file" : "create-linked-file";
      const attr = found ? `data-file-id="${found.id}"` : `data-title="${UI.escape(name.trim())}"`;
      return `<button class="wiki-link" type="button" data-action="${action}" ${attr}>[[${UI.escape(name.trim())}]]</button>`;
    }).replace(/\n/g, "<br>");
  };

  UI.renderListRow = function (project, file) {
    const canEdit = window.ROA.Permissions.canEdit(project);
    return `
      <article class="list-row" data-context-type="file" data-file-id="${file.id}">
        <div>
          <strong>${UI.escape(file.title)}</strong>
          <span class="meta">${UI.fileTypeLabel(file.type)} / ${UI.escape(file.status || "Sin estado")}</span>
          <div class="tag-list">${UI.renderTagsInline(project, file.tags)}</div>
        </div>
        <div class="inline-actions">
          ${canEdit ? `<button class="ghost-action" type="button" data-action="toggle-favorite" data-file-id="${file.id}">${file.favorite ? "Favorito" : "Marcar"}</button>` : ""}
          <button class="action" type="button" data-action="open-file" data-file-id="${file.id}">Abrir</button>
          ${canEdit ? `<button class="danger-action" type="button" data-action="trash-file" data-file-id="${file.id}">Papelera</button>` : ""}
        </div>
      </article>
    `;
  };

  window.ROA = window.ROA || {};
  window.ROA.UI = UI;
})();
