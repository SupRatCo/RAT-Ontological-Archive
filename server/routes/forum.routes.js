const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const { notify } = require("./notifications.routes");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

async function postOut(row, userId) {
  const author = await get("SELECT id, username, avatar_url, settings_json FROM users WHERE id = ?", [row.user_id]);
  const votes = await all("SELECT vote_type FROM forum_votes WHERE target_type = 'post' AND target_id = ?", [row.id]);
  const userVote = userId ? await get("SELECT vote_type FROM forum_votes WHERE user_id = ? AND target_type = 'post' AND target_id = ?", [userId, row.id]) : null;
  const comments = await all("SELECT COUNT(*) as count FROM forum_comments WHERE post_id = ?", [row.id]);
  const saved = JSON.parse(row.saved_by_json || "[]");
  const settings = author ? JSON.parse(author.settings_json || "{}") : {};
  return {
    id: row.id,
    userId: row.user_id,
    author: author ? { id: author.id, username: author.username, avatar_url: author.avatar_url || "", banner: settings.banner || "", bio: settings.bio || "", accent: settings.accent || "" } : null,
    projectId: row.project_id,
    sourceFileId: row.source_file_id,
    title: row.title,
    content: row.content,
    contentSnapshot: row.content_snapshot || row.content,
    summary: row.summary,
    tags: JSON.parse(row.tags_json || "[]"),
    visibility: row.visibility,
    coverMediaId: row.cover_media_id,
    upvotes: votes.filter((v) => v.vote_type === "up").length - votes.filter((v) => v.vote_type === "down").length,
    liked: !!(userVote && userVote.vote_type === "up"),
    userVote: userVote ? userVote.vote_type : "",
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
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    if (!title) return res.status(400).json({ error: "El titulo no puede estar vacio." });
    if (!content) return res.status(400).json({ error: "El contenido no puede estar vacio." });
    const id = uid("post");
    await run("INSERT INTO forum_posts (id, user_id, project_id, source_file_id, title, content, content_snapshot, summary, tags_json, visibility, cover_media_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      id, req.user.id, req.body.projectId || null, req.body.sourceFileId || null, title, content, req.body.contentSnapshot || content, req.body.summary || "", JSON.stringify(req.body.tags || []), req.body.visibility || "public", req.body.coverMediaId || null, now(), now()
    ]);
    res.json({ post: await postOut(await get("SELECT * FROM forum_posts WHERE id = ?", [id]), req.user.id) });
  } catch (error) { next(error); }
});

router.get("/posts/:postId", optionalAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!row) return res.status(404).json({ error: "Post not found" });
    const comments = await all("SELECT c.*, u.username, u.avatar_url, u.settings_json FROM forum_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at", [req.params.postId]);
    res.json({ post: await postOut(row, req.user && req.user.id), comments });
  } catch (error) { next(error); }
});

router.post("/posts/:postId/comments", requireAuth, async (req, res, next) => {
  try {
    const post = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const content = String(req.body.content || "").trim();
    if (!content) return res.status(400).json({ error: "El comentario no puede estar vacio." });
    if (req.body.parentCommentId) {
      const parent = await get("SELECT id FROM forum_comments WHERE id = ? AND post_id = ?", [req.body.parentCommentId, req.params.postId]);
      if (!parent) return res.status(400).json({ error: "El comentario padre no existe." });
    }
    const id = uid("comment");
    await run("INSERT INTO forum_comments (id, post_id, user_id, content, parent_comment_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, req.params.postId, req.user.id, content, req.body.parentCommentId || null, now(), now()]);
    if (post.user_id !== req.user.id) await notify(post.user_id, "Nuevo comentario", "Alguien comento tu publicacion.", "forum-comment", { postId: post.id, commentId: id });
    res.json({ comment: await get("SELECT c.*, u.username, u.avatar_url FROM forum_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?", [id]) });
  } catch (error) { next(error); }
});

router.post("/vote", requireAuth, async (req, res, next) => {
  try {
    const targetType = req.body.targetType === "comment" ? "comment" : "post";
    const voteType = req.body.voteType === "down" ? "down" : "up";
    const targetId = String(req.body.targetId || "");
    if (!targetId) return res.status(400).json({ error: "Falta el objetivo del voto." });
    const existing = await get("SELECT * FROM forum_votes WHERE user_id = ? AND target_type = ? AND target_id = ?", [req.user.id, targetType, targetId]);
    let liked = false;
    if (existing && existing.vote_type === voteType) {
      await run("DELETE FROM forum_votes WHERE id = ?", [existing.id]);
    } else if (existing) {
      await run("UPDATE forum_votes SET vote_type = ?, created_at = ? WHERE id = ?", [voteType, now(), existing.id]);
      liked = voteType === "up";
    } else {
      await run("INSERT INTO forum_votes (id, user_id, target_type, target_id, vote_type, created_at) VALUES (?, ?, ?, ?, ?, ?)", [uid("vote"), req.user.id, targetType, targetId, voteType, now()]);
      liked = voteType === "up";
    }
    if (targetType === "post") {
      const post = await get("SELECT * FROM forum_posts WHERE id = ?", [targetId]);
      if (post && post.user_id !== req.user.id) await notify(post.user_id, "Nuevo voto", "Alguien voto tu publicacion.", "forum-vote", { postId: post.id });
    }
    const rows = await all("SELECT vote_type FROM forum_votes WHERE target_type = ? AND target_id = ?", [targetType, targetId]);
    const upvotes = rows.filter((v) => v.vote_type === "up").length - rows.filter((v) => v.vote_type === "down").length;
    res.json({ ok: true, liked, upvotes });
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
