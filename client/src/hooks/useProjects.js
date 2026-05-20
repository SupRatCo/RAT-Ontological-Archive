import { useProjectStore } from "../store/projectStore";

export default function useProjects() {
  return useProjectStore();
}
