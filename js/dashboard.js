(function () {
  const { UI, Storage } = window.ROA;
  const protectedIds = new Set(["module_sections", "module_text_files", "module_gallery", "module_tags", "module_favorites", "module_trash"]);

  function countFor(project, module) {
    if (module.id === "module_sections") return project.sections.length;
    if (module.id === "module_text_files") return project.files.filter((file) => file.type === "text").length;
    if (module.id === "module_gallery") return project.gallery.length;
    if (module.id === "module_tags") return project.tags.length;
    if (module.id === "module_favorites") return project.files.filter((file) => file.favorite).length;
    if (module.id === "module_trash") return project.trash.length;
    return project.files.filter((file) => (file.dashboardModuleId && file.dashboardModuleId === module.id) || file.type === module.fileType).length;
  }

  function descriptionFor(module) {
    return module.description || {
      module_sections: "Arbol de secciones y subsecciones",
      module_text_files: "Notas, borradores y archivos wiki",
      module_gallery: "Imagenes y videos del proyecto",
      module_tags: "Taxonomia, estados y relaciones",
      module_favorites: "Archivos marcados como importantes",
      module_trash: "Elementos eliminados recuperables"
    }[module.id] || "Modulo personalizado del proyecto";
  }

  function actionFor(module) {
    return module.action || (module.type === "custom" ? "open-custom-module" : "open-dashboard");
  }

  function renderCards(project) {
    return (project.dashboardModules || Storage.coreDashboardModules())
      .filter((module) => module.visible !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((module) => `
        <button class="card-button" type="button" data-action="${actionFor(module)}" data-module-id="${module.id}" style="${module.color ? `border-color:${UI.escape(module.color)}` : ""}">
          <strong style="${module.color ? `color:${UI.escape(module.color)}` : ""}">${UI.escape(module.name)}</strong>
          <span>${UI.escape(descriptionFor(module))}</span>
          <span class="pill-mini">${countFor(project, module)} registros</span>
        </button>
      `).join("");
  }

  function openCustomizer() {
    const project = UI.currentProject();
    if (!project || !window.ROA.Permissions.canEdit(project)) return;
    UI.openModal("Personalizar Dashboard", `
      <section class="panel">
        <h3>Modulos visibles</h3>
        <div class="item-list">
          ${project.dashboardModules.sort((a, b) => (a.order || 0) - (b.order || 0)).map((module) => `
            <article class="list-row">
              <div>
                <strong>${UI.escape(module.name)}</strong>
                <span class="meta">${module.locked ? "Protegido" : "Personalizado"} / orden ${module.order || 0}</span>
              </div>
              <div class="inline-actions">
                <button class="ghost-action" data-action="edit-dashboard-module" data-module-id="${module.id}" type="button">Editar</button>
                ${module.locked ? "" : `<button class="danger-action" data-action="remove-dashboard-module" data-module-id="${module.id}" type="button">Quitar</button>`}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
      <section class="panel">
        <h3>Agregar modulo</h3>
        <form id="moduleForm" class="form-grid">
          <label class="field">Nombre<input name="name" required placeholder="Personajes, Capítulos, Lugares..."></label>
          <label class="field">Tipo de archivo
            <select name="fileType">
              <option value="character">Personaje</option>
              <option value="world">Mundo / Lugar</option>
              <option value="organization">Organizacion / Faccion</option>
              <option value="idea">Idea</option>
              <option value="generic">Generico</option>
            </select>
          </label>
          <label class="field">Color<input name="color" type="color" value="#ffd800"></label>
          <label class="field">Orden<input name="order" type="number" value="100"></label>
          <label class="field">Descripcion<textarea name="description"></textarea></label>
          <button class="action" type="submit">Agregar modulo</button>
        </form>
      </section>
    `);
    document.querySelector("#moduleForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      project.dashboardModules.push({
        id: Storage.uid("module"),
        name: values.name.trim(),
        type: "custom",
        action: "open-custom-module",
        locked: false,
        visible: true,
        fileType: values.fileType,
        color: values.color,
        description: values.description,
        order: Number(values.order || 100)
      });
      project.updatedAt = Storage.now();
      window.ROA.App.save();
      window.ROA.App.render();
      openCustomizer();
    });
  }

  function editModule(moduleId) {
    const project = UI.currentProject();
    const module = project && project.dashboardModules.find((item) => item.id === moduleId);
    if (!module || !window.ROA.Permissions.canEdit(project)) return;
    UI.openModal("Editar modulo", `
      <form id="editModuleForm" class="form-grid one">
        <label class="field">Nombre<input name="name" value="${UI.escape(module.name)}" required></label>
        <label class="field">Color<input name="color" type="color" value="${UI.escape(module.color || "#ffd800")}"></label>
        <label class="field">Orden<input name="order" type="number" value="${Number(module.order || 100)}"></label>
        <label class="field">Visible<select name="visible"><option value="true">Si</option><option value="false" ${module.visible === false ? "selected" : ""}>No</option></select></label>
        ${module.locked ? "" : `<label class="field">Tipo de archivo<input name="fileType" value="${UI.escape(module.fileType || "generic")}"></label>`}
        <label class="field">Descripcion<textarea name="description">${UI.escape(module.description || "")}</textarea></label>
        <button class="action" type="submit">Guardar</button>
      </form>
    `, { size: "small" });
    document.querySelector("#editModuleForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      module.name = values.name.trim();
      module.color = values.color;
      module.order = Number(values.order || module.order || 100);
      module.visible = values.visible === "true";
      module.description = values.description;
      if (!module.locked) module.fileType = values.fileType || module.fileType || "generic";
      window.ROA.App.save();
      window.ROA.App.render();
      openCustomizer();
    });
  }

  async function removeModule(moduleId) {
    const project = UI.currentProject();
    const module = project && project.dashboardModules.find((item) => item.id === moduleId);
    if (!module || module.locked || protectedIds.has(module.id)) return;
    const ok = await UI.confirm("Quitar modulo", `Quitar "${module.name}" del dashboard? Los archivos no se borran.`, "Quitar", true);
    if (!ok) return;
    project.dashboardModules = project.dashboardModules.filter((item) => item.id !== moduleId);
    window.ROA.App.save();
    window.ROA.App.render();
    openCustomizer();
  }

  function openCustomModule(moduleId) {
    const project = UI.currentProject();
    const module = project && project.dashboardModules.find((item) => item.id === moduleId);
    if (!module) return;
    window.ROA.Files.renderCollection(module.fileType || "generic", module.name, module.description || "Modulo personalizado.", module.id);
  }

  window.ROA = window.ROA || {};
  window.ROA.Dashboard = { renderCards, openCustomizer, editModule, removeModule, openCustomModule };
})();
