(function () {
  const KEY = "rat_ontological_archive_data_v1";
  const VERSION = 2;
  const HEAVY_CACHE_BYTES = 1024 * 1024;
  const cacheStatus = {
    lastSaveFailed: false,
    quotaExceeded: false,
    oldCacheDetected: false,
    lastError: "",
    lastStoredBytes: 0
  };

  function now() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function defaultSettings() {
    return {
      theme: "gold",
      appearanceMode: "og",
      volume: 70,
      brightness: 100,
      animations: true,
      background: "deepSpace",
      backgroundFit: "cover",
      backgroundOverlay: 35,
      customBackground: "",
      language: "es-latam",
      autosave: true,
      confirmations: true,
      uiFontScale: 100,
      performanceMode: false,
      visualQuality: "high",
      performanceBackground: "animated",
      reducedMotion: false,
      highContrast: false,
      disableGlows: false,
      disableShadows: false,
      disableTransitions: false,
      disableParticles: false,
      muteSounds: false,
      notificationSounds: true,
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

  function hasServerConfigured() {
    const config = window.ROA_CONFIG || {};
    return Boolean(config.API_URL || config.PRODUCTION_API_URL || config.LOCAL_API_URL);
  }

  function byteSize(value) {
    return new Blob([String(value || "")]).size;
  }

  function isDataUrl(value) {
    return /^data:/i.test(String(value || ""));
  }

  function stripHeavySettings(settings) {
    const clean = Object.assign(defaultSettings(), settings || {});
    if (isDataUrl(clean.customBackground)) clean.customBackground = "";
    if (isDataUrl(clean.banner)) clean.banner = "";
    return clean;
  }

  function stripHeavyUser(user) {
    return {
      id: user.id,
      username: user.username,
      avatar: isDataUrl(user.avatar) ? "" : (user.avatar || ""),
      createdAt: user.createdAt,
      projectIds: user.projectIds || [],
      notifications: (user.notifications || []).slice(0, 20),
      settings: stripHeavySettings(user.settings)
    };
  }

  function stripProjectForServer(project) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      visibility: project.visibility,
      editors: project.editors || [],
      readers: project.readers || [],
      accessRequests: project.accessRequests || [],
      dashboardModules: project.dashboardModules || coreDashboardModules(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      color: project.color || "",
      theme: project.theme || "",
      sections: [],
      files: [],
      tags: [],
      gallery: [],
      timeline: [],
      trash: []
    };
  }

  function dataForStorage(clean) {
    if (!hasServerConfigured()) return clean;
    return {
      version: clean.version,
      users: (clean.users || []).map(stripHeavyUser),
      currentUserId: clean.currentUserId,
      settings: stripHeavySettings(clean.settings),
      projects: (clean.projects || []).map(stripProjectForServer),
      activeProjectId: clean.activeProjectId
    };
  }

  function safeSetLocalStorage(key, value) {
    try {
      localStorage.setItem(key, value);
      cacheStatus.lastSaveFailed = false;
      cacheStatus.quotaExceeded = false;
      cacheStatus.lastError = "";
      cacheStatus.lastStoredBytes = byteSize(value);
      if (cacheStatus.lastStoredBytes <= HEAVY_CACHE_BYTES) cacheStatus.oldCacheDetected = false;
      return true;
    } catch (error) {
      const quota = error && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22 || error.code === 1014);
      cacheStatus.lastSaveFailed = true;
      cacheStatus.quotaExceeded = !!quota;
      cacheStatus.lastError = error && error.message ? error.message : "localStorage save failed";
      console.warn("R.O.A. localStorage save failed", { key, quota, error });
      if (quota) {
        try {
          localStorage.removeItem(key);
          localStorage.setItem(key, value);
          cacheStatus.lastSaveFailed = false;
          cacheStatus.quotaExceeded = false;
          cacheStatus.lastError = "";
          cacheStatus.lastStoredBytes = byteSize(value);
          if (cacheStatus.lastStoredBytes <= HEAVY_CACHE_BYTES) cacheStatus.oldCacheDetected = false;
          return true;
        } catch (retryError) {
          cacheStatus.lastError = retryError && retryError.message ? retryError.message : cacheStatus.lastError;
          console.warn("R.O.A. localStorage retry failed", { key, retryError });
        }
      }
      return false;
    }
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
      cacheStatus.oldCacheDetected = hasServerConfigured() && byteSize(raw) > HEAVY_CACHE_BYTES;
      cacheStatus.lastStoredBytes = byteSize(raw);
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
    safeSetLocalStorage(KEY, JSON.stringify(dataForStorage(clean)));
    return clean;
  }

  function resetAppData() {
    localStorage.removeItem(KEY);
    return defaultData();
  }

  function localStorageUsage() {
    let bytes = 0;
    const entries = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      const value = localStorage.getItem(key) || "";
      const size = byteSize(key) + byteSize(value);
      bytes += size;
      entries.push({ key, bytes: size });
    }
    entries.sort((a, b) => b.bytes - a.bytes);
    return {
      bytes,
      mb: bytes / (1024 * 1024),
      entries,
      cacheStatus: Object.assign({}, cacheStatus),
      oldCacheDetected: cacheStatus.oldCacheDetected,
      serverMode: hasServerConfigured()
    };
  }

  function clearLocalCache(data) {
    const token = localStorage.getItem("roa_server_token");
    const keep = new Set(["roa_server_token"]);
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) keys.push(localStorage.key(index));
    keys.forEach((key) => {
      if (!keep.has(key)) localStorage.removeItem(key);
    });
    if (token) localStorage.setItem("roa_server_token", token);
    cacheStatus.oldCacheDetected = false;
    cacheStatus.lastSaveFailed = false;
    cacheStatus.quotaExceeded = false;
    if (data) saveAppData(data);
    return localStorageUsage();
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
    hasServerConfigured,
    safeSetLocalStorage,
    localStorageUsage,
    clearLocalCache,
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
