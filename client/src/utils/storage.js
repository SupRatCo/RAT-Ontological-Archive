import { UI_PREFS_KEY } from "./constants";

export function getUiPrefs() {
  try {
    return JSON.parse(localStorage.getItem(UI_PREFS_KEY) || "{}");
  } catch (_error) {
    return {};
  }
}

export function setUiPrefs(prefs) {
  localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs || {}));
}
