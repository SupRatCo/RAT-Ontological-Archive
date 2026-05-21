import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db, requireUser, normalizeList } from "./firebaseUtils";

export async function friends() {
  const user = requireUser();
  const sent = await getDocs(query(collection(db, "friendships"), where("requesterId", "==", user.uid)));
  const received = await getDocs(query(collection(db, "friendships"), where("receiverId", "==", user.uid)));
  return { friends: [...normalizeList(sent), ...normalizeList(received)] };
}

export async function requestFriend(userId) {
  const user = requireUser();
  const id = [user.uid, userId].sort().join("_");
  await setDoc(doc(db, "friendships", id), {
    requesterId: user.uid,
    receiverId: userId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });
  return { ok: true };
}

export async function updateFriendship(friendshipId, status) {
  await updateDoc(doc(db, "friendships", friendshipId), { status, updatedAt: serverTimestamp() });
  return { ok: true };
}

export const collaboratorService = {
  friends,
  requestFriend,
  updateFriendship
};
