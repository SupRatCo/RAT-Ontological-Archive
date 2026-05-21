import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db, requireUser, withId, normalizeList } from "./firebaseUtils";
import { uploadAvatar, uploadBanner } from "./cloudinaryService";

export async function getCurrentUserProfile() {
  const user = requireUser();
  const snapshot = await getDoc(doc(db, "users", user.uid));
  return { user: withId(snapshot) };
}

export async function updateMe(payload) {
  const user = requireUser();
  const updates = {
    displayName: payload.displayName ?? payload.display_name,
    bio: payload.bio,
    accentColor: payload.accentColor ?? payload.accent_color,
    updatedAt: serverTimestamp()
  };
  Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);
  await updateDoc(doc(db, "users", user.uid), updates);
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const profile = withId(snapshot);
  return {
    user: {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      username: profile.username,
      displayName: profile.displayName || profile.username,
      profile: {
        display_name: profile.displayName || profile.username,
        avatar_url: profile.avatarUrl || "",
        banner_url: profile.bannerUrl || "",
        bio: profile.bio || "",
        accent_color: profile.accentColor || "#ffd800"
      }
    }
  };
}

export async function uploadUserAvatar(file) {
  const user = requireUser();
  const uploaded = await uploadAvatar(file, user.uid);
  await setDoc(doc(db, "users", user.uid), { avatarUrl: uploaded.url, updatedAt: serverTimestamp() }, { merge: true });
  return updateMe({});
}

export async function uploadUserBanner(file) {
  const user = requireUser();
  const uploaded = await uploadBanner(file, user.uid);
  await setDoc(doc(db, "users", user.uid), { bannerUrl: uploaded.url, updatedAt: serverTimestamp() }, { merge: true });
  return updateMe({});
}

export async function publicProfile(userId) {
  const snapshot = await getDoc(doc(db, "users", userId));
  const profile = withId(snapshot);
  if (!profile) throw new Error("Usuario no encontrado.");
  return { profile };
}

export async function searchUsers(searchText) {
  const q = (searchText || "").trim().toLowerCase();
  if (!q) return { users: [] };
  const snapshot = await getDocs(query(collection(db, "users"), where("usernameLower", ">=", q), where("usernameLower", "<=", `${q}\uf8ff`), orderBy("usernameLower"), limit(10)));
  return { users: normalizeList(snapshot) };
}

export const userService = {
  getCurrentUserProfile,
  updateMe,
  uploadUserAvatar,
  uploadUserBanner,
  publicProfile,
  searchUsers
};
