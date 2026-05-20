import { clearToken, getToken } from "../utils/storage";

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_URL = rawBaseUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, response, payload) {
    super(message);
    this.name = "ApiError";
    this.status = response?.status || 0;
    this.payload = payload;
  }
}

export function apiPath(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath.startsWith("/api/") ? cleanPath : `/api${cleanPath}`}`;
}

export async function apiRequest(path, options = {}) {
  const url = apiPath(path);
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers || {});

  if (!isFormData && options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body: isFormData || typeof options.body === "string" ? options.body : JSON.stringify(options.body || {})
    });
  } catch (error) {
    console.error("API fetch failed", { url, method: options.method || "GET", origin: window.location.origin, message: error.message });
    throw new ApiError("No se pudo conectar con el servidor.", null, { url });
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    payload = { ok: false, error: "El servidor devolvió una respuesta inválida.", raw: text };
  }

  if (response.status === 401) clearToken();
  if (!response.ok || payload.ok === false) {
    console.error("API request failed", { url, status: response.status, payload });
    throw new ApiError(payload.error || "No se pudo completar la acción.", response, payload);
  }

  return payload.data ?? payload;
}

export const apiClient = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: "POST", body }),
  patch: (path, body) => apiRequest(path, { method: "PATCH", body }),
  put: (path, body) => apiRequest(path, { method: "PUT", body }),
  delete: (path, body) => apiRequest(path, { method: "DELETE", body }),
  upload: (path, formData) => apiRequest(path, { method: "POST", body: formData })
};
