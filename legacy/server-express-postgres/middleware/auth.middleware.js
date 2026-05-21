const jwt = require("jsonwebtoken");
const { query } = require("../db/pool");
const { unauthorized } = require("../utils/errors");

function getSecret() {
  return process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "dev_secret_only_local");
}

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const secret = getSecret();

    if (!token) throw unauthorized("Falta token de autenticación.");
    if (!secret) throw unauthorized("JWT_SECRET no está configurado en el servidor.");

    const payload = jwt.verify(token, secret);
    const result = await query(
      `SELECT u.id, u.username, u.email, u.created_at,
              p.display_name, p.avatar_url, p.banner_url, p.bio, p.accent_color
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1`,
      [payload.sub]
    );

    if (!result.rows[0]) throw unauthorized("Sesión inválida o expirada.");
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error.statusCode ? error : unauthorized("Sesión inválida o expirada.", error.message));
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const secret = getSecret();

  if (!token || !secret) return next();

  try {
    const payload = jwt.verify(token, secret);
    req.auth = { userId: payload.sub };
  } catch (_error) {
    req.auth = null;
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  getSecret
};
