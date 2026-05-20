import { apiClient } from "./apiClient";

export const tagsApi = {
  list: (projectId) => apiClient.get(`/tags/project/${projectId}`),
  create: (projectId, payload) => apiClient.post(`/tags/project/${projectId}`, payload),
  update: (tagId, payload) => apiClient.patch(`/tags/${tagId}`, payload),
  delete: (tagId) => apiClient.delete(`/tags/${tagId}`)
};
