import { createContext, useContext } from "react";

export const SettingsContext = createContext(null);

export function useSettingsStore() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("useSettingsStore must be used inside SettingsContext.Provider");
  return value;
}
