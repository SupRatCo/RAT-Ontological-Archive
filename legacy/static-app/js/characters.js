(function () {
  const { UI, Storage } = window.ROA;

  const statNames = ["Fuerza", "Velocidad", "Resistencia", "Inteligencia", "Percepcion", "Carisma", "Estabilidad mental", "Control energetico", "Adaptabilidad", "Peligrosidad"];
  const relationTypes = ["aliado", "enemigo", "familia", "rival", "mentor", "discipulo", "interes romantico", "obsesion", "desconocido", "otro"];

  function ensureCharacterData(file) {
    file.internalSections = file.internalSections || window.ROA.Storage.defaultInternalSections("character");
    file.data = Object.assign({
      general: {},
      description: {},
      abilities: {},
      classification: {},
      stats: {},
      relations: [],
      images: { mainImageId: "", references: [] }
    }, file.data || {});
    file.data.images = Object.assign({ mainImageId: "", references: [] }, file.data.images || {});
    statNames.forEach((name) => {
      if (file.data.stats[name] == null) file.data.stats[name] = 0;
    });
    return file.data;
  }

  function field(section, key, label, value, textarea) {
    const path = `${section}.${key}`;
    return `
      <label class="field">${UI.escape(label)}
        ${textarea
          ? `<textarea data-char-path="${path}">${UI.escape(value || "")}</textarea>`
          : `<input data-char-path="${path}" value="${UI.escape(value || "")}">`}
      </label>
    `;
  }

  function renderCharacter(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    if (!window.ROA.Permissions.canViewItem(project, file)) {
      window.ROA.Permissions.accessScreen(project);
      return;
    }
    const canEdit = window.ROA.Permissions.canEdit(project);
    const data = ensureCharacterData(file);
    const relatedByTags = project.gallery.filter((media) => media.kind !== "video" && (media.tags || []).some((tagId) => (file.tags || []).includes(tagId)));
    const manualImages = project.gallery.filter((media) => (data.images.references || []).includes(media.id));
    const imageOptions = [`<option value="">Sin imagen principal</option>`].concat(
      project.gallery.map((image) => `<option value="${image.id}" ${data.images.mainImageId === image.id ? "selected" : ""}>${UI.escape(image.name)}</option>`)
    ).join("");
    document.querySelector("#mainView").innerHTML = `
      ${UI.renderBreadcrumbs(project, file.sectionId)}
      <section class="view-header">
        <div>
          <h1>${UI.escape(file.title)}</h1>
          <p>Ficha de personaje / entidad. Cambios guardados manualmente con soporte de etiquetas, relaciones e imagen principal.</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-characters">Personajes</button>
          ${canEdit ? `<button class="ghost-action" type="button" data-action="add-internal-section" data-file-id="${file.id}">Seccion interna</button>` : ""}
          ${canEdit ? `<button class="action" type="button" data-action="save-character" data-file-id="${file.id}">Guardar</button>` : ""}
          ${canEdit ? `<button class="danger-action" type="button" data-action="trash-file" data-file-id="${file.id}">Papelera</button>` : ""}
        </div>
      </section>
      <section class="panel">
        <div class="form-grid">
          <label class="field">Titulo de archivo<input id="charTitle" value="${UI.escape(file.title)}"></label>
          <label class="field">Estado<select id="charStatus">${UI.statusOptions(file.status)}</select></label>
          <label class="field">Seccion<select id="charSection">${UI.sectionOptions(project, file.sectionId)}</select></label>
          <label class="field">Imagen principal<select id="charMainImage">${imageOptions}</select></label>
          <label class="field">Visibilidad<select id="charVisibility"><option value="inherit" ${file.visibility === "inherit" ? "selected" : ""}>Heredar</option><option value="public" ${file.visibility === "public" ? "selected" : ""}>Publico</option><option value="private" ${file.visibility === "private" ? "selected" : ""}>Privado</option></select></label>
        </div>
        <div class="tag-list" data-tag-picker>${UI.tagOptions(project, file.tags)}</div>
      </section>

      <div class="tabs">
        ${["General", "Descripcion", "Habilidades", "Clasificacion", "Estadisticas", "Relaciones", "Imagenes"].map((tab, index) => `<button class="tab-button ${index === 0 ? "active" : ""}" data-action="switch-tab" data-tab="${tab}" type="button">${tab}</button>`).join("")}
      </div>

      <section class="panel tab-panel" data-panel="General">
        <h3>Datos generales</h3>
        <div class="form-grid">
          ${field("general", "firstName", "Nombre", data.general.firstName)}
          ${field("general", "lastName", "Apellido", data.general.lastName)}
          ${field("general", "alias", "Alias", data.general.alias)}
          ${field("general", "age", "Edad", data.general.age)}
          ${field("general", "gender", "Genero", data.general.gender)}
          ${field("general", "species", "Especie/Raza", data.general.species)}
          ${field("general", "religion", "Religion", data.general.religion)}
          ${field("general", "state", "Estado", data.general.state)}
          ${field("general", "origin", "Lugar de origen", data.general.origin)}
          ${field("general", "affiliation", "Afiliacion", data.general.affiliation)}
          ${field("general", "role", "Ocupacion/Rol", data.general.role)}
          ${field("general", "firstAppearance", "Primera aparicion", data.general.firstAppearance)}
          ${field("general", "projectStory", "Proyecto/Historia", data.general.projectStory)}
        </div>
      </section>

      <section class="panel tab-panel hidden" data-panel="Descripcion">
        <h3>Descripcion</h3>
        <div class="form-grid">
          ${field("description", "physical", "Descripcion fisica", data.description.physical, true)}
          ${field("description", "psychological", "Descripcion psicologica", data.description.psychological, true)}
          ${field("description", "history", "Historia breve", data.description.history, true)}
          ${field("description", "motivations", "Motivaciones", data.description.motivations, true)}
          ${field("description", "aspirations", "Aspiraciones", data.description.aspirations, true)}
          ${field("description", "fears", "Miedos", data.description.fears, true)}
          ${field("description", "trauma", "Trauma", data.description.trauma, true)}
          ${field("description", "morality", "Moralidad", data.description.morality, true)}
          ${field("description", "phrase", "Frase representativa", data.description.phrase, true)}
        </div>
      </section>

      <section class="panel tab-panel hidden" data-panel="Habilidades">
        <h3>Habilidades</h3>
        <div class="form-grid">
          ${field("abilities", "main", "Habilidades principales", data.abilities.main, true)}
          ${field("abilities", "techniques", "Tecnicas", data.abilities.techniques, true)}
          ${field("abilities", "transformations", "Transformaciones", data.abilities.transformations, true)}
          ${field("abilities", "weaknesses", "Debilidades", data.abilities.weaknesses, true)}
          ${field("abilities", "limits", "Limites", data.abilities.limits, true)}
          ${field("abilities", "cost", "Coste de habilidades", data.abilities.cost, true)}
          ${field("abilities", "energyType", "Tipo de energia", data.abilities.energyType)}
          ${field("abilities", "controlLevel", "Nivel de control", data.abilities.controlLevel)}
        </div>
      </section>

      <section class="panel tab-panel hidden" data-panel="Clasificacion">
        <h3>Clasificacion</h3>
        <div class="form-grid">
          ${field("classification", "hierarchy", "Jerarquia existencial", data.classification.hierarchy)}
          ${field("classification", "threatLevel", "Nivel de amenaza", data.classification.threatLevel)}
          ${field("classification", "entityType", "Tipo de entidad", data.classification.entityType)}
          ${field("classification", "energyCompatibility", "Compatibilidad energetica", data.classification.energyCompatibility)}
          ${field("classification", "ontologicalRisk", "Riesgo ontologico", data.classification.ontologicalRisk)}
        </div>
      </section>

      <section class="panel tab-panel hidden" data-panel="Estadisticas">
        <h3>Estadisticas</h3>
        <div class="item-list">
          ${statNames.map((name) => `
            <label class="stat-row">
              <span>${UI.escape(name)}</span>
              <input data-stat="${UI.escape(name)}" type="range" min="0" max="100" value="${Number(data.stats[name] || 0)}">
              <strong>${Number(data.stats[name] || 0)}</strong>
            </label>
          `).join("")}
        </div>
      </section>

      <section class="panel tab-panel hidden" data-panel="Relaciones">
        <h3>Relaciones</h3>
        <div class="item-list">
          ${(data.relations || []).map((rel) => {
            const target = project.files.find((item) => item.id === rel.targetId);
            return `
              <article class="list-row">
                <div>
                  <strong>${UI.escape(target ? target.title : "Archivo no encontrado")}</strong>
                  <span class="meta">${UI.escape(rel.type)} / ${UI.escape(rel.state || "")} / ${UI.escape(rel.importance || "")}</span>
                  <span>${UI.escape(rel.description || "")}</span>
                </div>
                <button class="danger-action" type="button" data-action="delete-relation" data-file-id="${file.id}" data-relation-id="${rel.id}">Eliminar</button>
              </article>
            `;
          }).join("") || `<p class="meta">Sin relaciones registradas.</p>`}
        </div>
        <button class="action" type="button" data-action="add-relation" data-file-id="${file.id}">Agregar relacion</button>
      </section>

      <section class="panel tab-panel hidden" data-panel="Imagenes">
        <h3>Imagenes</h3>
        ${data.images.mainImageId ? `<img class="image-preview" src="${UI.escape((project.gallery.find((image) => image.id === data.images.mainImageId) || {}).src || "")}" alt="">` : `<p class="meta">Sin imagen principal.</p>`}
        <h3>Imagenes relacionadas por etiqueta</h3>
        <div class="gallery-grid">
          ${relatedByTags.map((image) => `<article class="archive-card gallery-card"><img src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}"><strong>${UI.escape(image.name)}</strong></article>`).join("") || `<p class="meta">No hay imagenes con etiquetas compartidas.</p>`}
        </div>
        <h3>Imagenes asignadas manualmente</h3>
        <div class="gallery-grid">
          ${manualImages.map((image) => `<article class="archive-card gallery-card"><img src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}"><strong>${UI.escape(image.name)}</strong></article>`).join("") || `<p class="meta">No hay imagenes asignadas manualmente.</p>`}
        </div>
        ${canEdit ? `<button class="ghost-action" type="button" data-action="assign-character-image" data-file-id="${file.id}">Asignar imagen manual</button>` : ""}
        <button class="ghost-action" type="button" data-action="open-gallery">Abrir galeria</button>
      </section>

      <section class="panel">
        <h3>Secciones internas personalizadas</h3>
        ${window.ROA.Files.renderCustomSections(file)}
      </section>
    `;
  }

  function saveCharacter(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    const data = ensureCharacterData(file);
    file.title = document.querySelector("#charTitle").value.trim() || file.title;
    file.status = document.querySelector("#charStatus").value;
    file.sectionId = document.querySelector("#charSection").value || null;
    file.visibility = document.querySelector("#charVisibility").value || "inherit";
    file.tags = UI.readCheckedTags(document);
    data.images.mainImageId = document.querySelector("#charMainImage").value;
    UI.qsa("[data-char-path]").forEach((input) => {
      const [group, key] = input.dataset.charPath.split(".");
      data[group][key] = input.value;
    });
    UI.qsa("[data-stat]").forEach((input) => {
      data.stats[input.dataset.stat] = Number(input.value);
    });
    window.ROA.Files.saveCustomFields(file);
    file.updatedAt = Storage.now();
    project.updatedAt = Storage.now();
    window.ROA.App.save();
    renderCharacter(fileId);
    UI.toast("Personaje guardado.");
  }

  function switchTab(tab) {
    UI.qsa(".tab-button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
    UI.qsa(".tab-panel").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.panel !== tab));
  }

  function addRelation(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    const options = project.files.filter((item) => item.id !== fileId).map((item) => `<option value="${item.id}">${UI.escape(item.title)}</option>`).join("");
    UI.openModal("Agregar relacion", `
      <form id="relationForm" class="form-grid one">
        <label class="field">Archivo relacionado<select name="targetId" required>${options}</select></label>
        <label class="field">Tipo<select name="type">${relationTypes.map((item) => `<option value="${item}">${item}</option>`).join("")}</select></label>
        <label class="field">Estado<input name="state"></label>
        <label class="field">Importancia<input name="importance"></label>
        <label class="field">Descripcion<textarea name="description"></textarea></label>
        <div class="inline-actions">
          <button class="action" type="submit">Agregar</button>
          <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    `, { size: "small" });
    document.querySelector("#relationForm").addEventListener("submit", (event) => {
      event.preventDefault();
      ensureCharacterData(file);
      file.data.relations.push({ id: Storage.uid("rel"), ...Object.fromEntries(new FormData(event.currentTarget).entries()) });
      file.updatedAt = Storage.now();
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      UI.closeModal();
      renderCharacter(fileId);
      UI.toast("Relacion agregada.");
    });
  }

  function deleteRelation(fileId, relationId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file || !file.data || !file.data.relations) return;
    file.data.relations = file.data.relations.filter((item) => item.id !== relationId);
    file.updatedAt = Storage.now();
    project.updatedAt = Storage.now();
    window.ROA.App.save();
    renderCharacter(fileId);
  }

  function assignImage(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    const data = ensureCharacterData(file);
    const images = project.gallery.filter((item) => item.kind !== "video");
    UI.openModal("Asignar imagen", `
      <div class="gallery-grid">
        ${images.map((image) => `<button class="archive-card gallery-card" type="button" data-action="choose-character-image" data-file-id="${file.id}" data-image-id="${image.id}"><img src="${UI.escape(image.src)}" alt="${UI.escape(image.name)}"><strong>${UI.escape(image.name)}</strong></button>`).join("") || `<p class="meta">No hay imagenes disponibles.</p>`}
      </div>
    `);
  }

  function chooseImage(fileId, imageId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    const data = ensureCharacterData(file);
    data.images.references = Array.from(new Set([...(data.images.references || []), imageId]));
    file.updatedAt = Storage.now();
    window.ROA.App.save();
    UI.closeModal();
    renderCharacter(fileId);
  }

  window.ROA.Characters = { renderCharacter, saveCharacter, switchTab, addRelation, deleteRelation, ensureCharacterData, assignImage, chooseImage };
})();
