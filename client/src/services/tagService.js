import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db, normalizeList } from "./firebaseUtils";

export async function getTags(projectId) {
  const snapshot = await getDocs(query(collection(db, "projects", projectId, "tags"), orderBy("name")));
  return { tags: normalizeList(snapshot) };
}

export async function createTag(projectId, data) {
  if (!data.name?.trim()) throw new Error("La etiqueta necesita un nombre.");
  const ref = doc(collection(db, "projects", projectId, "tags"));
  const tag = {
    name: data.name.trim(),
    color: data.color || "#ffd800",
    description: data.description || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, tag);
  return { tag: { id: ref.id, ...tag } };
}

export async function updateTag(projectId, tagId, data) {
  await updateDoc(doc(db, "projects", projectId, "tags", tagId), { ...data, updatedAt: serverTimestamp() });
  return { ok: true };
}

export async function deleteTag(projectId, tagId) {
  await deleteDoc(doc(db, "projects", projectId, "tags", tagId));
  return { ok: true };
}

export const tagService = {
  getTags,
  createTag,
  updateTag,
  deleteTag
};
