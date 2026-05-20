const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query, transaction } = require("../db/pool");
const { badRequest, unauthorized } = require("../utils/errors");
const { normalizeUsername } = require("../utils/sanitize");
const { getSecret } = require("../middleware/auth.middleware");

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    created_at: row.created_at,
    profile: {
      display_name: row.display_name || row.username,
      avatar_url: row.avatar_url || "",
      banner_url: row.banner_url || "",
      bio: row.bio || "",
      accent_color: row.accent_color || "#ffd800"
    },
    settings: row.settings_json ? {
      language: row.language,
      theme: row.theme,
      reduced_motion: row.reduced_motion,
      visual_quality: row.visual_quality,
      audio_volume: row.audio_volume,
      ...row.settings_json
    } : undefined
  };
}

async function getUserBundle(userId) {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.created_at,
            p.display_name, p.avatar_url, p.banner_url, p.bio, p.accent_color,
            s.language, s.theme, s.reduced_motion, s.visual_quality, s.audio_volume, s.settings_json
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN user_settings s ON s.user_id = u.id
      WHERE u.id = $1`,
    [userId]
  );
  return publicUser(result.rows[0]);
}

function signToken(userId) {
  const secret = getSecret();
  if (!secret) throw unauthorized("JWT_SECRET no está configurado.");
  return jwt.sign({ sub: userId }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

async function register({ username, email, password }) {
  const cleanUsername = normalizeUsername(username);
  if (cleanUsername.length < 3) throw badRequest("El nombre de usuario debe tener al menos 3 caracteres.");
  if (cleanUsername.length > 32) throw badRequest("El nombre de usuario no puede superar 32 caracteres.");
  if (!password || String(password).length < 6) throw badRequest("La contraseña debe tener al menos 6 caracteres.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) throw badRequest("El email no tiene un formato válido.");

  const passwordHash = await bcrypt.hash(String(password), 12);

  try {
    const userId = await transaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO users (username, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [cleanUsername, email || null, passwordHash]
      );
      const id = inserted.rows[0].id;
      await client.query(
        `INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)`,
        [id, cleanUsername]
      );
      await client.query(
        `INSERT INTO user_settings (user_id) VALUES ($1)`,
        [id]
      );
      return id;
    });

    return { token: signToken(userId), user: await getUserBundle(userId) };
  } catch (error) {
    if (error.code === "23505") throw badRequest("El nombre de usuario o email ya existe.");
    throw error;
  }
}

async function login({ identifier, username, email, password }) {
  const loginId = String(identifier || username || email || "").trim();
  if (!loginId || !password) throw badRequest("Usuario/email y contraseña son obligatorios.");

  const result = await query(
    `SELECT * FROM users WHERE lower(username) = lower($1) OR lower(coalesce(email, '')) = lower($1) LIMIT 1`,
    [loginId]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
    throw unauthorized("Credenciales inválidas.");
  }

  return { token: signToken(user.id), user: await getUserBundle(user.id) };
}

module.exports = {
  register,
  login,
  getUserBundle,
  publicUser
};
