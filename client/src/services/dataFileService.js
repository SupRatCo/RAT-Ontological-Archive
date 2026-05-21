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

export async function createDataFile(projectId, data) {
  const user = requireUser();
  if (!data.title?.trim()) throw new Error("El Archivo de Datos necesita un nombre.");
  const ref = doc(collection(db, "projects", projectId, "dataFiles"));
  const dataFile = {
    title: data.title.trim(),
    description: data.description || "",
    coverUrl: data.coverUrl || "",
    visibility: data.visibility || "inherit",
    authorId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, dataFile);
  return { dataFile: { id: ref.id, ...dataFile } };
}

export async function getDataFiles(projectId) {
  const snapshot = await getDocs(query(collection(db, "projects", projectId, "dataFiles"), orderBy("updatedAt", "desc")));
  return { dataFiles: normalizeList(snapshot) };
}

export async function getDataFile(projectId, dataFileId) {
  const dataFile = withId(await getDoc(doc(db, "projects", projectId, "dataFiles", dataFileId)));
  if (!dataFile) throw new Error("Archivo de Datos no encontrado.");
  const sections = normalizeList(await getDocs(query(collection(db, "projects", projectId, "dataFiles", dataFileId, "sections"), orderBy("sortOrder"))));
  const fields = [];
  for (const section of sections) {
    const fieldSnapshot = await getDocs(query(collection(db, "projects", projectId, "dataFiles", dataFileId, "sections", section.id, "fields"), orderBy("sortOrder")));
    fields.push(...normalizeList(fieldSnapshot).map((field) => ({
      ...field,
      section_id: section.id,
      field_type: field.field_type || field.fieldType,
      value_json: field.value_json ?? field.value ?? ""
    })));
  }
  return { dataFile: { ...dataFile, sections, fields } };
}

export async function updateDataFile(projectId, dataFileId, data) {
  await updateDoc(doc(db, "projects", projectId, "dataFiles", dataFileId), cleanObject({ ...data, updatedAt: serverTimestamp() }));
  return getDataFile(projectId, dataFileId);
}

export async function deleteDataFile(projectId, dataFileId) {
  await deleteDoc(doc(db, "projects", projectId, "dataFiles", dataFileId));
  return { ok: true };
}

export async function createSection(projectId, dataFileId, data) {
  const ref = doc(collection(db, "projects", projectId, "dataFiles", dataFileId, "sections"));
  const section = {
    title: data.title?.trim() || "Nueva sección",
    sortOrder: data.sortOrder || Date.now(),
    collapsed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, section);
  return { section: { id: ref.id, ...section } };
}

export async function updateSection(projectId, dataFileId, sectionId, data) {
  await updateDoc(doc(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId), cleanObject({ ...data, updatedAt: serverTimestamp() }));
  return { ok: true };
}

export async function deleteSection(projectId, dataFileId, sectionId) {
  await deleteDoc(doc(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId));
  return { ok: true };
}

export async function createField(projectId, dataFileId, sectionId, data) {
  const ref = doc(collection(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId, "fields"));
  const fieldType = data.fieldType || data.field_type || "short_text";
  const field = {
    label: data.label?.trim() || "Campo",
    fieldType,
    field_type: fieldType,
    value: data.value ?? data.value_json ?? "",
    value_json: data.value_json ?? data.value ?? "",
    options: data.options || [],
    sortOrder: data.sortOrder || Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, field);
  return { field: { id: ref.id, section_id: sectionId, ...field } };
}

export async function updateField(projectId, dataFileId, sectionId, fieldId, data) {
  const value = data.value ?? data.value_json;
  await updateDoc(doc(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId, "fields", fieldId), cleanObject({
    label: data.label,
    fieldType: data.fieldType || data.field_type,
    field_type: data.field_type || data.fieldType,
    value,
    value_json: value,
    options: data.options,
    updatedAt: serverTimestamp()
  }));
  const snapshot = await getDoc(doc(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId, "fields", fieldId));
  const field = withId(snapshot);
  return { field: { ...field, section_id: sectionId, field_type: field.field_type || field.fieldType, value_json: field.value_json ?? field.value ?? "" } };
}

export async function deleteField(projectId, dataFileId, sectionId, fieldId) {
  await deleteDoc(doc(db, "projects", projectId, "dataFiles", dataFileId, "sections", sectionId, "fields", fieldId));
  return { ok: true };
}

export const dataFileService = {
  createDataFile,
  getDataFiles,
  getDataFile,
  updateDataFile,
  deleteDataFile,
  createSection,
  updateSection,
  deleteSection,
  createField,
  updateField,
  deleteField
};
