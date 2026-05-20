export const APP_NAME = import.meta.env.VITE_APP_NAME || "RAT Ontological Archive";
export const TOKEN_KEY = "roa_token";
export const LAST_PROJECT_KEY = "roa_last_project_id";
export const UI_PREFS_KEY = "roa_ui_preferences";

export const fieldTypes = [
  { value: "short_text", label: "Texto corto" },
  { value: "long_text", label: "Texto largo" },
  { value: "number", label: "Número" },
  { value: "checkbox", label: "Checkbox" },
  { value: "list", label: "Lista" },
  { value: "select", label: "Select" },
  { value: "date", label: "Fecha" },
  { value: "url", label: "URL" },
  { value: "image", label: "Imagen" },
  { value: "tag", label: "Etiqueta" },
  { value: "relation", label: "Relación" }
];
