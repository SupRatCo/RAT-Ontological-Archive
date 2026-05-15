(function () {
  const { UI, Storage } = window.ROA;

  function renderGallery(filterTag, filterType) {
    const project = UI.currentProject();
    if (!project) return UI.renderWelcome();
    const canEdit = window.ROA.Permissions.canEdit(project);
    const images = (project.gallery || []).filter((image) => (!filterTag || (image.tags || []).includes(filterTag)) && (!filterType || image.kind === filterType));
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div>
          <h1>Galeria</h1>
          <p>Imagenes y videos guardados localmente. Pueden vincularse a archivos y etiquetas.</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="return-from-gallery">Regresar</button>
          ${canEdit ? `<button class="action" type="button" data-action="trigger-gallery-upload">Subir multimedia</button>` : ""}
        </div>
      </section>
      <section class="panel">
        <label class="field">Filtrar por etiqueta
          <select data-action="gallery-filter">
            <option value="">Todas</option>
            ${project.tags.map((tag) => `<option value="${tag.id}" ${tag.id === filterTag ? "selected" : ""}>${UI.escape(tag.name)}</option>`).join("")}
          </select>
        </label>
        <label class="field">Filtrar por tipo
          <select data-action="gallery-type-filter">
            <option value="">Todo</option>
            <option value="image" ${filterType === "image" ? "selected" : ""}>Imagenes</option>
            <option value="video" ${filterType === "video" ? "selected" : ""}>Videos</option>
          </select>
        </label>
      </section>
      <section class="gallery-grid">
        ${images.map((image) => `
          <article class="archive-card gallery-card">
            ${image.kind === "video" ? `<div class="video-thumb">VIDEO</div>` : `<img loading="lazy" decoding="async" src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}">`}
            <strong>${UI.escape(image.name)}</strong>
            <span>${UI.escape(image.description || "Sin descripcion.")}</span>
            <span class="meta">${UI.escape(image.mimeType || image.kind || "media")} / ${Math.round((image.size || 0) / 1024)} KB</span>
            <div class="tag-list">${UI.renderTagsInline(project, image.tags)}</div>
            <div class="inline-actions">
              <button class="action" data-action="open-image" data-image-id="${image.id}" type="button">Abrir</button>
              ${canEdit ? `<button class="ghost-action" data-action="edit-image" data-image-id="${image.id}" type="button">Editar</button>` : ""}
              ${canEdit ? `<button class="danger-action" data-action="delete-image" data-image-id="${image.id}" type="button">Papelera</button>` : ""}
            </div>
          </article>
        `).join("") || UI.empty("Sin multimedia", "No hay imagenes o videos en la galeria.", canEdit ? "Subir multimedia" : "", "trigger-gallery-upload")}
      </section>
    `;
  }

  async function handleUpload(files) {
    const project = UI.currentProject();
    if (!project || !files || !files.length) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para subir multimedia.");
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      const health = await window.ROA.Api.health().catch(() => ({}));
      if (health.mode === "fallback-json") {
        return handleLocalUpload(files);
      }
      const uploaded = [];
      const rejected = [];
      for (const file of Array.from(files)) {
        try {
          const result = await window.ROA.Api.uploadMedia(project.id, file, { title: file.name.replace(/\.[^.]+$/, "") });
          uploaded.push(window.ROA.Storage.normalizeMedia({
            id: result.media.id,
            name: result.media.name,
            src: window.ROA.Api.assetUrl(result.media.src),
            data: window.ROA.Api.assetUrl(result.media.src),
            kind: result.media.kind,
            type: result.media.kind,
            mimeType: result.media.mimeType,
            size: (result.media.metadata || {}).size || file.size,
            uploadedAt: result.media.createdAt
          }));
        } catch (error) {
          try {
            const localMedia = await window.ROA.MediaStorage.readFile(file);
            if (localMedia.error) rejected.push(localMedia.error);
            else uploaded.push(localMedia);
          } catch (_readError) {
            rejected.push(error.message || "No se pudo subir un archivo.");
          }
        }
      }
      project.gallery.push(...uploaded);
      window.ROA.App.save();
      renderGallery();
      UI.toast(`${uploaded.length} archivo(s) agregado(s).`);
      rejected.forEach((message) => UI.toast(message));
      return;
    }
    return handleLocalUpload(files);
  }

  async function handleLocalUpload(files) {
    const project = UI.currentProject();
    const reads = Array.from(files).map((file) => window.ROA.MediaStorage.readFile(file));
    try {
      const results = await Promise.all(reads);
      const rejected = results.filter((item) => item.error);
      const images = results.filter((item) => !item.error);
      project.gallery.push(...images);
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      renderGallery();
      UI.toast(`${images.length} imagen(es) agregada(s).`);
      rejected.forEach((item) => UI.toast(item.error));
    } catch (error) {
      UI.toast("No se pudieron cargar las imagenes.");
      console.error(error);
    }
  }

  function openImage(imageId) {
    const project = UI.currentProject();
    const image = project && project.gallery.find((item) => item.id === imageId);
    if (!image) return;
    UI.openModal(image.name, `
      ${image.kind === "video" ? `<video class="media-preview" controls src="${UI.escape(image.src)}"></video>` : `<img class="image-preview" src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}">`}
      <p>${UI.escape(image.description || "Sin descripcion.")}</p>
      <p class="meta">${UI.escape(image.mimeType || "")} / ${Math.round((image.size || 0) / 1024)} KB / ${UI.formatDate(image.uploadedAt)}</p>
      <div class="tag-list">${UI.renderTagsInline(project, image.tags)}</div>
    `);
  }

  function editImage(imageId) {
    const project = UI.currentProject();
    const image = project && project.gallery.find((item) => item.id === imageId);
    if (!image) return;
    UI.openModal("Editar imagen", `
      <form id="imageForm" class="form-grid one">
        <label class="field">Nombre<input name="name" value="${UI.escape(image.name)}" required></label>
        <label class="field">Descripcion<textarea name="description">${UI.escape(image.description || "")}</textarea></label>
        <label class="field">Archivos relacionados / notas<textarea name="associated">${UI.escape((image.associated || image.relatedFiles || []).join("\\n"))}</textarea></label>
        <div class="tag-list" data-tag-picker>${UI.tagOptions(project, image.tags)}</div>
        <div class="inline-actions">
          <button class="action" type="submit">Guardar</button>
          <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    `, { size: "small" });
    document.querySelector("#imageForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      image.name = values.name.trim() || image.name;
      image.description = values.description;
      image.associated = values.associated.split(/\n+/).map((item) => item.trim()).filter(Boolean);
      image.relatedFiles = image.associated;
      image.tags = UI.readCheckedTags(event.currentTarget);
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      UI.closeModal();
      renderGallery();
    });
  }

  async function deleteImage(imageId) {
    const project = UI.currentProject();
    const image = project && project.gallery.find((item) => item.id === imageId);
    if (!image) return;
    const ok = await UI.confirm("Enviar imagen a papelera", `Enviar "${image.name}" a papelera?`, "Enviar", true);
    if (!ok) return;
    project.trash.push({ id: Storage.uid("trash"), kind: "image", title: image.name, payload: image, deletedAt: Storage.now() });
    project.gallery = project.gallery.filter((item) => item.id !== imageId);
    window.ROA.App.save();
    renderGallery();
  }

  window.ROA.Gallery = { renderGallery, handleUpload, openImage, editImage, deleteImage };
})();
