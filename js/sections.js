(function () {
  const { UI, Storage } = window.ROA;

  function childrenMap(project) {
    const map = new Map();
    project.sections.forEach((section) => {
      const key = section.parentId || "root";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(section);
    });
    return map;
  }

  function renderTree(project, parentId, level) {
    const map = childrenMap(project);
    const canEdit = window.ROA.Permissions.canEdit(UI.currentProject());
    const nodes = (map.get(parentId || "root") || []).sort((a, b) => a.name.localeCompare(b.name));
    return nodes.map((section) => `
      <div class="tree-item" style="margin-left:${level * 18}px">
        <div>
          <strong>${UI.escape(section.name)}</strong>
          <span class="meta">${UI.escape(section.description || "Sin descripcion")}</span>
        </div>
        <div class="inline-actions">
          ${canEdit ? `<button class="ghost-action" data-action="create-subsection" data-section-id="${section.id}" type="button">Sub</button>` : ""}
          ${canEdit ? `<button class="ghost-action" data-action="edit-section" data-section-id="${section.id}" type="button">Editar</button>` : ""}
          <button class="action" data-action="open-section" data-section-id="${section.id}" type="button">Abrir</button>
          ${canEdit ? `<button class="danger-action" data-action="delete-section" data-section-id="${section.id}" type="button">Eliminar</button>` : ""}
        </div>
      </div>
      ${renderTree(project, section.id, level + 1)}
    `).join("");
  }

  function renderSections() {
    const project = UI.currentProject();
    if (!project) return UI.renderWelcome();
    const canEdit = window.ROA.Permissions.canEdit(project);
    const visibleSections = window.ROA.Permissions.filterSections(project, project.sections);
    document.querySelector("#mainView").innerHTML = `
      <section class="view-header">
        <div>
          <h1>Secciones</h1>
          <p>Arbol de clasificacion del proyecto. Las subsecciones pueden crecer sin limite razonable.</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-dashboard">Dashboard</button>
          ${canEdit ? `<button class="action" type="button" data-action="create-section">Nueva seccion</button>` : ""}
        </div>
      </section>
      <section class="panel tree-list">
        ${visibleSections.length ? renderTree(Object.assign({}, project, { sections: visibleSections }), null, 0) : UI.empty("Sin secciones", "No hay secciones visibles en este proyecto.", canEdit ? "Nueva seccion" : "", "create-section")}
      </section>
    `;
  }

  function renderSection(sectionId) {
    const project = UI.currentProject();
    const section = project && project.sections.find((item) => item.id === sectionId);
    if (!project || !section) {
      renderSections();
      return;
    }
    if (!window.ROA.Permissions.canViewItem(project, section)) {
      window.ROA.Permissions.accessScreen(project);
      return;
    }
    const canEdit = window.ROA.Permissions.canEdit(project);
    const subsections = project.sections.filter((item) => item.parentId === section.id);
    const files = window.ROA.Permissions.filterFiles(project, project.files.filter((file) => file.sectionId === section.id && !file.archived));
    document.querySelector("#mainView").innerHTML = `
      ${UI.renderBreadcrumbs(project, section.id)}
      <section class="view-header">
        <div>
          <h1>${UI.escape(section.name)}</h1>
          <p>${UI.escape(section.description || "Seccion sin descripcion.")}</p>
        </div>
        <div class="toolbar">
          <button class="ghost-action" type="button" data-action="open-sections">Arbol</button>
          ${canEdit ? `<button class="ghost-action" type="button" data-action="create-subsection" data-section-id="${section.id}">Nueva subseccion</button>` : ""}
          ${canEdit ? `<button class="action" type="button" data-action="create-file" data-section-id="${section.id}">Nuevo archivo</button>` : ""}
        </div>
      </section>
      <div class="split-layout">
        <section class="panel">
          <h3>Subsecciones</h3>
          <div class="item-list">
            ${subsections.map((item) => `
              <article class="list-row">
                <div><strong>${UI.escape(item.name)}</strong><span class="meta">${UI.escape(item.description || "")}</span></div>
                <button class="action" type="button" data-action="open-section" data-section-id="${item.id}">Abrir</button>
              </article>
            `).join("") || `<p class="meta">Sin subsecciones.</p>`}
          </div>
        </section>
        <section class="panel">
          <h3>Contenido directo</h3>
          <div class="item-list">
            ${files.map((file) => UI.renderListRow(project, file)).join("") || `<p class="meta">No hay archivos visibles en esta seccion.</p>${canEdit ? `<button class="action" type="button" data-action="create-file" data-section-id="${section.id}">Crear archivo</button>` : ""}`}
          </div>
        </section>
      </div>
    `;
  }

  async function createSection(parentId) {
    const project = UI.currentProject();
    if (!project) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para crear secciones.");
    const result = await UI.promptFields(parentId ? "Crear subseccion" : "Crear seccion", [
      { name: "name", label: "Nombre", required: true },
      { name: "description", label: "Descripcion", type: "textarea" }
    ], "Crear");
    if (!result.name) return;
    const section = {
      id: Storage.uid("section"),
      name: result.name,
      description: result.description,
      color: "",
      icon: "",
      parentId: parentId || null,
      visibility: "inherit",
      createdAt: Storage.now(),
      updatedAt: Storage.now()
    };
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try {
        const response = await window.ROA.Api.createSection(project.id, section);
        if (response.section && response.section.id) section.id = response.section.id;
      } catch (error) {
        UI.toast(error.message || "No se pudo guardar la seccion en servidor.");
        return;
      }
    }
    project.sections.push(section);
    project.updatedAt = Storage.now();
    window.ROA.App.save();
    window.ROA.App.render();
    UI.toast("Seccion creada.");
  }

  async function editSection(sectionId) {
    const project = UI.currentProject();
    const section = project && project.sections.find((item) => item.id === sectionId);
    if (!section) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para editar secciones.");
    const result = await UI.promptFields("Editar seccion", [
      { name: "name", label: "Nombre", value: section.name, required: true },
      { name: "description", label: "Descripcion", type: "textarea", value: section.description }
    ], "Guardar");
    if (!result.name) return;
    section.name = result.name;
    section.description = result.description;
    section.updatedAt = Storage.now();
    project.updatedAt = Storage.now();
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      try { await window.ROA.Api.updateSection(section.id, section); }
      catch (error) { UI.toast(error.message || "No se pudo actualizar la seccion en servidor."); return; }
    }
    window.ROA.App.save();
    window.ROA.App.render();
    UI.toast("Seccion actualizada.");
  }

  function descendantIds(project, sectionId) {
    const ids = [sectionId];
    let changed = true;
    while (changed) {
      changed = false;
      project.sections.forEach((section) => {
        if (section.parentId && ids.includes(section.parentId) && !ids.includes(section.id)) {
          ids.push(section.id);
          changed = true;
        }
      });
    }
    return ids;
  }

  async function deleteSection(sectionId) {
    const project = UI.currentProject();
    const section = project && project.sections.find((item) => item.id === sectionId);
    if (!section) return;
    if (!window.ROA.Permissions.canEdit(project)) return UI.toast("No tienes permiso para eliminar secciones.");
    const ok = await UI.confirm("Enviar a papelera", `Enviar la seccion "${section.name}" y sus subsecciones a papelera? Los archivos se quedaran sin seccion.`, "Enviar", true);
    if (!ok) return;
    const ids = descendantIds(project, sectionId);
    const removed = project.sections.filter((item) => ids.includes(item.id));
    project.trash.push({ id: Storage.uid("trash"), kind: "sections", title: section.name, payload: removed, deletedAt: Storage.now() });
    project.sections = project.sections.filter((item) => !ids.includes(item.id));
    project.files.forEach((file) => {
      if (ids.includes(file.sectionId)) file.sectionId = null;
    });
    project.updatedAt = Storage.now();
    if (window.ROA.Api && window.ROA.Api.serverMode) {
      for (const id of ids) {
        try { await window.ROA.Api.deleteSection(id); }
        catch (error) { UI.toast(error.message || "No se pudo eliminar una seccion en servidor."); return; }
      }
    }
    window.ROA.App.save();
    window.ROA.App.navigate("sections");
    UI.toast("Seccion enviada a papelera.");
  }

  window.ROA.Sections = {
    renderSections,
    renderSection,
    createSection,
    editSection,
    deleteSection
  };
})();
