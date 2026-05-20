const { query, transaction } = require("../db/pool");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { sanitizeHtml } = require("../utils/sanitize");

function normalizeLimit(value, fallback = 20, max = 50) {
  return Math.min(Math.max(Number.parseInt(value, 10) || fallback, 1), max);
}

async function listPosts(userId, options = {}) {
  const limit = normalizeLimit(options.limit);
  const offset = Math.max(Number.parseInt(options.offset, 10) || 0, 0);
  const q = String(options.q || "").trim();
  const filter = options.filter || "recent";
  const params = [userId || null, limit, offset];
  let where = "fp.deleted_at IS NULL AND (fp.visibility = 'public' OR fp.author_id = $1)";

  if (filter === "mine") where += " AND fp.author_id = $1";
  if (filter === "saved") where += " AND sp.user_id IS NOT NULL";
  if (q) {
    params.push(`%${q}%`);
    where += ` AND (fp.title ILIKE $${params.length} OR fp.summary ILIKE $${params.length} OR fp.content_html ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
  }

  const order = filter === "popular"
    ? "likes_count DESC, comments_count DESC, fp.created_at DESC"
    : "fp.created_at DESC";

  const result = await query(
    `SELECT fp.id, fp.title, fp.summary, fp.content_html, fp.source_type, fp.source_document_id,
            fp.visibility, fp.cover_url, fp.tags_json, fp.created_at, fp.updated_at,
            u.id AS author_id, u.username, p.display_name, p.avatar_url, p.accent_color,
            count(DISTINCT fl.id)::int AS likes_count,
            count(DISTINCT fc.id)::int AS comments_count,
            bool_or(fl.user_id = $1)::boolean AS liked_by_current_user,
            (sp.user_id IS NOT NULL)::boolean AS saved_by_current_user
       FROM forum_posts fp
       JOIN users u ON u.id = fp.author_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN forum_likes fl ON fl.post_id = fp.id
       LEFT JOIN forum_comments fc ON fc.post_id = fp.id AND fc.deleted_at IS NULL
       LEFT JOIN saved_posts sp ON sp.post_id = fp.id AND sp.user_id = $1
      WHERE ${where}
      GROUP BY fp.id, u.id, p.user_id, sp.user_id
      ORDER BY ${order}
      LIMIT $2 OFFSET $3`,
    params
  );

  return {
    posts: result.rows,
    page: {
      limit,
      offset,
      nextOffset: offset + result.rows.length,
      hasMore: result.rows.length === limit
    }
  };
}

async function createPost(userId, payload = {}) {
  const title = String(payload.title || "").trim();
  const content = sanitizeHtml(payload.content_html || payload.contentHtml || payload.content || "");
  if (!title) throw badRequest("El título no puede estar vacío.");
  if (!content.trim()) throw badRequest("El contenido no puede estar vacío.");

  const result = await query(
    `INSERT INTO forum_posts (author_id, source_type, source_document_id, title, summary, content_html, visibility, cover_url, tags_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
     RETURNING *`,
    [
      userId,
      payload.source_type || payload.sourceType || "normal",
      payload.source_document_id || payload.sourceDocumentId || null,
      title,
      payload.summary || "",
      content,
      payload.visibility === "private" ? "private" : "public",
      payload.cover_url || payload.coverUrl || null,
      JSON.stringify(payload.tags || [])
    ]
  );

  return getPost(result.rows[0].id, userId);
}

async function getPost(postId, userId) {
  const result = await query(
    `SELECT fp.*, u.username, p.display_name, p.avatar_url, p.accent_color,
            (SELECT count(*)::int FROM forum_likes fl WHERE fl.post_id = fp.id) AS likes_count,
            (SELECT count(*)::int FROM forum_comments fc WHERE fc.post_id = fp.id AND fc.deleted_at IS NULL) AS comments_count,
            EXISTS(SELECT 1 FROM forum_likes fl WHERE fl.post_id = fp.id AND fl.user_id = $2) AS liked_by_current_user,
            EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = fp.id AND sp.user_id = $2) AS saved_by_current_user
       FROM forum_posts fp
       JOIN users u ON u.id = fp.author_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE fp.id = $1 AND fp.deleted_at IS NULL`,
    [postId, userId || null]
  );
  const post = result.rows[0];
  if (!post) throw notFound("Publicación no encontrada.");
  if (post.visibility === "private" && post.author_id !== userId) throw forbidden("No puedes ver esta publicación.");
  return post;
}

async function toggleLike(postId, userId) {
  await getPost(postId, userId);
  return transaction(async (client) => {
    const deleted = await client.query(
      "DELETE FROM forum_likes WHERE post_id = $1 AND user_id = $2 RETURNING id",
      [postId, userId]
    );
    let liked = false;
    if (!deleted.rows[0]) {
      await client.query("INSERT INTO forum_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, userId]);
      liked = true;
    }
    const count = await client.query("SELECT count(*)::int AS count FROM forum_likes WHERE post_id = $1", [postId]);
    return { liked, likesCount: count.rows[0].count };
  });
}

async function removeLike(postId, userId) {
  await getPost(postId, userId);
  await query("DELETE FROM forum_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  const count = await query("SELECT count(*)::int AS count FROM forum_likes WHERE post_id = $1", [postId]);
  return { liked: false, likesCount: count.rows[0].count };
}

async function toggleSave(postId, userId) {
  await getPost(postId, userId);
  return transaction(async (client) => {
    const deleted = await client.query(
      "DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2 RETURNING post_id",
      [postId, userId]
    );
    let saved = false;
    if (!deleted.rows[0]) {
      await client.query("INSERT INTO saved_posts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [postId, userId]);
      saved = true;
    }
    return { saved };
  });
}

async function removeSave(postId, userId) {
  await getPost(postId, userId);
  await query("DELETE FROM saved_posts WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  return { saved: false };
}

async function listComments(postId, userId) {
  await getPost(postId, userId);
  const result = await query(
    `SELECT fc.*, u.username, p.display_name, p.avatar_url, p.accent_color
       FROM forum_comments fc
       JOIN users u ON u.id = fc.author_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE fc.post_id = $1 AND fc.deleted_at IS NULL
      ORDER BY fc.created_at ASC`,
    [postId]
  );
  return result.rows;
}

async function createComment(postId, userId, payload = {}) {
  await getPost(postId, userId);
  const content = String(payload.content || "").trim();
  if (!content) throw badRequest("El comentario no puede estar vacío.");
  const result = await query(
    `INSERT INTO forum_comments (post_id, author_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [postId, userId, payload.parent_comment_id || payload.parentCommentId || null, content]
  );
  return result.rows[0];
}

async function deleteComment(commentId, userId) {
  const result = await query("SELECT * FROM forum_comments WHERE id = $1 AND deleted_at IS NULL", [commentId]);
  const comment = result.rows[0];
  if (!comment) throw notFound("Comentario no encontrado.");
  if (comment.author_id !== userId) throw forbidden("Solo puedes borrar tus comentarios.");
  await query("UPDATE forum_comments SET deleted_at = now(), updated_at = now() WHERE id = $1", [commentId]);
  return { deleted: true };
}

module.exports = {
  listPosts,
  createPost,
  getPost,
  toggleLike,
  removeLike,
  toggleSave,
  removeSave,
  listComments,
  createComment,
  deleteComment
};
