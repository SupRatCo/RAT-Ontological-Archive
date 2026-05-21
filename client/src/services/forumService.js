import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db, requireUser, withId, normalizeList, cleanObject } from "./firebaseUtils";
import { createNotification } from "./notificationService";

function authorFromUser(user, profile = {}) {
  return {
    authorId: user.uid,
    authorUsername: profile.username || user.displayName || "usuario",
    authorDisplayName: profile.displayName || profile.username || user.displayName || "Usuario",
    authorAvatarUrl: profile.avatarUrl || ""
  };
}

async function currentProfile(user) {
  const snapshot = await getDoc(doc(db, "users", user.uid));
  return withId(snapshot) || {};
}

export async function createPost(data) {
  const user = requireUser();
  if (!data.title?.trim()) throw new Error("El título es obligatorio.");
  const content = data.content_html || data.contentHtml || "";
  if (!content.trim()) throw new Error("El contenido no puede estar vacío.");
  const profile = await currentProfile(user);
  const ref = doc(collection(db, "forumPosts"));
  const post = {
    ...authorFromUser(user, profile),
    sourceType: data.source_type || data.sourceType || "normal",
    sourceProjectId: data.sourceProjectId || data.source_project_id || "",
    sourceDocumentId: data.source_document_id || data.sourceDocumentId || "",
    title: data.title.trim(),
    summary: data.summary || "",
    contentHtml: content,
    visibility: data.visibility || "public",
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, post);
  return { post: normalizePost({ id: ref.id, ...post }) };
}

export async function getRecentPosts({ limit: take = 20 } = {}) {
  return getPosts({ filter: "recent", limit: take });
}

export async function getPopularPosts({ limit: take = 20 } = {}) {
  return getPosts({ filter: "popular", limit: take });
}

export async function getMyPosts(uid = requireUser().uid) {
  return getPosts({ filter: "mine", uid });
}

export async function getSavedPosts(uid = requireUser().uid) {
  const savedSnapshot = await getDocs(collection(db, "forumPosts"));
  const posts = [];
  for (const postDoc of savedSnapshot.docs) {
    const saved = await getDoc(doc(db, "forumPosts", postDoc.id, "savedBy", uid));
    if (saved.exists()) posts.push(normalizePost({ id: postDoc.id, ...postDoc.data(), saved_by_current_user: true }));
  }
  return { posts, page: { hasMore: false } };
}

export async function getPosts({ filter = "recent", q = "", limit: take = 20, uid = requireUser().uid } = {}) {
  if (filter === "saved") return getSavedPosts(uid);
  const constraints = filter === "mine" ? [] : [where("visibility", "==", "public")];
  if (filter === "mine") constraints.push(where("authorId", "==", uid));
  constraints.push(orderBy(filter === "popular" ? "likesCount" : "createdAt", "desc"), limit(take));
  const snapshot = await getDocs(query(collection(db, "forumPosts"), ...constraints));
  let posts = normalizeList(snapshot).map(normalizePost);
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    posts = posts.filter((post) => `${post.title} ${post.summary} ${post.content_html} ${post.username}`.toLowerCase().includes(needle));
  }
  const decorated = [];
  for (const post of posts) {
    const [liked, saved] = await Promise.all([
      getDoc(doc(db, "forumPosts", post.id, "likes", uid)),
      getDoc(doc(db, "forumPosts", post.id, "savedBy", uid))
    ]);
    decorated.push({ ...post, liked_by_current_user: liked.exists(), saved_by_current_user: saved.exists() });
  }
  return { posts: decorated, page: { hasMore: false } };
}

export async function getPost(postId) {
  const post = normalizePost(withId(await getDoc(doc(db, "forumPosts", postId))));
  if (!post) throw new Error("Publicación no encontrada.");
  return { post };
}

export async function updatePost(postId, data) {
  await updateDoc(doc(db, "forumPosts", postId), cleanObject({ ...data, updatedAt: serverTimestamp() }));
  return getPost(postId);
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "forumPosts", postId));
  return { ok: true };
}

