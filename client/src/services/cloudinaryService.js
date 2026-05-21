const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export function assertCloudinaryReady() {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary no está configurado. Faltan VITE_CLOUDINARY_CLOUD_NAME o VITE_CLOUDINARY_UPLOAD_PRESET.");
  }
}

function resourceTypeFor(file) {
  return file?.type?.startsWith("video/") ? "video" : "image";
}

export async function uploadMedia(file, options = {}) {
  assertCloudinaryReady();
  if (!file) throw new Error("Selecciona un archivo para subir.");

  const resourceType = options.resourceType || resourceTypeFor(file);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (options.folder) formData.append("folder", options.folder);
  if (options.publicId) formData.append("public_id", options.publicId);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Cloudinary upload failed", { status: response.status, payload });
    throw new Error(payload.error?.message || "No se pudo subir el archivo a Cloudinary.");
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id,
    resourceType: payload.resource_type,
    format: payload.format,
    width: payload.width || null,
    height: payload.height || null,
    bytes: payload.bytes || file.size,
    mimeType: file.type,
    originalFilename: payload.original_filename || file.name
  };
}

export function uploadAvatar(file, uid) {
  return uploadMedia(file, { folder: `roa/users/${uid}/avatar` });
}

export function uploadBanner(file, uid) {
  return uploadMedia(file, { folder: `roa/users/${uid}/banner` });
}

export function uploadProjectCover(file, projectId) {
  return uploadMedia(file, { folder: `roa/projects/${projectId}/covers` });
}

export function uploadDocumentImage(file, projectId, documentId) {
  return uploadMedia(file, { folder: `roa/projects/${projectId}/documents/${documentId}` });
}

export function uploadGalleryMedia(file, projectId) {
  return uploadMedia(file, { folder: `roa/projects/${projectId}/gallery` });
}

export const cloudinaryService = {
  uploadMedia,
  uploadAvatar,
  uploadBanner,
  uploadProjectCover,
  uploadDocumentImage,
  uploadGalleryMedia
};
