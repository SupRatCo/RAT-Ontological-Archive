import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db, requireUser, withId, normalizeList, cleanObject } from "./firebaseUtils";

export async function createDocument(projectId, data) {
  const user = requireUser();
  if (!data.title?.trim()) throw new Error("El documento necesita un título.");
  const ref = doc(collection(db, "projects", projectId, "documents"));
  const document = {
    title: data.title.trim(),
    content_html: data.content_html || data.contentHtml || "",
    contentHtml: data.content_html || data.contentHtml || "",
    contentJson: data.contentJson || {},
    visibility: data.visibility || "inherit",
    status: data.status || "draft",
    authorId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, document);
  return { document: { id: ref.id, ...document, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
}

export async function getDocuments(projectId) {
  const snapshot = await getDocs(query(collection(db, "projects", projectId, "documents"), orderBy("updatedAt", "desc")));
  return { documents: normalizeList(snapshot).map(normalizeDocument) };
}

export async function getDocument(projectId, documentId) {
  const snapshot = await getDoc(doc(db, "projects", projectId, "documents", documentId));
  const document = normalizeDocument(withId(snapshot));
  if (!document) throw new Error("Documento no encontrado.");
  return { document };
}

export async function updateDocument(projectId, documentId, data) {
  const content = data.content_html ?? data.contentHtml;
  await updateDoc(doc(db, "projects", projectId, "documents", documentId), cleanObject({
    title: data.title,
    content_html: content,
    contentHtml: content,
    contentJson: data.contentJson,
    visibility: data.visibility,
    status: data.status,
    updatedAt: serverTimestamp()
  }));
  return getDocument(projectId, documentId);
}

export async function deleteDocument(projectId, documentId) {
  await deleteDoc(doc(db, "projects", projectId, "documents", documentId));
  return { ok: true };
}

export function normalizeDocument(document) {
  if (!document) return document;
  return { ...document, content_html: document.content_html ?? document.contentHtml ?? "" };
}

export const documentService = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument
};
