import { apiClient } from "./apiClient";

export const projectsApi = {
  list: () => apiClient.get("/projects"),
  create: (payload) => apiClient.post("/projects", payload),
  get: (id) => apiClient.get(`/projects/${id}`),
  update: (id, payload) => apiClient.patch(`/projects/${id}`, payload),
  delete: (id, confirmationName) => apiClient.delete(`/projects/${id}`, { confirmationName })
};
