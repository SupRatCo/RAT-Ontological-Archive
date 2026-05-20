import { createContext, useContext } from "react";

export const UiContext = createContext(null);

export function useUiStore() {
  const value = useContext(UiContext);
  if (!value) throw new Error("useUiStore must be used inside UiContext.Provider");
  return value;
}