export async function toggleLike(postId, uid = requireUser().uid) {
  const postRef = doc(db, "forumPosts", postId);
  const likeRef = doc(db, "forumPosts", postId, "likes", uid);
  let liked = false;
  let likesCount = 0;
  let notifyAuthorId = "";
  await runTransaction(db, async (transaction) => {
    const [postSnap, likeSnap] = await Promise.all([transaction.get(postRef), transaction.get(likeRef)]);
    if (!postSnap.exists()) throw new Error("Publicación no encontrada.");
    if (likeSnap.exists()) {
      transaction.delete(likeRef);
      likesCount = Math.max(Number(postSnap.data().likesCount || 0) - 1, 0);
      transaction.update(postRef, { likesCount });
      liked = false;
    } else {
      transaction.set(likeRef, { uid, createdAt: serverTimestamp() });
      likesCount = Number(postSnap.data().likesCount || 0) + 1;
      transaction.update(postRef, { likesCount });
      liked = true;
      if (postSnap.data().authorId && postSnap.data().authorId !== uid) notifyAuthorId = postSnap.data().authorId;
    }
  });
  if (notifyAuthorId) {
    await createNotification(notifyAuthorId, { type: "like", title: "Nuevo like", message: "A alguien le gustó tu publicación.", dataJson: { postId } });
  }
  return { liked, likesCount };
}

export async function toggleSave(postId, uid = requireUser().uid) {
  const postRef = doc(db, "forumPosts", postId);
  const saveRef = doc(db, "forumPosts", postId, "savedBy", uid);
  let saved = false;
  await runTransaction(db, async (transaction) => {
    const saveSnap = await transaction.get(saveRef);
    if (saveSnap.exists()) {
      transaction.delete(saveRef);
      transaction.update(postRef, { savesCount: increment(-1) });
      saved = false;
    } else {
      transaction.set(saveRef, { uid, createdAt: serverTimestamp() });
      transaction.update(postRef, { savesCount: increment(1) });
      saved = true;
    }
  });
  return { saved };
}

export async function createComment(postId, data) {
  const user = requireUser();
  if (!data.content?.trim()) throw new Error("El comentario no puede estar vacío.");
  const profile = await currentProfile(user);
  const post = withId(await getDoc(doc(db, "forumPosts", postId)));
  if (!post) throw new Error("Publicación no encontrada.");
  const ref = doc(collection(db, "forumPosts", postId, "comments"));
  const comment = {
    authorId: user.uid,
    authorUsername: profile.username || "usuario",
    authorAvatarUrl: profile.avatarUrl || "",
    parentCommentId: data.parentCommentId || data.parent_comment_id || "",
    content: data.content.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, comment);
  await updateDoc(doc(db, "forumPosts", postId), { commentsCount: increment(1) });
  if (post.authorId !== user.uid) {
    await createNotification(post.authorId, { type: "comment", title: "Nuevo comentario", message: `${comment.authorUsername} comentó tu publicación.`, dataJson: { postId } });
  }
  return { comment: { id: ref.id, ...comment }, commentsCount: Number(post.commentsCount || 0) + 1 };
}

export async function getComments(postId) {
  const snapshot = await getDocs(query(collection(db, "forumPosts", postId, "comments"), orderBy("createdAt", "asc")));
  return { comments: normalizeList(snapshot) };
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, "forumPosts", postId, "comments", commentId));
  await updateDoc(doc(db, "forumPosts", postId), { commentsCount: increment(-1) });
  return { ok: true };
}

function normalizePost(post) {
  if (!post) return post;
  return {
    ...post,
    username: post.authorUsername,
    display_name: post.authorDisplayName,
    avatar_url: post.authorAvatarUrl,
    source_type: post.sourceType,
    source_document_id: post.sourceDocumentId,
    content_html: post.content_html || post.contentHtml || "",
    likes_count: post.likes_count ?? post.likesCount ?? 0,
    comments_count: post.comments_count ?? post.commentsCount ?? 0
  };
}

export const forumService = {
  createPost,
  getRecentPosts,
  getPopularPosts,
  getMyPosts,
  getSavedPosts,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleSave,
  createComment,
  getComments,
  deleteComment
};
