import { apiClient } from "./apiClient";

export const settingsApi = {
  get: () => apiClient.get("/settings"),
  update: (payload) => apiClient.patch("/settings", payload),
  diagnostics: () => apiClient.get("/settings/diagnostics"),
  health: () => apiClient.get("/health")
};
