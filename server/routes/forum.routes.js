const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { notify } = require("./notifications.routes");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

async function postOut(row, userId) {
  const author = await get("SELECT id, username, avatar_url FROM users WHERE id = ?", [row.user_id]);
  const votes = await all("SELECT vote_type FROM forum_votes WHERE target_type = 'post' AND target_id = ?", [row.id]);
  const comments = await all("SELECT COUNT(*) as count FROM forum_comments WHERE post_id = ?", [row.id]);
  const saved = JSON.parse(row.saved_by_json || "[]");
  return {
    id: row.id,
    userId: row.user_id,
    author,
    projectId: row.project_id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    tags: JSON.parse(row.tags_json || "[]"),
    visibility: row.visibility,
    coverMediaId: row.cover_media_id,
    upvotes: votes.filter((v) => v.vote_type === "up").length - votes.filter((v) => v.vote_type === "down").length,
    commentsCount: comments[0].count,
    saved: userId ? saved.includes(userId) : false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/posts", optionalAuth, async (req, res, next) => {
  try {
    const filter = req.query.filter || "recent";
    const q = String(req.query.q || "").toLowerCase();
    let rows = await all("SELECT * FROM forum_posts WHERE visibility = 'public' ORDER BY created_at DESC");
    if (q) rows = rows.filter((row) => `${row.title} ${row.content} ${row.summary} ${row.tags_json}`.toLowerCase().includes(q));
    const posts = await Promise.all(rows.map((row) => postOut(row, req.user && req.user.id)));
    if (filter === "popular") posts.sort((a, b) => b.upvotes - a.upvotes);
    if (filter === "commented") posts.sort((a, b) => b.commentsCount - a.commentsCount);
    if (filter === "saved" && req.user) return res.json({ posts: posts.filter((p) => p.saved) });
    if (filter === "mine" && req.user) return res.json({ posts: posts.filter((p) => p.userId === req.user.id) });
    res.json({ posts });
  } catch (error) { next(error); }
});

router.post("/posts", requireAuth, async (req, res, next) => {
  try {
    const id = uid("post");
    await run("INSERT INTO forum_posts (id, user_id, project_id, title, content, summary, tags_json, visibility, cover_media_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id, req.user.id, req.body.projectId || null, req.body.title, req.body.content || "", req.body.summary || "", JSON.stringify(req.body.tags || []), req.body.visibility || "public", req.body.coverMediaId || null, now(), now()
    ]);
    res.json({ post: await postOut(await get("SELECT * FROM forum_posts WHERE id = ?", [id]), req.user.id) });
  } catch (error) { next(error); }
});

router.get("/posts/:postId", optionalAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!row) return res.status(404).json({ error: "Post not found" });
    const comments = await all("SELECT c.*, u.username, u.avatar_url FROM forum_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at", [req.params.postId]);
    res.json({ post: await postOut(row, req.user && req.user.id), comments });
  } catch (error) { next(error); }
});

router.post("/posts/:postId/comments", requireAuth, async (req, res, next) => {
  try {
    const post = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const id = uid("comment");
    await run("INSERT INTO forum_comments (id, post_id, user_id, content, parent_comment_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, req.params.postId, req.user.id, req.body.content, req.body.parentCommentId || null, now(), now()]);
    if (post.user_id !== req.user.id) await notify(post.user_id, "Nuevo comentario", "Alguien comento tu publicacion.", "forum-comment", { postId: post.id, commentId: id });
    res.json({ comment: await get("SELECT * FROM forum_comments WHERE id = ?", [id]) });
  } catch (error) { next(error); }
});

router.post("/vote", requireAuth, async (req, res, next) => {
  try {
    const id = uid("vote");
    await run("INSERT OR REPLACE INTO forum_votes (id, user_id, target_type, target_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?, ?)", [id, req.user.id, req.body.targetType, req.body.targetId, req.body.voteType || "up", now()]);
    if (req.body.targetType === "post") {
      const post = await get("SELECT * FROM forum_posts WHERE id = ?", [req.body.targetId]);
      if (post && post.user_id !== req.user.id) await notify(post.user_id, "Nuevo voto", "Alguien voto tu publicacion.", "forum-vote", { postId: post.id });
    }
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.post("/posts/:postId/save", requireAuth, async (req, res, next) => {
  try {
    const post = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    const saved = new Set(JSON.parse(post.saved_by_json || "[]"));
    if (saved.has(req.user.id)) saved.delete(req.user.id);
    else saved.add(req.user.id);
    await run("UPDATE forum_posts SET saved_by_json = ?, updated_at = ? WHERE id = ?", [JSON.stringify(Array.from(saved)), now(), req.params.postId]);
    res.json({ saved: saved.has(req.user.id) });
  } catch (error) { next(error); }
});

module.exports = router;
