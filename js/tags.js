(function () {
  const { UI, Storage } = window.ROA;

  const categories = ["Narrativa", "Ontologica", "Energetica", "Organizacion", "Mundo", "Personaje", "Estado", "Personalizada"];

  function renderTags() {
    const project = UI.currentProject();
    if (!project) return UI.renderWelcome();
    const canEdit = window.ROA.Permissions.canEdit(project);
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div>
          <h1>Etiquetas</h1>
          <p>Taxonomia del proyecto. Abre una etiqueta para ver todos los archivos vinculados.</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-dashboard">Dashboard</button>
          ${canEdit ? `<button class="action" type="button" data-action="create-tag">Nueva etiqueta</button>` : ""}
        </div>
      </section>
      <section class="card-grid">
        ${project.tags.map((tag) => `
          <article class="archive-card" style="border-color:${UI.escape(tag.color || "var(--accent)")}">
            <strong style="color:${UI.escape(tag.color || "var(--accent)")}">${UI.escape(tag.name)}</strong>
            <span>${UI.escape(tag.category || "Personalizada")}</span>
            <span>${UI.escape(tag.description || "Sin descripcion.")}</span>
            <div class="inline-actions">
              <button class="action" data-action="open-tag-panel" data-tag-id="${tag.id}" type="button">Ver usos</button>
              ${canEdit ? `<button class="ghost-action" data-action="edit-tag" data-tag-id="${tag.id}" type="button">Editar</button>` : ""}
              ${canEdit ? `<button class="danger-action" data-action="delete-tag" data-tag-id="${tag.id}" type="button">Eliminar</button>` : ""}
            </div>
          </article>
        `).join("") || UI.empty("Sin etiquetas", "No hay etiquetas todavia.", canEdit ? "Nueva etiqueta" : "", "create-tag")}
      </section>
    `;
  }

  function tagForm(tag) {
    return `
      <form id="tagForm" class="form-grid one">
        <label class="field">Nombre<input name="name" required value="${UI.escape(tag ? tag.name : "")}"></label>
        <label class="field">Color<input name="color" type="color" value="${UI.escape((tag && tag.color) || "#ffd800")}"></label>
        <label class="field">Categoria
          <select name="category">
            ${categories.map((item) => `<option value="${item}" ${tag && tag.category === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
        <label class="field">Descripcion<textarea name="description">${UI.escape(tag ? tag.description : "")}</textarea></label>
        <div class="inline-actions">
          <button class="action" type="submit">Guardar</button>
          <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    `;
  }

  function saveTagFromModal(existingId) {
    const project = UI.currentProject();
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para crear etiquetas.");
    const form = UI.qs("#tagForm");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      (async () => {
        const data = Object.fromEntries(new FormData(form).entries());
        if (existingId) {
          const tag = project.tags.find((item) => item.id === existingId);
          Object.assign(tag, data);
          if (window.ROA.Api && window.ROA.Api.serverMode) {
            try { await window.ROA.Api.updateTag(existingId, tag); }
            catch (error) { UI.toast(error.message || "No se pudo guardar la etiqueta en servidor."); return; }
          }
        } else {
          const tag = { id: Storage.uid("tag"), ...data, createdAt: Storage.now() };
          if (window.ROA.Api && window.ROA.Api.serverMode) {
            try {
              const response = await window.ROA.Api.createTag(project.id, tag);
              if (response.tag && response.tag.id) tag.id = response.tag.id;
            } catch (error) { UI.toast(error.message || "No se pudo crear la etiqueta en servidor."); return; }
          }
          project.tags.push(tag);
        }
        project.updatedAt = Storage.now();
        window.ROA.App.save();
        UI.closeModal();
        renderTags();
        UI.toast("Etiqueta guardada.");
      })();
    });
  }

  function createTag() {
    UI.openModal("Nueva etiqueta", tagForm(null), { size: "small" });
    saveTagFromModal(null);
  }

  function editTag(tagId) {
    const project = UI.currentProject();
    const tag = project && project.tags.find((item) => item.id === tagId);
    if (!tag) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para editar etiquetas.");
    UI.openModal("Editar etiqueta", tagForm(tag), { size: "small" });
    saveTagFromModal(tagId);
  }

  async function deleteTag(tagId) {
    const project = UI.currentProject();
    const tag = project && project.tags.find((item) => item.id === tagId);
    if (!tag) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para eliminar etiquetas.");
    const ok = await UI.confirm("Eliminar etiqueta", `Eliminar la etiqueta "${tag.name}" de todos los archivos?`, "Eliminar", true);
    if (!ok) return;
    project.tags = project.tags.filter((item) => item.id !== tagId);
    project.files.forEach((file) => { file.tags = (file.tags || []).filter((id) => id !== tagId); });
    project.gallery.forEach((image) => { image.tags = (image.tags || []).filter((id) => id !== tagId); });
    project.updatedAt = Storage.now();
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try { await window.ROA.Api.deleteTag(tagId); }
      catch (error) { UI.toast(error.message || "No se pudo eliminar la etiqueta en servidor."); return; }
    }
    window.ROA.App.save();
    renderTags();
    UI.toast("Etiqueta eliminada.");
  }

  function openTagPanel(tagId) {
    const project = UI.currentProject();
    const tag = project && project.tags.find((item) => item.id === tagId);
    if (!tag) return;
    const files = project.files.filter((file) => (file.tags || []).includes(tagId));
    const images = project.gallery.filter((image) => (image.tags || []).includes(tagId));
    UI.openModal(`Etiqueta: ${tag.name}`, `
      <section class="panel">
        <h3 style="color:${UI.escape(tag.color || "var(--accent)")}">${UI.escape(tag.name)}</h3>
        <p>${UI.escape(tag.description || "Sin descripcion.")}</p>
        <p class="meta">Categoria: ${UI.escape(tag.category || "Personalizada")}</p>
      </section>
      <section class="panel">
        <h3>Archivos relacionados</h3>
        <div class="item-list">
          ${files.map((file) => `
            <article class="list-row">
              <div><strong>${UI.escape(file.title)}</strong><span class="meta">${UI.fileTypeLabel(file.type)}</span></div>
              <button class="action" data-action="open-file" data-file-id="${file.id}" type="button">Abrir</button>
            </article>
          `).join("") || `<p class="meta">Ningun archivo usa esta etiqueta.</p>`}
        </div>
      </section>
      <section class="panel">
        <h3>Multimedia relacionada</h3>
        <div class="item-list">
          ${images.map((image) => `<span class="meta">${UI.escape(image.name)} / ${UI.escape(image.kind || "image")}</span>`).join("") || `<p class="meta">Ningun archivo multimedia usa esta etiqueta.</p>`}
        </div>
      </section>
    `);
  }

  window.ROA.Tags = { renderTags, createTag, editTag, deleteTag, openTagPanel };
})();
