(function () {
  const { UI, Storage } = window.ROA;

  const typeLabels = {
    text: "Archivo de texto",
    character: "Archivo de personaje",
    world: "Archivo de mundo / planeta",
    organization: "Archivo de organizacion",
    idea: "Archivo de idea",
    generic: "Archivo generico"
  };

  function defaultDataFor(type) {
    if (type === "character") {
      return { general: {}, description: {}, abilities: {}, classification: {}, stats: {}, relations: [], images: { mainImageId: "", references: [] } };
    }
    if (type === "world") {
      return { base: {}, geography: {}, life: {}, culture: {}, energy: {}, relations: [] };
    }
    if (type === "organization") {
      return { base: {}, sectors: [], members: [], relations: [] };
    }
    if (type === "idea") {
      return { category: "Otro", priority: "Media", ideaStatus: "Nueva", description: "", related: "" };
    }
    return {};
  }

  function renderCollection(type, title, description, moduleId) {
    const project = UI.currentProject();
    if (!project) return UI.renderWelcome();
    const canEdit = window.ROA.Permissions.canEdit(project);
    const files = window.ROA.Permissions.filterFiles(project, project.files.filter((file) => !file.archived && (!type || file.type === type) && (!moduleId || file.dashboardModuleId === moduleId || file.type === type)));
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div>
          <h1>${UI.escape(title)}</h1>
          <p>${UI.escape(description || "Registros del proyecto.")}</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-dashboard">Dashboard</button>
          ${canEdit ? `<button class="action" type="button" data-action="create-file" data-type="${type || ""}" data-module-id="${moduleId || ""}">Nuevo</button>` : ""}
        </div>
      </section>
      <section class="item-list">
        ${files.map((file) => UI.renderListRow(project, file)).join("") || UI.empty("Sin registros", "No hay archivos en esta vista.", "", "create-file")}
      </section>
    `;
  }

  function renderFavorites() {
    const project = UI.currentProject();
    if (!project) return UI.renderWelcome();
    const files = window.ROA.Permissions.filterFiles(project, project.files.filter((file) => file.favorite && !file.archived));
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div><h1>Favoritos</h1><p>Archivos marcados como importantes.</p></div>
        <button class="ghost-action" type="button" data-action="open-dashboard">Dashboard</button>
      </section>
      <section class="item-list">${files.map((file) => UI.renderListRow(project, file)).join("") || `<p class="meta">Sin favoritos.</p>`}</section>
    `;
  }

  function openFile(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    if (!window.ROA.Permissions.canViewItem(project, file)) {
      window.ROA.Permissions.accessScreen(project);
      return;
    }
    if (file.type === "character") {
      window.ROA.Characters.renderCharacter(fileId);
      return;
    }
    if (file.type === "text" || file.type === "generic") {
      renderTextEditor(file);
      return;
    }
    if (file.type === "world") {
      renderStructuredEditor(file, worldSchema(), "Mundo / Planeta");
      return;
    }
    if (file.type === "organization") {
      renderOrganization(file);
      return;
    }
    if (file.type === "idea") {
      renderIdea(file);
    }
  }

  function commonHeader(file, label) {
    const project = UI.currentProject();
    const canEdit = window.ROA.Permissions.canEdit(project);
    return `
      ${UI.renderBreadcrumbs(project, file.sectionId)}
      <section class="view-header">
        <div>
          <h1>${UI.escape(file.title)}</h1>
          <p>${UI.escape(label)} / ${UI.escape(file.status || "Sin estado")}</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-dashboard">Dashboard</button>
          ${canEdit ? `<button class="ghost-action" type="button" data-action="add-internal-section" data-file-id="${file.id}">Seccion interna</button>` : ""}
          ${canEdit ? `<button class="action" type="button" data-action="save-file" data-file-id="${file.id}">Guardar</button>` : ""}
          ${canEdit ? `<button class="danger-action" type="button" data-action="trash-file" data-file-id="${file.id}">Papelera</button>` : ""}
        </div>
      </section>
    `;
  }

  function renderMetaFields(file) {
    const project = UI.currentProject();
    return `
      <section class="panel">
        <div class="form-grid">
          <label class="field">Titulo<input id="fileTitle" value="${UI.escape(file.title)}"></label>
          <label class="field">Estado<select id="fileStatus">${UI.statusOptions(file.status)}</select></label>
          <label class="field">Seccion<select id="fileSection">${UI.sectionOptions(project, file.sectionId)}</select></label>
          <label class="field">Favorito<select id="fileFavorite"><option value="false">No</option><option value="true" ${file.favorite ? "selected" : ""}>Si</option></select></label>
          <label class="field">Visibilidad<select id="fileVisibility"><option value="inherit" ${file.visibility === "inherit" ? "selected" : ""}>Heredar</option><option value="public" ${file.visibility === "public" ? "selected" : ""}>Publico</option><option value="private" ${file.visibility === "private" ? "selected" : ""}>Privado</option></select></label>
        </div>
        <div class="tag-list" data-tag-picker>${UI.tagOptions(project, file.tags)}</div>
      </section>
    `;
  }

  function renderTextEditor(file) {
    const project = UI.currentProject();
    const contentHtml = window.ROA.Editor.markdownToHtml(file.content || "", project);
    document.querySelector("#mainView").innerHTML = `
      ${commonHeader(file, UI.fileTypeLabel(file.type))}
      ${renderMetaFields(file)}
      <div class="docs-layout">
        <section class="panel docs-panel">
          ${window.ROA.Editor.toolbar()}
          <div id="fileContent" class="docs-editor" contenteditable="true" spellcheck="true">${contentHtml}</div>
          <details class="docs-details">
            <summary>Notas</summary>
            <label class="field">Notas internas<textarea id="fileNotes">${UI.escape((file.data && file.data.notes) || "")}</textarea></label>
          </details>
          ${renderCustomSections(file)}
        </section>
      </div>
    `;
    document.querySelector("#fileContent").addEventListener("input", (event) => {
      window.ROA.State.markDirty(file.id);
    });
  }

  let saveTimer = null;
  function debounceSave(fileId) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveFile(fileId, true), 900);
  }

  function worldSchema() {
    return [
      ["base", "Datos base", [["name", "Nombre"], ["worldType", "Tipo de mundo"], ["galaxy", "Galaxia"], ["system", "Sistema"], ["dimension", "Dimension"], ["currentState", "Estado actual"], ["techLevel", "Nivel tecnologico"], ["energyLevel", "Nivel energetico"], ["dangerLevel", "Nivel de peligro"]]],
      ["geography", "Geografia", [["biomes", "Biomas", true], ["regions", "Regiones", true], ["climate", "Clima", true], ["oceans", "Oceanos", true], ["resources", "Recursos especiales", true], ["importantPlaces", "Lugares importantes", true]]],
      ["life", "Vida", [["flora", "Flora", true], ["fauna", "Fauna", true], ["races", "Razas", true], ["civilizations", "Civilizaciones", true], ["dominantCreatures", "Criaturas dominantes", true]]],
      ["culture", "Cultura", [["languages", "Idiomas", true], ["religions", "Religiones", true], ["customs", "Costumbres", true], ["government", "Gobierno", true], ["economy", "Economia", true], ["conflicts", "Conflictos", true]]],
      ["energy", "Energia", [["dominant", "Energia dominante", true], ["stability", "Estabilidad energetica", true], ["anomalies", "Anomalias", true], ["associatedGods", "Dioses asociados", true], ["restrictions", "Restricciones especiales", true]]]
    ];
  }

  function renderStructuredEditor(file, schema, label) {
    file.data = file.data || {};
    document.querySelector("#mainView").innerHTML = `
      ${commonHeader(file, label)}
      ${renderMetaFields(file)}
      ${schema.map(([group, groupLabel, fields]) => `
        <section class="panel">
          <h3>${UI.escape(groupLabel)}</h3>
          <div class="form-grid">
            ${fields.map(([key, fieldLabel, area]) => {
              const value = file.data[group] && file.data[group][key] ? file.data[group][key] : "";
              return `<label class="field">${UI.escape(fieldLabel)}${area ? `<textarea data-path="${group}.${key}">${UI.escape(value)}</textarea>` : `<input data-path="${group}.${key}" value="${UI.escape(value)}">`}</label>`;
            }).join("")}
          </div>
        </section>
      `).join("")}
      <section class="panel">
        <h3>Relaciones</h3>
        <textarea id="structuredRelations">${UI.escape(JSON.stringify(file.data.relations || [], null, 2))}</textarea>
      </section>
      <section class="panel">
        <h3>Secciones internas personalizadas</h3>
        ${renderCustomSections(file)}
      </section>
    `;
  }

  function renderOrganization(file) {
    file.data = Object.assign({ base: {}, sectors: [], members: [], relations: [] }, file.data || {});
    const schema = [
      ["base", "Datos base", [["name", "Nombre"], ["type", "Tipo"], ["founder", "Fundador"], ["leader", "Dueno/Lider actual"], ["goal", "Objetivo", true], ["philosophy", "Filosofia", true], ["moralAlignment", "Alineacion moral"], ["influenceLevel", "Nivel de influencia"], ["state", "Estado actual"]]]
    ];
    renderStructuredEditor(file, schema, "Organizacion");
    const main = document.querySelector("#mainView");
    main.insertAdjacentHTML("beforeend", `
      <section class="panel">
        <h3>Sectores</h3>
        <div class="item-list">
          ${file.data.sectors.map((sector) => `
            <article class="list-row">
              <div><strong>${UI.escape(sector.name)}</strong><span>${UI.escape(sector.description || "")}</span><span class="meta">${UI.escape(sector.importance || "")} / ${UI.escape(sector.leader || "")}</span></div>
              <button class="danger-action" type="button" data-action="delete-sector" data-file-id="${file.id}" data-sector-id="${sector.id}">Eliminar</button>
            </article>
          `).join("") || `<p class="meta">Sin sectores internos.</p>`}
        </div>
        <button class="action" type="button" data-action="add-sector" data-file-id="${file.id}">Agregar sector</button>
      </section>
      <section class="panel">
        <h3>Miembros</h3>
        <textarea id="organizationMembers">${UI.escape(JSON.stringify(file.data.members || [], null, 2))}</textarea>
      </section>
    `);
  }

  function renderIdea(file) {
    file.data = Object.assign({ category: "Otro", priority: "Media", ideaStatus: "Nueva", description: "", related: "" }, file.data || {});
    document.querySelector("#mainView").innerHTML = `
      ${commonHeader(file, "Idea")}
      ${renderMetaFields(file)}
      <section class="panel">
        <h3>Idea sin asignar</h3>
        <div class="form-grid">
          <label class="field">Categoria
            <select data-idea="category">${["Personaje", "Mundo", "Escena", "Capitulo", "Habilidad", "Frase", "Organizacion", "Lore", "Sistema de poder", "Otro"].map((item) => `<option value="${item}" ${file.data.category === item ? "selected" : ""}>${item}</option>`).join("")}</select>
          </label>
          <label class="field">Prioridad<input data-idea="priority" value="${UI.escape(file.data.priority || "")}"></label>
          <label class="field">Estado
            <select data-idea="ideaStatus">${["Nueva", "En desarrollo", "Usada", "Descartada", "Pendiente", "Rework"].map((item) => `<option value="${item}" ${file.data.ideaStatus === item ? "selected" : ""}>${item}</option>`).join("")}</select>
          </label>
          <label class="field">Posible seccion relacionada<select data-idea="related">${UI.sectionOptions(UI.currentProject(), file.data.related)}</select></label>
          <label class="field">Descripcion<textarea data-idea="description">${UI.escape(file.data.description || "")}</textarea></label>
        </div>
      </section>
    `;
  }

  async function createFile(defaultType, sectionId, title, moduleId) {
    const project = UI.currentProject();
    if (!project) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para crear archivos.");
    const html = `
      <form id="createFileForm" class="form-grid one">
        <label class="field">Tipo
          <select name="type">
            ${Object.entries(typeLabels).map(([key, label]) => `<option value="${key}" ${defaultType === key ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label class="field">Titulo<input name="title" required value="${UI.escape(title || "")}"></label>
        <label class="field">Seccion<select name="sectionId">${UI.sectionOptions(project, sectionId || "")}</select></label>
        <label class="field">Estado<select name="status">${UI.statusOptions("Borrador")}</select></label>
        <label class="field">Visibilidad<select name="visibility"><option value="inherit">Heredar</option><option value="public">Publico</option><option value="private">Privado</option></select></label>
        <div class="tag-list" data-tag-picker>${UI.tagOptions(project, [])}</div>
        <div class="inline-actions">
          <button class="action" type="submit">Crear</button>
          <button class="ghost-action" type="button" data-action="close-modal">Cancelar</button>
        </div>
      </form>
    `;
    UI.openModal("Crear archivo", html, { size: "small" });
    document.querySelector("#createFileForm").addEventListener("submit", (event) => {
      event.preventDefault();
      (async () => {
      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form).entries());
      const file = {
        id: Storage.uid("file"),
        type: values.type,
        title: values.title.trim(),
        content: "",
        data: defaultDataFor(values.type),
        sectionId: values.sectionId || null,
        tags: UI.readCheckedTags(form),
        createdAt: Storage.now(),
        updatedAt: Storage.now(),
        favorite: false,
        archived: false,
        status: values.status || "Borrador"
        ,
        visibility: values.visibility || "inherit",
        dashboardModuleId: moduleId || null,
        internalSections: Storage.defaultInternalSections(values.type)
      };
      if (window.ROA.Api && window.ROA.Api.serverMode) {
        try { await window.ROA.Api.createFile(project.id, file); } catch (error) { UI.toast(error.message || "No se pudo guardar en servidor."); }
      }
      project.files.push(file);
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      UI.closeModal();
      window.ROA.App.navigate("file", { fileId: file.id });
      UI.toast("Archivo creado.");
      })();
    });
  }

  function saveCommon(file) {
    const project = UI.currentProject();
    file.title = document.querySelector("#fileTitle").value.trim() || file.title;
    file.status = document.querySelector("#fileStatus").value;
    file.sectionId = document.querySelector("#fileSection").value || null;
    file.favorite = document.querySelector("#fileFavorite").value === "true";
    file.visibility = document.querySelector("#fileVisibility").value || "inherit";
    file.tags = UI.readCheckedTags(document.querySelector("#mainView"));
    file.updatedAt = Storage.now();
    project.updatedAt = Storage.now();
  }

  function serverPayload(file) {
    const dynamicFields = (file.internalSections || []).flatMap((section) => (section.fields || []).map((field, index) => ({
      id: field.id,
      internalSectionId: section.id,
      internalSectionName: section.name,
      label: field.label,
      fieldType: field.kind,
      value: field.value,
      sortOrder: index
    })));
    return Object.assign({}, file, { dynamicFields });
  }

  async function persistFile(file) {
    if (!file || !window.ROA.Api || !window.ROA.Api.serverMode) return true;
    try {
      await window.ROA.Api.updateFile(file.id, serverPayload(file));
      return true;
    } catch (error) {
      if (window.ROA.State) window.ROA.State.markError();
      UI.toast(error.message || "No se pudo guardar en servidor.");
      return false;
    }
  }

  async function saveFile(fileId, silent) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    saveCommon(file);
    if (file.type === "text" || file.type === "generic") {
      const contentNode = document.querySelector("#fileContent");
      file.content = window.ROA.Forum && window.ROA.Forum.safeHtml ? window.ROA.Forum.safeHtml(contentNode.innerHTML) : contentNode.innerHTML;
      file.data = file.data || {};
      file.data.notes = document.querySelector("#fileNotes").value;
    } else if (file.type === "world" || file.type === "organization") {
      file.data = file.data || {};
      UI.qsa("[data-path]", document.querySelector("#mainView")).forEach((input) => {
        const [group, key] = input.dataset.path.split(".");
        file.data[group] = file.data[group] || {};
        file.data[group][key] = input.value;
      });
      try {
        file.data.relations = JSON.parse(document.querySelector("#structuredRelations").value || "[]");
      } catch (error) {
        UI.toast("Relaciones JSON invalido. No se guardo esa parte.");
      }
      const members = document.querySelector("#organizationMembers");
      if (members) {
        try { file.data.members = JSON.parse(members.value || "[]"); } catch (error) { UI.toast("Miembros JSON invalido."); }
      }
    } else if (file.type === "idea") {
      UI.qsa("[data-idea]", document.querySelector("#mainView")).forEach((input) => {
        file.data[input.dataset.idea] = input.value;
      });
    }
    if (window.ROA.DynamicFields) window.ROA.DynamicFields.save(file);
    saveCustomFields(file);
    if (window.ROA.State) window.ROA.State.markSaving();
    window.ROA.App.save();
    const saved = await persistFile(file);
    if (!saved) return false;
    if (window.ROA.State) window.ROA.State.markSaved();
    if (!silent) {
      openFile(fileId);
      UI.toast("Archivo guardado.");
    }
    return true;
  }

  async function trashFile(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para eliminar archivos.");
    const ok = await UI.confirm("Enviar a papelera", `Enviar "${file.title}" a papelera?`, "Enviar", true);
    if (!ok) return;
    project.trash.push({ id: Storage.uid("trash"), kind: "file", title: file.title, payload: file, deletedAt: Storage.now() });
    project.files = project.files.filter((item) => item.id !== fileId);
    project.updatedAt = Storage.now();
    window.ROA.App.save();
    window.ROA.App.navigate("dashboard");
    UI.toast("Archivo enviado a papelera.");
  }

  function toggleFavorite(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    if (!window.ROA.Permissions.canEdit(project)) return;
    file.favorite = !file.favorite;
    file.updatedAt = Storage.now();
    window.ROA.App.save();
    window.ROA.App.render();
  }

  async function createLinkedFile(title) {
    await createFile("text", null, title);
  }

  function renderCustomSections(file) {
    if (window.ROA.DynamicFields) return window.ROA.DynamicFields.render(file);
    file.internalSections = file.internalSections || Storage.defaultInternalSections(file.type);
    const custom = file.internalSections.filter((section) => !section.locked || (section.fields || []).length);
    return `
      <div class="item-list">
        ${custom.map((section) => `
          <article class="panel internal-section" data-internal-section-id="${section.id}">
            <div class="view-header compact">
              <h3>${UI.escape(section.name)}</h3>
              <div class="inline-actions">
                <button class="ghost-action" type="button" data-action="add-custom-field" data-file-id="${file.id}" data-internal-section-id="${section.id}">Campo</button>
                ${section.locked ? "" : `<button class="ghost-action" type="button" data-action="rename-internal-section" data-file-id="${file.id}" data-internal-section-id="${section.id}">Renombrar</button><button class="danger-action" type="button" data-action="delete-internal-section" data-file-id="${file.id}" data-internal-section-id="${section.id}">Eliminar</button>`}
              </div>
            </div>
            <div class="form-grid">
              ${(section.fields || []).map((field) => renderCustomField(field)).join("") || `<p class="meta">Sin campos personalizados.</p>`}
            </div>
          </article>
        `).join("") || `<p class="meta">Sin secciones internas personalizadas.</p>`}
      </div>
    `;
  }

  function renderCustomField(field) {
    const label = UI.escape(field.label || "Campo");
    const value = field.value == null ? "" : field.value;
    if (field.kind === "long") return `<label class="field">${label}<textarea data-custom-field="${field.id}">${UI.escape(value)}</textarea></label>`;
    if (field.kind === "list") return `<label class="field">${label}<textarea data-custom-field="${field.id}" placeholder="Un item por linea">${UI.escape(Array.isArray(value) ? value.join("\n") : value)}</textarea></label>`;
    if (field.kind === "checkbox") return `<label class="field">${label}<select data-custom-field="${field.id}"><option value="false">No</option><option value="true" ${value === true || value === "true" ? "selected" : ""}>Si</option></select></label>`;
    return `<label class="field">${label}<input data-custom-field="${field.id}" value="${UI.escape(value)}"></label>`;
  }

  function saveCustomFields(file) {
    UI.qsa("[data-custom-field]", document.querySelector("#mainView")).forEach((input) => {
      const fieldId = input.dataset.customField;
      (file.internalSections || []).forEach((section) => {
        const field = (section.fields || []).find((item) => item.id === fieldId);
        if (!field) return;
        if (field.kind === "list") field.value = input.value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
        else if (field.kind === "checkbox") field.value = input.value === "true";
        else field.value = input.value;
      });
    });
  }

  async function addInternalSection(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file || !window.ROA.Permissions.canEdit(project)) return;
    const result = await UI.promptFields("Nueva seccion interna", [
      { name: "name", label: "Nombre", required: true }
    ], "Crear");
    if (!result.name) return;
    file.internalSections = file.internalSections || [];
    file.internalSections.push({ id: Storage.uid("internal"), name: result.name, locked: false, order: file.internalSections.length + 1, fields: [] });
    window.ROA.App.save();
    persistFile(file);
    openFile(fileId);
  }

  async function renameInternalSection(fileId, sectionId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    const section = file && (file.internalSections || []).find((item) => item.id === sectionId);
    if (!section || section.locked) return;
    const result = await UI.promptFields("Renombrar seccion", [{ name: "name", label: "Nombre", value: section.name, required: true }], "Guardar");
    if (!result.name) return;
    section.name = result.name;
    window.ROA.App.save();
    persistFile(file);
    openFile(fileId);
  }

  async function deleteInternalSection(fileId, sectionId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    const section = (file.internalSections || []).find((item) => item.id === sectionId);
    if (!section || section.locked) return;
    const ok = await UI.confirm("Borrar seccion interna", `Borrar "${section.name}" y todos sus campos?`, "Borrar", true);
    if (!ok) return;
    file.internalSections = (file.internalSections || []).filter((item) => item.id !== sectionId);
    if (file.data && file.data.activeInternalSectionId === sectionId) file.data.activeInternalSectionId = (file.internalSections[0] || {}).id;
    window.ROA.App.save();
    persistFile(file);
    openFile(fileId);
  }

  function addCustomField(fileId, sectionId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (file && window.ROA.DynamicFields) {
      window.ROA.DynamicFields.addField(file, sectionId);
      return;
    }
    const section = file && (file.internalSections || []).find((item) => item.id === sectionId);
    if (!section) return;
    UI.openModal("Agregar campo", `
      <form id="customFieldForm" class="form-grid one">
        <label class="field">Nombre<input name="label" required></label>
        <label class="field">Tipo<select name="kind"><option value="short">Texto corto</option><option value="long">Texto largo</option><option value="list">Lista</option><option value="checkbox">Checkbox</option></select></label>
        <button class="action" type="submit">Agregar</button>
      </form>
    `, { size: "small" });
    document.querySelector("#customFieldForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      section.fields = section.fields || [];
      section.fields.push({ id: Storage.uid("field"), label: values.label, kind: values.kind, value: values.kind === "checkbox" ? false : "" });
      window.ROA.App.save();
      UI.closeModal();
      openFile(fileId);
    });
  }

  function switchInternalSection(fileId, sectionId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    file.data = file.data || {};
    file.data.activeInternalSectionId = sectionId;
    window.ROA.App.save();
    openFile(fileId);
  }

  async function deleteCustomField(fileId, sectionId, fieldId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    const section = file && (file.internalSections || []).find((item) => item.id === sectionId);
    if (!section) return;
    const ok = await UI.confirm("Borrar campo", "¿Seguro que quieres borrar este campo?", "Borrar", true);
    if (!ok) return;
    section.fields = (section.fields || []).filter((field) => field.id !== fieldId);
    window.ROA.App.save();
    persistFile(file);
    openFile(fileId);
  }

  function addSector(fileId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file) return;
    UI.openModal("Agregar sector", `
      <form id="sectorForm" class="form-grid one">
        <label class="field">Nombre<input name="name" required></label>
        <label class="field">Descripcion<textarea name="description"></textarea></label>
        <label class="field">Importancia<input name="importance"></label>
        <label class="field">Lider<input name="leader"></label>
        <label class="field">Miembros<textarea name="members"></textarea></label>
        <label class="field">Recursos<textarea name="resources"></textarea></label>
        <label class="field">Secretos<textarea name="secrets"></textarea></label>
        <button class="action" type="submit">Agregar</button>
      </form>
    `, { size: "small" });
    document.querySelector("#sectorForm").addEventListener("submit", (event) => {
      event.preventDefault();
      file.data.sectors = file.data.sectors || [];
      file.data.sectors.push({ id: Storage.uid("sector"), ...Object.fromEntries(new FormData(event.currentTarget).entries()) });
      file.updatedAt = Storage.now();
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      UI.closeModal();
      openFile(fileId);
    });
  }

  function deleteSector(fileId, sectorId) {
    const project = UI.currentProject();
    const file = project && project.files.find((item) => item.id === fileId);
    if (!file || !file.data) return;
    file.data.sectors = (file.data.sectors || []).filter((item) => item.id !== sectorId);
    window.ROA.App.save();
    openFile(fileId);
  }

  function renderTimeline() {
    const project = UI.currentProject();
    const events = (project.timeline || []).slice().sort((a, b) => String(a.era || "").localeCompare(String(b.era || "")));
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div><h1>Cronologia</h1><p>Eventos ordenados por fecha o era.</p></div>
        <div class="toolbar"><button class="ghost-action" data-action="open-dashboard">Dashboard</button><button class="action" data-action="add-event">Nuevo evento</button></div>
      </section>
      <section class="item-list">
        ${events.map((event) => `
          <article class="list-row">
            <div><strong>${UI.escape(event.title)}</strong><span class="meta">${UI.escape(event.era || "")} / ${UI.escape(event.importance || "")}</span><span>${UI.escape(event.description || "")}</span></div>
            <button class="danger-action" data-action="delete-event" data-event-id="${event.id}" type="button">Eliminar</button>
          </article>
        `).join("") || `<p class="meta">Sin eventos.</p>`}
      </section>
    `;
  }

  function addEvent() {
    const project = UI.currentProject();
    UI.openModal("Nuevo evento", `
      <form id="eventForm" class="form-grid one">
        <label class="field">Titulo<input name="title" required></label>
        <label class="field">Fecha o era<input name="era"></label>
        <label class="field">Importancia<input name="importance"></label>
        <label class="field">Descripcion<textarea name="description"></textarea></label>
        <div class="tag-list" data-tag-picker>${UI.tagOptions(project, [])}</div>
        <button class="action" type="submit">Crear</button>
      </form>
    `, { size: "small" });
    document.querySelector("#eventForm").addEventListener("submit", (event) => {
      event.preventDefault();
      project.timeline = project.timeline || [];
      project.timeline.push({ id: Storage.uid("event"), ...Object.fromEntries(new FormData(event.currentTarget).entries()), tags: UI.readCheckedTags(event.currentTarget), characters: [], worlds: [], organizations: [], createdAt: Storage.now(), updatedAt: Storage.now() });
      window.ROA.App.save();
      UI.closeModal();
      renderTimeline();
    });
  }

  function deleteEvent(eventId) {
    const project = UI.currentProject();
    project.timeline = (project.timeline || []).filter((event) => event.id !== eventId);
    window.ROA.App.save();
    renderTimeline();
  }

  function renderTrash() {
    const project = UI.currentProject();
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div><h1>Papelera</h1><p>Elementos recuperables antes de eliminacion definitiva.</p></div>
        <button class="ghost-action" data-action="open-dashboard">Dashboard</button>
      </section>
      <section class="trash-list">
        ${(project.trash || []).map((item) => `
          <article class="list-row">
            <div><strong>${UI.escape(item.title)}</strong><span class="meta">${UI.escape(item.kind)} / ${UI.formatDate(item.deletedAt)}</span></div>
            <div class="inline-actions">
              <button class="action" data-action="restore-trash" data-trash-id="${item.id}" type="button">Restaurar</button>
              <button class="danger-action" data-action="delete-trash" data-trash-id="${item.id}" type="button">Eliminar definitivo</button>
            </div>
          </article>
        `).join("") || `<p class="meta">La papelera esta vacia.</p>`}
      </section>
    `;
  }

  function restoreTrash(trashId) {
    const project = UI.currentProject();
    const item = project.trash.find((entry) => entry.id === trashId);
    if (!item) return;
    if (item.kind === "file") project.files.push(item.payload);
    if (item.kind === "sections") project.sections.push(...item.payload);
    if (item.kind === "image") project.gallery.push(item.payload);
    project.trash = project.trash.filter((entry) => entry.id !== trashId);
    window.ROA.App.save();
    renderTrash();
  }

  async function deleteTrash(trashId) {
    const project = UI.currentProject();
    const ok = await UI.confirm("Eliminar definitivamente", "Esta accion no se puede deshacer.", "Eliminar", true);
    if (!ok) return;
    project.trash = project.trash.filter((entry) => entry.id !== trashId);
    window.ROA.App.save();
    renderTrash();
  }

  function renderRelations() {
    const project = UI.currentProject();
    const rows = project.files.map((file) => {
      const relations = file.data && file.data.relations ? file.data.relations : [];
      if (!relations.length) return "";
      return `
        <article class="archive-card">
          <strong>${UI.escape(file.title)}</strong>
          <div class="relation-list">
            ${relations.map((rel) => {
              const target = project.files.find((item) => item.id === rel.targetId);
              return `<span>├─ ${UI.escape(rel.type || "vinculado a")} ${UI.escape(target ? target.title : rel.targetId || "registro externo")}</span>`;
            }).join("")}
          </div>
        </article>
      `;
    }).join("");
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header"><div><h1>Relaciones</h1><p>Mapa textual preparado para evolucionar a grafo visual.</p></div><button class="ghost-action" data-action="open-dashboard">Dashboard</button></section>
      <section class="card-grid">${rows || `<p class="meta">Sin relaciones registradas.</p>`}</section>
    `;
  }

  function renderSearch() {
    const project = UI.currentProject();
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header"><div><h1>Buscador global</h1><p>Busca por titulo, contenido, notas, descripcion y etiquetas.</p></div><button class="ghost-action" data-action="open-dashboard">Dashboard</button></section>
      <section class="search-row">
        <input id="searchQuery" placeholder="Buscar...">
        <select id="searchType"><option value="">Tipo</option>${Object.entries(typeLabels).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select>
        <select id="searchSection">${UI.sectionOptions(project, "")}</select>
        <select id="searchTag"><option value="">Etiqueta</option>${project.tags.map((tag) => `<option value="${tag.id}">${UI.escape(tag.name)}</option>`).join("")}</select>
        <select id="searchFavorite"><option value="">Favorito</option><option value="true">Solo favoritos</option></select>
      </section>
      <section id="searchResults" class="item-list"></section>
    `;
    ["searchQuery", "searchType", "searchSection", "searchTag", "searchFavorite"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", runSearch));
    runSearch();
  }

  function searchableText(file, project) {
    const tagNames = (file.tags || []).map((id) => (project.tags.find((tag) => tag.id === id) || {}).name).join(" ");
    return `${file.title} ${file.content || ""} ${JSON.stringify(file.data || {})} ${file.status || ""} ${tagNames}`.toLowerCase();
  }

  function runSearch() {
    const project = UI.currentProject();
    const query = document.querySelector("#searchQuery").value.trim().toLowerCase();
    const type = document.querySelector("#searchType").value;
    const section = document.querySelector("#searchSection").value;
    const tag = document.querySelector("#searchTag").value;
    const favorite = document.querySelector("#searchFavorite").value;
    const results = window.ROA.Permissions.filterFiles(project, project.files).filter((file) => {
      if (type && file.type !== type) return false;
      if (section && file.sectionId !== section) return false;
      if (tag && !(file.tags || []).includes(tag)) return false;
      if (favorite && !file.favorite) return false;
      return !query || searchableText(file, project).includes(query);
    });
    document.querySelector("#searchResults").innerHTML = results.map((file) => UI.renderListRow(project, file)).join("") || `<p class="meta">Sin resultados.</p>`;
  }

  window.ROA.Files = {
    renderCollection,
    renderFavorites,
    openFile,
    createFile,
    saveFile,
    persistFile,
    trashFile,
    toggleFavorite,
    createLinkedFile,
    addSector,
    deleteSector,
    renderTimeline,
    addEvent,
    deleteEvent,
    renderTrash,
    restoreTrash,
    deleteTrash,
    renderRelations,
    renderSearch
    ,
    addInternalSection,
    renameInternalSection,
    deleteInternalSection,
    addCustomField,
    renderCustomSections,
    saveCustomFields,
    switchInternalSection,
    deleteCustomField
  };
})();
