import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

export function useAuthStore() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuthStore must be used inside AuthContext.Provider");
  return value;
}
