import { apiClient } from "./apiClient";

export const documentsApi = {
  list: (projectId) => apiClient.get(`/documents/project/${projectId}`),
  create: (projectId, payload) => apiClient.post(`/documents/project/${projectId}`, payload),
  get: (id) => apiClient.get(`/documents/${id}`),
  update: (id, payload) => apiClient.patch(`/documents/${id}`, payload),
  delete: (id) => apiClient.delete(`/documents/${id}`)
};
