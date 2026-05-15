(function () {
  const KEY = "rat_ontological_archive_data_v1";
  const VERSION = 2;

  function now() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function defaultSettings() {
    return {
      theme: "gold",
      volume: 70,
      brightness: 100,
      animations: true,
      background: "deepSpace",
      backgroundFit: "cover",
      backgroundOverlay: 35,
      customBackground: "",
      language: "es-latam",
      autosave: true,
      uiFontScale: 100,
      lastSavedAt: null
    };
  }

  function defaultData() {
    return {
      version: VERSION,
      users: [],
      currentUserId: null,
      settings: defaultSettings(),
      projects: [],
      activeProjectId: null
    };
  }

  function coreDashboardModules() {
    return [
      { id: "module_sections", name: "Secciones", type: "core", action: "open-sections", locked: true, visible: true, order: 10, color: "" },
      { id: "module_text_files", name: "Archivos de Texto", type: "core", action: "open-files-text", locked: true, visible: true, order: 20, color: "" },
      { id: "module_gallery", name: "Galeria", type: "core", action: "open-gallery", locked: true, visible: true, order: 30, color: "" },
      { id: "module_tags", name: "Etiquetas", type: "core", action: "open-tags", locked: true, visible: true, order: 40, color: "" },
      { id: "module_favorites", name: "Favoritos", type: "core", action: "open-favorites", locked: true, visible: true, order: 50, color: "" },
      { id: "module_trash", name: "Papelera", type: "core", action: "open-trash", locked: true, visible: true, order: 60, color: "" }
    ];
  }

  function defaultInternalSections(type) {
    if (type === "character") {
      return ["General", "Descripcion", "Habilidades", "Clasificacion", "Estadisticas", "Relaciones", "Imagenes"].map((name, index) => ({
        id: uid("internal"),
        name,
        locked: true,
        order: index + 1,
        fields: []
      }));
    }
    return [
      { id: uid("internal"), name: "Notas", locked: true, order: 1, fields: [] },
      { id: uid("internal"), name: "Campos personalizados", locked: false, order: 2, fields: [] }
    ];
  }

  function normalizeUser(user) {
    const clean = Object.assign({
      id: uid("user"),
      username: "Autor",
      passwordHash: "",
      avatar: "",
      createdAt: now(),
      projectIds: [],
      notifications: [],
      settings: defaultSettings()
    }, user || {});
    clean.settings = Object.assign(defaultSettings(), clean.settings || {});
    clean.notifications = clean.notifications || [];
    clean.projectIds = clean.projectIds || [];
    return clean;
  }

  function normalizeSection(section) {
    return Object.assign({
      id: uid("section"),
      name: "Seccion",
      description: "",
      color: "",
      icon: "",
      parentId: null,
      visibility: "inherit",
      createdAt: now(),
      updatedAt: now()
    }, section || {});
  }

  function normalizeFile(file) {
    const clean = Object.assign({
      id: uid("file"),
      type: "text",
      title: "Archivo",
      content: "",
      data: {},
      sectionId: null,
      tags: [],
      visibility: "inherit",
      internalSections: null,
      createdAt: now(),
      updatedAt: now(),
      favorite: false,
      archived: false,
      status: "Borrador"
    }, file || {});
    clean.tags = clean.tags || [];
    clean.data = clean.data || {};
    clean.internalSections = (clean.internalSections || defaultInternalSections(clean.type)).map((section, index) => Object.assign({
      id: uid("internal"),
      name: "Seccion interna",
      locked: false,
      order: index + 1,
      fields: []
    }, section));
    return clean;
  }

  function normalizeMedia(item) {
    const src = item && (item.data || item.src) ? (item.data || item.src) : "";
    const mimeType = (item && item.mimeType) || (src.match(/^data:([^;]+)/) || [])[1] || "image/*";
    const kind = (item && item.kind) || (item && item.type) || (mimeType.startsWith("video/") ? "video" : "image");
    return Object.assign({
      id: uid(kind === "video" ? "video" : "image"),
      name: "Multimedia",
      description: "",
      kind,
      type: kind,
      mimeType,
      data: src,
      src,
      tags: [],
      associated: [],
      relatedFiles: [],
      size: 0,
      uploadedAt: now(),
      visibility: "inherit"
    }, item || {}, { kind, type: kind, mimeType, data: src, src });
  }

  function normalizeProject(project, data) {
    const currentUserId = data && data.currentUserId;
    const ownerId = project && project.ownerId ? project.ownerId : currentUserId || null;
    const clean = Object.assign({
      id: uid("project"),
      name: "Proyecto sin nombre",
      description: "",
      ownerId,
      visibility: "private",
      editors: ownerId ? [ownerId] : [],
      readers: [],
      accessRequests: [],
      dashboardModules: coreDashboardModules(),
      createdAt: now(),
      updatedAt: now(),
      color: "",
      theme: "",
      sections: [],
      files: [],
      tags: [],
      gallery: [],
      timeline: [],
      trash: []
    }, project || {});

    clean.ownerId = clean.ownerId || ownerId;
    clean.visibility = clean.visibility || "private";
    clean.editors = Array.from(new Set([clean.ownerId].concat(clean.editors || []).filter(Boolean)));
    clean.readers = Array.from(new Set(clean.readers || []));
    clean.accessRequests = clean.accessRequests || [];
    clean.sections = (clean.sections || []).map(normalizeSection);
    clean.files = (clean.files || []).map(normalizeFile);
    clean.tags = clean.tags || [];
    clean.gallery = (clean.gallery || []).map(normalizeMedia);
    clean.timeline = clean.timeline || [];
    clean.trash = clean.trash || [];
    clean.dashboardModules = mergeDashboardModules(clean.dashboardModules);
    return clean;
  }

  function mergeDashboardModules(modules) {
    const byId = new Map();
    coreDashboardModules().forEach((module) => byId.set(module.id, module));
    (modules || []).forEach((module, index) => {
      const normalized = Object.assign({
        id: uid("module"),
        name: "Modulo",
        type: "custom",
        action: "open-custom-module",
        locked: false,
        visible: true,
        order: 100 + index,
        color: "",
        icon: "",
        fileType: "generic"
      }, module || {});
      if (byId.has(normalized.id)) {
        byId.set(normalized.id, Object.assign(byId.get(normalized.id), normalized, { locked: true, type: "core" }));
      } else {
        byId.set(normalized.id, normalized);
      }
    });
    return Array.from(byId.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function removeOldDemoProject(data) {
    const before = data.projects.length;
    data.projects = data.projects.filter((project) => {
      const looksLikeOldSeed = project.name === "JUNE" && /Proyecto de prueba|Archivo JUNE|SAC|OMEN/i.test(JSON.stringify(project).slice(0, 4000));
      return !looksLikeOldSeed;
    });
    if (before !== data.projects.length && !data.projects.some((project) => project.id === data.activeProjectId)) {
      data.activeProjectId = null;
    }
  }

  function normalizeData(data) {
    const base = defaultData();
    const clean = Object.assign(base, data || {});
    clean.version = VERSION;
    clean.settings = Object.assign(defaultSettings(), clean.settings || {});
    clean.users = (clean.users || []).map(normalizeUser);
    clean.projects = (clean.projects || []).map((project) => normalizeProject(project, clean));
    removeOldDemoProject(clean);
    clean.users.forEach((user) => {
      user.projectIds = clean.projects.filter((project) => project.ownerId === user.id).map((project) => project.id);
    });
    if (clean.currentUserId && !clean.users.some((user) => user.id === clean.currentUserId)) clean.currentUserId = null;
    if (clean.activeProjectId && !clean.projects.some((project) => project.id === clean.activeProjectId)) clean.activeProjectId = null;
    return clean;
  }

  function loadAppData() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultData();
      return normalizeData(JSON.parse(raw));
    } catch (error) {
      console.error("Could not load R.O.A. data", error);
      return defaultData();
    }
  }

  function saveAppData(data) {
    const clean = normalizeData(data);
    clean.settings.lastSavedAt = now();
    const user = clean.users.find((item) => item.id === clean.currentUserId);
    if (user) user.settings.lastSavedAt = clean.settings.lastSavedAt;
    localStorage.setItem(KEY, JSON.stringify(clean));
    return clean;
  }

  function resetAppData() {
    localStorage.removeItem(KEY);
    return defaultData();
  }

  function exportAllData(data) {
    return JSON.stringify(normalizeData(data || loadAppData()), null, 2);
  }

  function importAllData(json) {
    const incoming = typeof json === "string" ? JSON.parse(json) : json;
    return saveAppData(normalizeData(incoming));
  }

  function exportProject(projectId, data) {
    const source = normalizeData(data || loadAppData());
    const project = source.projects.find((item) => item.id === projectId);
    if (!project) throw new Error("Project not found");
    return JSON.stringify(project, null, 2);
  }

  function importProject(json, data) {
    const source = normalizeData(data || loadAppData());
    const currentUserId = source.currentUserId;
    const incoming = normalizeProject(typeof json === "string" ? JSON.parse(json) : json, source);
    incoming.id = uid("project");
    incoming.ownerId = currentUserId;
    incoming.editors = currentUserId ? [currentUserId] : [];
    incoming.readers = [];
    incoming.accessRequests = [];
    incoming.createdAt = incoming.createdAt || now();
    incoming.updatedAt = now();
    source.projects.push(incoming);
    source.activeProjectId = incoming.id;
    return saveAppData(source);
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type: type || "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  window.ROA = window.ROA || {};
  window.ROA.Storage = {
    KEY,
    VERSION,
    now,
    uid,
    defaultSettings,
    defaultData,
    coreDashboardModules,
    defaultInternalSections,
    normalizeData,
    normalizeProject,
    normalizeFile,
    normalizeMedia,
    normalizeUser,
    loadAppData,
    saveAppData,
    resetAppData,
    exportAllData,
    importAllData,
    exportProject,
    importProject,
    download
  };
})();
