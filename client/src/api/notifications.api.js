import { apiClient } from "./apiClient";

export const notificationsApi = {
  list: () => apiClient.get("/notifications"),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`, {})
};
