import { apiClient } from "./apiClient";

export const usersApi = {
  me: () => apiClient.get("/users/me"),
  updateMe: (payload) => apiClient.patch("/users/me", payload),
  uploadAvatar(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload("/users/me/avatar", formData);
  },
  uploadBanner(file) {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.upload("/users/me/banner", formData);
  },
  publicProfile: (userId) => apiClient.get(`/users/${userId}/public`),
  search: (q) => apiClient.get(`/users/search?q=${encodeURIComponent(q)}`)
};
