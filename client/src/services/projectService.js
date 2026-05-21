import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db, requireUser, withId, normalizeList, cleanObject } from "./firebaseUtils";

export async function createProject({ name, description = "", visibility = "private", coverUrl = "" }) {
  const user = requireUser();
  if (!name?.trim()) throw new Error("El proyecto necesita un nombre.");
  const projectRef = doc(collection(db, "projects"));
  const now = serverTimestamp();
  const project = {
    name: name.trim(),
    description,
    visibility,
    coverUrl,
    ownerId: user.uid,
    createdAt: now,
    updatedAt: now
  };
  await setDoc(projectRef, project);
  await setDoc(doc(db, "projects", projectRef.id, "members", user.uid), {
    uid: user.uid,
    role: "owner",
    joinedAt: now
  });
  return { project: { id: projectRef.id, ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
}

export async function getProject(projectId) {
  const snapshot = await getDoc(doc(db, "projects", projectId));
  const project = withId(snapshot);
  if (!project) throw new Error("Proyecto no encontrado.");
  return { project };
}

export async function getUserProjects(uid = requireUser().uid) {
  const memberSnapshot = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
  const projectRefs = memberSnapshot.docs
    .map((memberDoc) => memberDoc.ref.parent.parent)
    .filter(Boolean);

  const projects = [];
  for (const projectRef of projectRefs) {
    const snapshot = await getDoc(projectRef);
    const project = withId(snapshot);
    if (project) projects.push(project);
  }

  projects.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return { projects };
}

export async function updateProject(projectId, data) {
  await updateDoc(doc(db, "projects", projectId), cleanObject({ ...data, updatedAt: serverTimestamp() }));
  return getProject(projectId);
}

export async function deleteProject(projectId) {
  await deleteDoc(doc(db, "projects", projectId));
  return { ok: true };
}

export async function getProjectMembers(projectId) {
  const snapshot = await getDocs(collection(db, "projects", projectId, "members"));
  return { members: normalizeList(snapshot) };
}

export async function inviteUserToProject(projectId, userId, role = "viewer") {
  const user = requireUser();
  const inviteRef = doc(collection(db, "projectInvites"));
  await setDoc(inviteRef, {
    projectId,
    inviterId: user.uid,
    invitedUserId: userId,
    role,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { invite: { id: inviteRef.id, projectId, invitedUserId: userId, role, status: "pending" } };
}

export async function acceptProjectInvite(inviteId) {
  const user = requireUser();
  const inviteRef = doc(db, "projectInvites", inviteId);
  const invite = withId(await getDoc(inviteRef));
  if (!invite || invite.invitedUserId !== user.uid) throw new Error("Invitación no disponible.");
  await setDoc(doc(db, "projects", invite.projectId, "members", user.uid), {
    uid: user.uid,
    role: invite.role,
    joinedAt: serverTimestamp()
  });
  await updateDoc(inviteRef, { status: "accepted", updatedAt: serverTimestamp() });
  return { ok: true };
}

export async function removeProjectMember(projectId, uid) {
  await deleteDoc(doc(db, "projects", projectId, "members", uid));
  return { ok: true };
}

export async function changeProjectMemberRole(projectId, uid, role) {
  await updateDoc(doc(db, "projects", projectId, "members", uid), { role });
  return { ok: true };
}

export const projectService = {
  createProject,
  getUserProjects,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  inviteUserToProject,
  acceptProjectInvite,
  removeProjectMember,
  changeProjectMemberRole
};
