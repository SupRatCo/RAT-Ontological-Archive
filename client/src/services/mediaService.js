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
import { db, requireUser, normalizeList, cleanObject } from "./firebaseUtils";
import { uploadGalleryMedia } from "./cloudinaryService";

export async function uploadProjectMedia(projectId, file, metadata = {}) {
  const user = requireUser();
  const uploaded = await uploadGalleryMedia(file, projectId);
  const ref = doc(collection(db, "projects", projectId, "media"));
  const media = {
    uploadedBy: user.uid,
    url: uploaded.url,
    publicId: uploaded.publicId,
    resourceType: uploaded.resourceType,
    mimeType: uploaded.mimeType,
    size: uploaded.bytes,
    width: uploaded.width,
    height: uploaded.height,
    title: metadata.title || uploaded.originalFilename || file.name,
    description: metadata.description || "",
    tags: metadata.tags || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, media);
  return { media: normalizeMedia({ id: ref.id, ...media }) };
}

export async function getProjectMedia(projectId) {
  const snapshot = await getDocs(query(collection(db, "projects", projectId, "media"), orderBy("createdAt", "desc")));
  return { media: normalizeList(snapshot).map(normalizeMedia) };
}

export async function deleteProjectMedia(projectId, mediaId) {
  await deleteDoc(doc(db, "projects", projectId, "media", mediaId));
  return { ok: true };
}

export async function updateProjectMedia(projectId, mediaId, data) {
  await updateDoc(doc(db, "projects", projectId, "media", mediaId), cleanObject({ ...data, updatedAt: serverTimestamp() }));
  return { ok: true };
}

function normalizeMedia(media) {
  return {
    ...media,
    public_url: media.url,
    mime_type: media.mimeType,
    media_type: media.resourceType,
    uploaded_by: media.uploadedBy
  };
}

export const mediaService = {
  uploadProjectMedia,
  getProjectMedia,
  deleteProjectMedia,
  updateProjectMedia
};
