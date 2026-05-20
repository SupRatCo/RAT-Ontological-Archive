import { createContext, useContext } from "react";

export const ProjectContext = createContext(null);

export function useProjectStore() {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useProjectStore must be used inside ProjectContext.Provider");
  return value;
}
