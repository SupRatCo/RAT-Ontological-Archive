(function () {
  const config = window.ROA_CONFIG || {};
  const configuredApiUrl = String(config.API_URL || config.PRODUCTION_API_URL || "").replace(/\/+$/, "").replace(/\/api$/i, "");
  const isHostedStatic = /(^|\.)github\.io$/i.test(location.hostname);
  const fallbackApiUrl = location.protocol === "file:" || isHostedStatic ? "" : location.origin;
  const baseUrl = configuredApiUrl || fallbackApiUrl;
  const serverMode = Boolean(baseUrl);
  const tokenKey = "roa_server_token";
  const recentErrors = [];
  const connection = {
    checked: false,
    ok: false,
    message: serverMode ? "Sin comprobar" : "API_URL no esta configurada.",
    latency: null,
    mode: ""
  };

  function recordError(path, detail) {
    recentErrors.unshift(Object.assign({
      path,
      at: new Date().toISOString()
    }, detail || {}));
    recentErrors.splice(8);
  }

  function clearErrors(predicate) {
    if (typeof predicate !== "function") {
      recentErrors.splice(0);
      return;
    }
    for (let index = recentErrors.length - 1; index >= 0; index -= 1) {
      if (predicate(recentErrors[index])) recentErrors.splice(index, 1);
    }
  }

  function clearHealthErrors() {
    clearErrors((item) => item.path === "/health" || /\/api\/health$/i.test(item.url || ""));
  }

  function token() {
    return localStorage.getItem(tokenKey) || "";
  }

  function setToken(value) {
    if (value) localStorage.setItem(tokenKey, value);
    else localStorage.removeItem(tokenKey);
  }

  function apiUrl(path) {
    const cleanPath = String(path || "");
    const apiPath = cleanPath.startsWith("/api/")
      ? cleanPath
      : `/api${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
    return `${baseUrl}${apiPath}`;
  }

  async function request(path, options) {
    if (!serverMode) {
      recordError(path, { type: "config", message: "API_URL no esta configurada." });
      throw new Error("API_URL no esta configurada. Configura js/config.js con la URL del backend online.");
    }
    const init = Object.assign({ headers: {} }, options || {});
    if (!(init.body instanceof FormData)) init.headers["Content-Type"] = "application/json";
    if (token()) init.headers.Authorization = `Bearer ${token()}`;
    let response;
    const url = apiUrl(path);
    const method = init.method || "GET";
    try {
      response = await fetch(url, init);
    } catch (error) {
      console.error("ROA API connection failed", {
        url,
        method,
        origin: location.origin,
        message: error.message,
        probableCause: "network/cors",
        error
      });
      recordError(path, { type: "connection", url, message: error.message || "Failed to fetch" });
      throw new Error("No se pudo conectar con el servidor. Revisa que el backend este activo y que API_URL/CORS sean correctos.");
    }
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch (_error) { data = { error: text || response.statusText }; }
    if (!response.ok) {
      console.error("ROA API request failed", { url, method, origin: location.origin, status: response.status, data });
      recordError(path, { type: "http", status: response.status, url, message: data.error || response.statusText || "Error de API." });
      if (response.status === 401) {
        setToken("");
        throw new Error(data.error || "Tu sesion expiro. Inicia sesion otra vez para continuar.");
      }
      if (response.status === 403) throw new Error("No tienes permisos para hacer esto.");
      if (response.status === 404) throw new Error("Ruta o registro no encontrado en el servidor.");
      if (response.status >= 500) throw new Error("Error del servidor al guardar o consultar datos.");
      throw new Error(data.error || response.statusText || "Error de API.");
    }
    return data;
  }

  const json = (method, body) => ({ method, body: JSON.stringify(body || {}) });

  async function login(username, password) {
    const data = await request("/auth/login", json("POST", { username, password }));
    setToken(data.token);
    return data;
  }

  async function register(username, password) {
    const data = await request("/auth/register", json("POST", { username, password }));
    setToken(data.token);
    return data;
  }

  async function logout() {
    try { await request("/auth/logout", json("POST")); } catch (_error) {}
    setToken("");
    return { ok: true };
  }

  async function checkConnection() {
    if (!serverMode) {
      Object.assign(connection, { checked: true, ok: false, message: "API_URL no esta configurada.", latency: null, mode: "" });
      return connection;
    }
    const started = performance.now();
    try {
      const health = await request("/health");
      Object.assign(connection, {
        checked: true,
        ok: true,
        message: "Servidor conectado.",
        latency: Math.round(performance.now() - started),
        mode: health.mode || "api",
        lastSuccessfulAt: new Date().toISOString(),
        lastTestedUrl: apiUrl("/health")
      });
      clearHealthErrors();
    } catch (error) {
      Object.assign(connection, {
        checked: true,
        ok: false,
        message: error.message || "No se pudo conectar con el servidor.",
        latency: null,
        mode: ""
      });
    }
    return connection;
  }

  function assetUrl(value) {
    if (!value) return "";
    if (/^(data:|https?:|blob:)/i.test(value)) return value;
    return `${baseUrl}${String(value).startsWith("/") ? "" : "/"}${value}`;
  }

  const api = {
    serverMode,
    requiresServer: isHostedStatic,
    baseUrl,
    apiUrl,
    healthUrl: () => serverMode ? apiUrl("/health") : "",
    token,
    setToken,
    request,
    recentErrors,
    clearErrors,
    clearHealthErrors,
    connection,
    assetUrl,
    health: () => request("/health"),
    checkConnection,
    login,
    register,
    logout,
    me: () => request("/auth/me"),
    updateMe: (data) => request("/users/me", json("PATCH", data)),
    uploadAvatar: (file) => {
      const form = new FormData();
      form.append("avatar", file);
      return request("/users/me/avatar", { method: "POST", body: form });
    },
    uploadBanner: (file) => {
      const form = new FormData();
      form.append("banner", file);
      return request("/users/me/banner", { method: "POST", body: form });
    },
    getPublicUser: (id) => request(`/users/${id}/public`),
    getProjects: () => request("/projects"),
    createProject: (data) => request("/projects", json("POST", data)),
    updateProject: (id, data) => request(`/projects/${id}`, json("PATCH", data)),
    deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
    getFiles: (projectId) => request(`/files/project/${projectId}`),
    createFile: (projectId, data) => request(`/files/project/${projectId}`, json("POST", data)),
    getFile: (fileId) => request(`/files/${fileId}`),
    updateFile: (fileId, data) => request(`/files/${fileId}`, json("PATCH", data)),
    deleteFile: (fileId) => request(`/files/${fileId}`, { method: "DELETE" }),
    getSections: (projectId) => request(`/sections/project/${projectId}`),
    createSection: (projectId, data) => request(`/sections/project/${projectId}`, json("POST", data)),
    updateSection: (id, data) => request(`/sections/${id}`, json("PATCH", data)),
    deleteSection: (id) => request(`/sections/${id}`, { method: "DELETE" }),
    getTags: (projectId) => request(`/tags/project/${projectId}`),
    createTag: (projectId, data) => request(`/tags/project/${projectId}`, json("POST", data)),
    updateTag: (id, data) => request(`/tags/${id}`, json("PATCH", data)),
    deleteTag: (id) => request(`/tags/${id}`, { method: "DELETE" }),
    uploadMedia: (projectId, file, metadata) => {
      const form = new FormData();
      form.append("media", file);
      Object.entries(metadata || {}).forEach(([key, value]) => form.append(key, value));
      return request(`/media/project/${projectId}`, { method: "POST", body: form });
    },
    deleteMedia: (mediaId) => request(`/media/${mediaId}`, { method: "DELETE" }),
    getGallery: (projectId) => request(`/media/project/${projectId}`),
    getNotifications: () => request("/notifications"),
    requestAccess: (projectId, message) => request(`/access/projects/${projectId}/request`, json("POST", { message })),
    getAccessRequests: () => request("/access/requests"),
    decideAccessRequest: (requestId, accept) => request(`/access/requests/${requestId}/decision`, json("POST", { accept })),
    getForumPosts: (params) => request(`/forum/posts${params ? `?${new URLSearchParams(params)}` : ""}`),
    createForumPost: (data) => request("/forum/posts", json("POST", data)),
    updateForumPost: (postId, data) => request(`/forum/posts/${postId}`, json("PUT", data)),
    deleteForumPost: (postId) => request(`/forum/posts/${postId}`, { method: "DELETE" }),
    getForumPost: (postId) => request(`/forum/posts/${postId}`),
    getForumComments: (postId, params) => request(`/forum/posts/${postId}/comments${params ? `?${new URLSearchParams(params)}` : ""}`),
    createForumComment: (postId, data) => request(`/forum/posts/${postId}/comments`, json("POST", data)),
    likeForumPost: (postId) => request(`/forum/posts/${postId}/like`, json("POST")),
    unlikeForumPost: (postId) => request(`/forum/posts/${postId}/like`, { method: "DELETE" }),
    voteForumItem: (targetType, targetId, voteType) => request("/forum/vote", json("POST", { targetType, targetId, voteType })),
    saveForumPost: (postId) => request(`/forum/posts/${postId}/save`, json("POST"))
  };

  window.ROA = window.ROA || {};
  window.ROA.Api = api;
})();
