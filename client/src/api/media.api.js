import { apiClient } from "./apiClient";

export const mediaApi = {
  list: (projectId) => apiClient.get(`/media/project/${projectId}`),
  upload(projectId, file, metadata = {}) {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(metadata).forEach(([key, value]) => formData.append(key, value));
    return apiClient.upload(`/media/project/${projectId}`, formData);
  },
  delete: (mediaId) => apiClient.delete(`/media/${mediaId}`)
};
