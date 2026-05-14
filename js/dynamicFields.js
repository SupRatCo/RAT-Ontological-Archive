(function () {
  const fieldTypes = [
    ["short", "Texto corto"],
    ["long", "Texto largo"],
    ["number", "Número"],
    ["list", "Lista"],
    ["checkbox", "Checkbox"],
    ["select", "Selector"],
    ["date", "Fecha"],
    ["color", "Color"],
    ["url", "URL"],
    ["relation", "Relación con otro archivo"]
  ];

  function defaultSections(type) {
    if (type === "character") return ["General", "Descripción", "Habilidades", "Clasificación", "Estadísticas", "Relaciones", "Imágenes"];
    if (type === "world") return ["General", "Geografía", "Flora/Fauna", "Civilizaciones", "Energía"];
    if (type === "organization") return ["General", "Miembros", "Sectores", "Recursos", "Relaciones"];
    if (type === "idea") return ["General", "Desarrollo", "Referencias"];
    return ["General", "Notas"];
  }

  function ensure(file) {
    file.internalSections = file.internalSections && file.internalSections.length
      ? file.internalSections
      : defaultSections(file.type).map((name, index) => ({
        id: window.ROA.Storage.uid("internal"),
        name,
        locked: index < defaultSections(file.type).length,
        order: index + 1,
        fields: []
      }));
    file.data = file.data || {};
    file.data.activeInternalSectionId = file.data.activeInternalSectionId || file.internalSections[0].id;
    return file.internalSections;
  }

  function render(file) {
    const sections = ensure(file).sort((a, b) => (a.order || 0) - (b.order || 0));
    const active = sections.find((section) => section.id === file.data.activeInternalSectionId) || sections[0];
    return `
      <section class="internal-tabs">
        ${sections.map((section) => `
          <button class="tab-button ${section.id === active.id ? "active" : ""}" type="button" data-action="switch-internal-section" data-file-id="${file.id}" data-internal-section-id="${section.id}">
            ${window.ROA.UI.escape(section.name)} ${section.locked ? "" : `<span data-action="delete-internal-section" data-file-id="${file.id}" data-internal-section-id="${section.id}">×</span>`}
          </button>
        `).join("")}
        <button class="tab-button" type="button" data-action="add-internal-section" data-file-id="${file.id}">+</button>
      </section>
      <article class="panel internal-section" data-internal-section-id="${active.id}">
        <div class="view-header compact">
          <h3>${window.ROA.UI.escape(active.name)}</h3>
          <div class="inline-actions">
            <button class="ghost-action" type="button" data-action="add-custom-field" data-file-id="${file.id}" data-internal-section-id="${active.id}">+ Agregar campo</button>
            ${active.locked ? "" : `<button class="ghost-action" type="button" data-action="rename-internal-section" data-file-id="${file.id}" data-internal-section-id="${active.id}">Renombrar</button>`}
          </div>
        </div>
        <div class="form-grid dynamic-field-grid">
          ${(active.fields || []).map((field) => renderField(file, active, field)).join("") || `<p class="meta">Sin campos personalizados en esta sección.</p>`}
        </div>
      </article>
    `;
  }

  function renderField(file, section, field) {
    const UI = window.ROA.UI;
    const value = field.value == null ? "" : field.value;
    const remove = `<button class="mini-danger" type="button" data-action="delete-custom-field" data-file-id="${file.id}" data-internal-section-id="${section.id}" data-field-id="${field.id}">×</button>`;
    const attrs = `data-custom-field="${field.id}" data-internal-section-id="${section.id}"`;
    if (field.kind === "long") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<textarea ${attrs}>${UI.escape(value)}</textarea></label>`;
    if (field.kind === "number") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<input ${attrs} type="number" value="${UI.escape(value)}"></label>`;
    if (field.kind === "list") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<textarea ${attrs} placeholder="Un item por linea">${UI.escape(Array.isArray(value) ? value.join("\n") : value)}</textarea></label>`;
    if (field.kind === "checkbox") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<select ${attrs}><option value="false">No</option><option value="true" ${value === true || value === "true" ? "selected" : ""}>Si</option></select></label>`;
    if (field.kind === "select") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<select ${attrs}>${String(field.options || value || "Opción").split(/[,\n]/).map((option) => `<option value="${UI.escape(option.trim())}" ${option.trim() === value ? "selected" : ""}>${UI.escape(option.trim())}</option>`).join("")}</select></label>`;
    if (field.kind === "date") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<input ${attrs} type="date" value="${UI.escape(value)}"></label>`;
    if (field.kind === "color") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<input ${attrs} type="color" value="${UI.escape(value || "#ffd800")}"></label>`;
    if (field.kind === "url") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<input ${attrs} type="url" value="${UI.escape(value)}"></label>`;
    if (field.kind === "relation") return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<select ${attrs}><option value="">Sin relación</option>${window.ROA.UI.currentProject().files.map((item) => `<option value="${item.id}" ${item.id === value ? "selected" : ""}>${UI.escape(item.title)}</option>`).join("")}</select></label>`;
    return `<label class="field dynamic-field">${remove}${UI.escape(field.label)}<input ${attrs} value="${UI.escape(value)}"></label>`;
  }

  function save(file) {
    window.ROA.UI.qsa("[data-custom-field]", document.querySelector("#mainView")).forEach((input) => {
      const section = file.internalSections.find((item) => item.id === input.dataset.internalSectionId);
      const field = section && (section.fields || []).find((item) => item.id === input.dataset.customField);
      if (!field) return;
      if (field.kind === "list") field.value = input.value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
      else if (field.kind === "checkbox") field.value = input.value === "true";
      else field.value = input.value;
    });
  }

  function addField(file, sectionId) {
    const section = ensure(file).find((item) => item.id === sectionId);
    window.ROA.UI.openModal("Agregar campo", `
      <form id="customFieldForm" class="form-grid one">
        <label class="field">Nombre del campo<input name="label" required></label>
        <label class="field">Tipo<select name="kind">${fieldTypes.map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label>
        <label class="field">Valor inicial / opciones para selector<textarea name="value"></textarea></label>
        <button class="action" type="submit">Agregar</button>
      </form>
    `, { size: "small" });
    document.querySelector("#customFieldForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());
      section.fields = section.fields || [];
      section.fields.push({
        id: window.ROA.Storage.uid("field"),
        label: values.label,
        kind: values.kind,
        value: values.kind === "checkbox" ? false : values.value,
        options: values.kind === "select" ? values.value : ""
      });
      window.ROA.UI.closeModal();
      window.ROA.App.save();
      if (window.ROA.Files && window.ROA.Files.persistFile) window.ROA.Files.persistFile(file);
      window.ROA.Files.openFile(file.id);
    });
  }

  window.ROA = window.ROA || {};
  window.ROA.DynamicFields = { fieldTypes, ensure, render, save, addField };
})();
