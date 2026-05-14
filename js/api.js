(function () {
  const serverMode = location.protocol !== "file:";
  const baseUrl = "";
  const tokenKey = "roa_server_token";

  function token() {
    return localStorage.getItem(tokenKey) || "";
  }

  function setToken(value) {
    if (value) localStorage.setItem(tokenKey, value);
    else localStorage.removeItem(tokenKey);
  }

  async function request(path, options) {
    if (!serverMode) throw new Error("Server API unavailable in file mode");
    const init = Object.assign({ headers: {} }, options || {});
    if (!(init.body instanceof FormData)) init.headers["Content-Type"] = "application/json";
    if (token()) init.headers.Authorization = `Bearer ${token()}`;
    const response = await fetch(`${baseUrl}/api${path}`, init);
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch (_error) { data = { error: text || response.statusText }; }
    if (!response.ok) throw new Error(data.error || response.statusText);
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

  const api = {
    serverMode,
    token,
    setToken,
    request,
    health: () => request("/health"),
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
    getGallery: (projectId) => request(`/media/project/${projectId}`),
    getNotifications: () => request("/notifications"),
    requestAccess: (projectId, message) => request(`/access/projects/${projectId}/request`, json("POST", { message })),
    getAccessRequests: () => request("/access/requests"),
    decideAccessRequest: (requestId, accept) => request(`/access/requests/${requestId}/decision`, json("POST", { accept })),
    getForumPosts: (params) => request(`/forum/posts${params ? `?${new URLSearchParams(params)}` : ""}`),
    createForumPost: (data) => request("/forum/posts", json("POST", data)),
    getForumPost: (postId) => request(`/forum/posts/${postId}`),
    createForumComment: (postId, data) => request(`/forum/posts/${postId}/comments`, json("POST", data)),
    voteForumItem: (targetType, targetId, voteType) => request("/forum/vote", json("POST", { targetType, targetId, voteType })),
    saveForumPost: (postId) => request(`/forum/posts/${postId}/save`, json("POST"))
  };

  window.ROA = window.ROA || {};
  window.ROA.Api = api;
})();
