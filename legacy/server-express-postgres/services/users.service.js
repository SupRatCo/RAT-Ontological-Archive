const { query } = require("../db/pool");
const { badRequest, notFound } = require("../utils/errors");
const { normalizeUsername } = require("../utils/sanitize");
const { publicUser } = require("./auth.service");

async function updateProfile(userId, payload = {}) {
  const displayName = payload.display_name ?? payload.displayName;
  const externalLinks = payload.external_links_json ?? payload.externalLinks ?? [];
  const accentColor = payload.accent_color || payload.accentColor || "#ffd800";

  if (payload.username) {
    const username = normalizeUsername(payload.username);
    if (username.length < 3) throw badRequest("El nombre de usuario debe tener al menos 3 caracteres.");
    await query("UPDATE users SET username = $1, updated_at = now() WHERE id = $2", [username, userId]);
  }

  await query(
    `UPDATE user_profiles
        SET display_name = COALESCE($2, display_name),
            avatar_url = COALESCE($3, avatar_url),
            banner_url = COALESCE($4, banner_url),
            bio = COALESCE($5, bio),
            accent_color = COALESCE($6, accent_color),
            external_links_json = COALESCE($7::jsonb, external_links_json),
            updated_at = now()
      WHERE user_id = $1`,
    [
      userId,
      displayName ?? null,
      payload.avatar_url ?? payload.avatarUrl ?? null,
      payload.banner_url ?? payload.bannerUrl ?? null,
      payload.bio ?? null,
      accentColor,
      JSON.stringify(externalLinks)
    ]
  );

  return getPrivateProfile(userId);
}

async function getPrivateProfile(userId) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.created_at,
            p.display_name, p.avatar_url, p.banner_url, p.bio, p.accent_color, p.external_links_json,
            s.language, s.theme, s.reduced_motion, s.visual_quality, s.audio_volume, s.settings_json
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN user_settings s ON s.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  if (!result.rows[0]) throw notFound("Usuario no encontrado.");
  return publicUser(result.rows[0]);
}

async function getPublicProfile(userId) {
  const result = await query(
    `SELECT u.id, u.username, u.created_at,
            p.display_name, p.avatar_url, p.banner_url, p.bio, p.accent_color, p.external_links_json,
            (SELECT count(*)::int FROM forum_posts fp WHERE fp.author_id = u.id AND fp.visibility = 'public' AND fp.deleted_at IS NULL) AS posts_count,
            (SELECT count(*)::int FROM forum_comments fc WHERE fc.author_id = u.id AND fc.deleted_at IS NULL) AS comments_count,
            (SELECT count(*)::int
               FROM forum_likes fl
               JOIN forum_posts fp ON fp.id = fl.post_id
              WHERE fp.author_id = u.id) AS likes_received
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  if (!result.rows[0]) throw notFound("Usuario no encontrado.");

  const posts = await query(
    `SELECT id, title, summary, created_at
       FROM forum_posts
      WHERE author_id = $1 AND visibility = 'public' AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 20`,
    [userId]
  );

  const projects = await query(
    `SELECT id, name, description, cover_url, created_at
       FROM projects
      WHERE owner_id = $1 AND visibility = 'public' AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 20`,
    [userId]
  );

  return {
    user: result.rows[0],
    posts: posts.rows,
    projects: projects.rows
  };
}

async function searchUsers(q = "") {
  const term = `%${String(q).trim()}%`;
  const result = await query(
    `SELECT u.id, u.username, p.display_name, p.avatar_url, p.accent_color
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE u.username ILIKE $1 OR p.display_name ILIKE $1
      ORDER BY u.username ASC
      LIMIT 25`,
    [term]
  );
  return result.rows;
}

module.exports = {
  updateProfile,
  getPrivateProfile,
  getPublicProfile,
  searchUsers
};
