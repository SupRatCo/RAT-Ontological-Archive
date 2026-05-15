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

function parseLimitOffset(query) {
  return {
    limit: Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50),
    offset: Math.max(Number.parseInt(query.offset, 10) || 0, 0)
  };
}

function postFromJoinedRow(row) {
  const settings = JSON.parse(row.author_settings_json || "{}");
  return {
    id: row.id,
    userId: row.user_id,
    author: {
      id: row.author_id,
      username: row.author_username,
      avatar_url: row.author_avatar_url || "",
      banner: settings.banner || "",
      bio: settings.bio || "",
      accent: settings.accent || ""
    },
    projectId: row.project_id,
    sourceFileId: row.source_file_id,
    sourceType: row.source_file_id ? "document" : "normal",
    title: row.title,
    content: row.content,
    contentSnapshot: row.content_snapshot || row.content,
    summary: row.summary,
    tags: JSON.parse(row.tags_json || "[]"),
    visibility: row.visibility,
    coverMediaId: row.cover_media_id,
    upvotes: Number(row.likes_count || 0),
    likesCount: Number(row.likes_count || 0),
    commentsCount: Number(row.comments_count || 0),
    liked: !!row.liked_by_current_user,
    likedByCurrentUser: !!row.liked_by_current_user,
    saved: !!row.saved_by_current_user,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

router.get("/posts", optionalAuth, async (req, res, next) => {
  try {
    const filter = req.query.filter || "recent";
    const q = String(req.query.q || "").trim().toLowerCase();
    const userId = req.user && req.user.id ? req.user.id : "";
    const { limit, offset } = parseLimitOffset(req.query);
    const where = ["(p.visibility = 'public' OR p.user_id = ?)"];
    const params = [userId];

    if (filter === "saved" && userId) where.push("p.saved_by_json LIKE ?");
    if (filter === "saved" && userId) params.push(`%"${userId}"%`);
    if (filter === "mine" && userId) {
      where.length = 0;
      where.push("p.user_id = ?");
      params.length = 0;
      params.push(userId);
    }
    if (q) {
      where.push("LOWER(p.title || ' ' || p.content || ' ' || COALESCE(p.summary, '') || ' ' || COALESCE(p.tags_json, '')) LIKE ?");
      params.push(`%${q}%`);
    }

    let order = "p.created_at DESC";
    if (filter === "popular") order = "likes_count DESC, p.created_at DESC";
    if (filter === "commented") order = "comments_count DESC, p.created_at DESC";

    const rows = await all(`
      SELECT
        p.*,
        u.id AS author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar_url,
        u.settings_json AS author_settings_json,
        COALESCE(vote_counts.likes_count, 0) AS likes_count,
        COALESCE(comment_counts.comments_count, 0) AS comments_count,
        CASE WHEN liked.id IS NULL THEN 0 ELSE 1 END AS liked_by_current_user,
        CASE WHEN p.saved_by_json LIKE ? THEN 1 ELSE 0 END AS saved_by_current_user
      FROM forum_posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN (
        SELECT target_id, SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END) AS likes_count
        FROM forum_votes
        WHERE target_type = 'post'
        GROUP BY target_id
      ) vote_counts ON vote_counts.target_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comments_count
        FROM forum_comments
        GROUP BY post_id
      ) comment_counts ON comment_counts.post_id = p.id
      LEFT JOIN forum_votes liked ON liked.target_type = 'post' AND liked.target_id = p.id AND liked.user_id = ? AND liked.vote_type = 'up'
      WHERE ${where.join(" AND ")}
      ORDER BY ${order}
      LIMIT ? OFFSET ?
    `, [`%"${userId}"%`, userId].concat(params, [limit + 1, offset]));

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    res.json({
      posts: pageRows.map(postFromJoinedRow),
      page: { limit, offset, nextOffset: offset + pageRows.length, hasMore }
    });
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

router.put("/posts/:postId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!row) return res.status(404).json({ error: "Post not found" });
    if (row.user_id !== req.user.id) return res.status(403).json({ error: "Solo puedes editar tus publicaciones." });
    const title = String(req.body.title || row.title).trim();
    const content = String(req.body.content || row.content).trim();
    if (!title) return res.status(400).json({ error: "El titulo no puede estar vacio." });
    if (!content) return res.status(400).json({ error: "El contenido no puede estar vacio." });
    await run("UPDATE forum_posts SET title = ?, content = ?, summary = ?, tags_json = ?, visibility = ?, updated_at = ? WHERE id = ?", [
      title, content, req.body.summary || "", JSON.stringify(req.body.tags || []), req.body.visibility || row.visibility, now(), row.id
    ]);
    res.json({ post: await postOut(await get("SELECT * FROM forum_posts WHERE id = ?", [row.id]), req.user.id) });
  } catch (error) { next(error); }
});

router.delete("/posts/:postId", requireAuth, async (req, res, next) => {
  try {
    const row = await get("SELECT * FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!row) return res.status(404).json({ error: "Post not found" });
    if (row.user_id !== req.user.id) return res.status(403).json({ error: "Solo puedes borrar tus publicaciones." });
    await run("DELETE FROM forum_posts WHERE id = ?", [row.id]);
    await run("DELETE FROM forum_votes WHERE target_type = 'post' AND target_id = ?", [row.id]);
    res.json({ ok: true });
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

router.get("/posts/:postId/comments", optionalAuth, async (req, res, next) => {
  try {
    const post = await get("SELECT id FROM forum_posts WHERE id = ?", [req.params.postId]);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const { limit, offset } = parseLimitOffset(req.query);
    const comments = await all(`
      SELECT c.*, u.username, u.avatar_url, u.settings_json
      FROM forum_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at
      LIMIT ? OFFSET ?
    `, [req.params.postId, limit + 1, offset]);
    const hasMore = comments.length > limit;
    res.json({ comments: comments.slice(0, limit), page: { limit, offset, nextOffset: offset + Math.min(comments.length, limit), hasMore } });
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

async function applyVote(req, res, next, forced) {
  try {
    const targetType = req.body.targetType === "comment" ? "comment" : "post";
    const voteType = req.body.voteType === "down" ? "down" : "up";
    const targetId = String(req.body.targetId || req.params.postId || "");
    if (!targetId) return res.status(400).json({ error: "Falta el objetivo del voto." });
    const existing = await get("SELECT * FROM forum_votes WHERE user_id = ? AND target_type = ? AND target_id = ?", [req.user.id, targetType, targetId]);
    let liked = false;
    if (forced === "delete") {
      if (existing) await run("DELETE FROM forum_votes WHERE id = ?", [existing.id]);
    } else if (existing && existing.vote_type === voteType) {
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
}

router.post("/vote", requireAuth, applyVote);
router.post("/posts/:postId/like", requireAuth, (req, res, next) => {
  req.body.targetType = "post";
  req.body.targetId = req.params.postId;
  req.body.voteType = "up";
  return applyVote(req, res, next);
});
router.delete("/posts/:postId/like", requireAuth, (req, res, next) => {
  req.body.targetType = "post";
  req.body.targetId = req.params.postId;
  req.body.voteType = "up";
  return applyVote(req, res, next, "delete");
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
