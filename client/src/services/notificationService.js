import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db, normalizeList } from "./firebaseUtils";

export async function createNotification(uid, data) {
  if (!uid) return { ok: true };
  const ref = doc(collection(db, "notifications", uid, "items"));
  await setDoc(ref, {
    type: data.type || "system",
    title: data.title || "Notificación",
    message: data.message || "",
    dataJson: data.dataJson || {},
    read: false,
    createdAt: serverTimestamp()
  });
  return { notification: { id: ref.id } };
}

export async function getNotifications(uid) {
  const snapshot = await getDocs(query(collection(db, "notifications", uid, "items"), orderBy("createdAt", "desc")));
  return { notifications: normalizeList(snapshot) };
}

export async function markAsRead(uid, notificationId) {
  await updateDoc(doc(db, "notifications", uid, "items", notificationId), { read: true });
  return { ok: true };
}

export async function markAllAsRead(uid) {
  const notifications = await getNotifications(uid);
  await Promise.all(notifications.notifications.map((item) => markAsRead(uid, item.id)));
  return { ok: true };
}

export const notificationService = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead
};
