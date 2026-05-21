import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { auth, db, assertFirebaseReady, withId } from "./firebaseUtils";

function normalizeUsername(username = "") {
  return username.trim().toLowerCase();
}

function publicUser(firebaseUser, profile, settings) {
  if (!firebaseUser || !profile) return null;
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    username: profile.username,
    displayName: profile.displayName || profile.username,
    profile: {
      display_name: profile.displayName || profile.username,
      avatar_url: profile.avatarUrl || "",
      banner_url: profile.bannerUrl || "",
      bio: profile.bio || "",
      accent_color: profile.accentColor || "#ffd800"
    },
    settings: settings || {}
  };
}

export async function getUserBundle(firebaseUser = auth?.currentUser) {
  assertFirebaseReady();
  if (!firebaseUser) return null;

  let userSnap;
  try {
    userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
  } catch (error) {
    console.error("[ROA Init] Failed loading user profile", error);
    throw error;
  }

  if (!userSnap.exists()) {
    const fallbackName = firebaseUser.email?.split("@")[0] || "usuario";
    const now = serverTimestamp();
    try {
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        username: fallbackName,
        usernameLower: fallbackName.toLowerCase(),
        email: firebaseUser.email || "",
        displayName: fallbackName,
        avatarUrl: "",
        bannerUrl: "",
        bio: "",
        accentColor: "#ffd800",
        createdAt: now,
        updatedAt: now
      }, { merge: true });
      userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    } catch (error) {
      console.error("[ROA Init] Failed creating missing user profile", error);
      throw error;
    }
  }

  let settingsSnap;
  try {
    settingsSnap = await getDoc(doc(db, "userSettings", firebaseUser.uid));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, "userSettings", firebaseUser.uid), {
        language: "es-LATAM",
        theme: "default",
        reducedMotion: true,
        visualQuality: "medium",
        audioVolume: 50,
        settingsJson: {},
        updatedAt: serverTimestamp()
      }, { merge: true });
      settingsSnap = await getDoc(doc(db, "userSettings", firebaseUser.uid));
    }
  } catch (error) {
    console.error("[ROA Init] Failed loading settings", error);
    throw error;
  }

  return publicUser(firebaseUser, withId(userSnap), settingsSnap.exists() ? settingsSnap.data() : {});
}

export async function registerUser({ username, email, password, confirm }) {
  assertFirebaseReady();
  const cleanUsername = username?.trim();
  const usernameLower = normalizeUsername(username);
  const cleanEmail = email?.trim();

  if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 32) {
    throw new Error("El nombre de usuario debe tener entre 3 y 32 caracteres.");
  }
  if (!cleanEmail) throw new Error("El email es obligatorio para crear una cuenta.");
  if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
  if (confirm !== undefined && password !== confirm) throw new Error("Las contraseñas no coinciden.");

  const usernameRef = doc(db, "usernames", usernameLower);
  if ((await getDoc(usernameRef)).exists()) throw new Error("El nombre de usuario ya existe.");

  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const uid = credential.user.uid;
  const now = serverTimestamp();

  await runTransaction(db, async (transaction) => {
    const reserved = await transaction.get(usernameRef);
    if (reserved.exists()) throw new Error("El nombre de usuario ya existe.");

    transaction.set(doc(db, "users", uid), {
      uid,
      username: cleanUsername,
      usernameLower,
      email: cleanEmail,
      displayName: cleanUsername,
      avatarUrl: "",
      bannerUrl: "",
      bio: "",
      accentColor: "#ffd800",
      createdAt: now,
      updatedAt: now
    });
    transaction.set(usernameRef, { uid, username: cleanUsername, createdAt: now });
    transaction.set(doc(db, "userSettings", uid), {
      language: "es-LATAM",
      theme: "default",
      reducedMotion: true,
      visualQuality: "medium",
      audioVolume: 50,
      settingsJson: {},
      updatedAt: now
    });
  });

  return { user: await getUserBundle(credential.user) };
}

export async function loginUser({ email, identifier, password }) {
  assertFirebaseReady();
  const loginEmail = (email || identifier || "").trim();
  if (!loginEmail || !password) throw new Error("Ingresa email y contraseña.");
  const credential = await signInWithEmailAndPassword(auth, loginEmail, password);
  return { user: await getUserBundle(credential.user) };
}

export async function logoutUser() {
  assertFirebaseReady();
  await signOut(auth);
}

export function subscribeToAuthState(callback, onError) {
  assertFirebaseReady();
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      await callback(firebaseUser ? await getUserBundle(firebaseUser) : null);
    } catch (error) {
      console.error("[ROA Init] Failed restoring auth state", error);
      onError?.(error);
    }
  });
}

export function getCurrentUser() {
  return auth?.currentUser || null;
}

export async function ensureUserSettings(uid, settings = {}) {
  assertFirebaseReady();
  await setDoc(doc(db, "userSettings", uid), { ...settings, updatedAt: serverTimestamp() }, { merge: true });
}

export const authService = {
  registerUser,
  loginUser,
  logoutUser,
  subscribeToAuthState,
  getCurrentUser,
  getUserBundle
};
