import { apiClient } from "./apiClient";

export const dataFilesApi = {
  list: (projectId) => apiClient.get(`/data-files/project/${projectId}`),
  create: (projectId, payload) => apiClient.post(`/data-files/project/${projectId}`, payload),
  get: (id) => apiClient.get(`/data-files/${id}`),
  update: (id, payload) => apiClient.patch(`/data-files/${id}`, payload),
  delete: (id) => apiClient.delete(`/data-files/${id}`),
  createSection: (dataFileId, payload) => apiClient.post(`/data-files/${dataFileId}/sections`, payload),
  updateSection: (sectionId, payload) => apiClient.patch(`/data-files/sections/${sectionId}`, payload),
  deleteSection: (sectionId) => apiClient.delete(`/data-files/sections/${sectionId}`),
  createField: (sectionId, payload) => apiClient.post(`/data-files/sections/${sectionId}/fields`, payload),
  updateField: (fieldId, payload) => apiClient.patch(`/data-files/fields/${fieldId}`, payload),
  deleteField: (fieldId) => apiClient.delete(`/data-files/fields/${fieldId}`)
};
