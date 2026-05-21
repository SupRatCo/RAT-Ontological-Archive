import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, requireUser, assertFirebaseReady } from "./firebaseUtils";

export async function getSettings(uid = requireUser().uid) {
  assertFirebaseReady();
  const snapshot = await getDoc(doc(db, "userSettings", uid));
  return snapshot.exists() ? snapshot.data() : {};
}

export async function updateSettings(payload) {
  const user = requireUser();
  await setDoc(doc(db, "userSettings", user.uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
  return { settings: await getSettings(user.uid) };
}

export function getDataDiagnostics() {
  return {
    auth: "Firebase Authentication",
    database: "Cloud Firestore",
    media: "Cloudinary",
    firebaseStorage: "Desactivado",
    backend: "Express legado/no requerido"
  };
}

export function testFirebaseConfiguration() {
  assertFirebaseReady();
  return {
    ok: true,
    name: "RAT Ontological Archive",
    auth: "Firebase Authentication",
    database: "Cloud Firestore",
    media: "Cloudinary"
  };
}

export const settingsService = {
  getSettings,
  updateSettings,
  getDataDiagnostics,
  testFirebaseConfiguration
};
