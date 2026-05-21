import { Timestamp } from "firebase/firestore";
import { auth, db, firebaseMissingKeys, isFirebaseConfigured } from "../firebase/firebase";

export { auth, db, firebaseMissingKeys, isFirebaseConfigured };

export function assertFirebaseReady() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(`Firebase no está configurado. Faltan: ${firebaseMissingKeys.join(", ") || "configuración válida"}.`);
  }
}

export function requireUser() {
  assertFirebaseReady();
  const user = auth.currentUser;
  if (!user) throw new Error("Tu sesión expiró. Inicia sesión otra vez para continuar.");
  return user;
}

export function toDateValue(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
}

export function withId(snapshot) {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return normalizeRecord({ id: snapshot.id, ...data });
}

export function normalizeRecord(record) {
  if (!record) return record;
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, toDateValue(value)])
  );
}

export function normalizeList(snapshot) {
  return snapshot.docs.map((doc) => withId(doc));
}

export function cleanObject(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}
