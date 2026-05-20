import { createContext, useContext } from "react";

export const ForumContext = createContext(null);

export function useForumStore() {
  const value = useContext(ForumContext);
  if (!value) throw new Error("useForumStore must be used inside ForumContext.Provider");
  return value;
}
