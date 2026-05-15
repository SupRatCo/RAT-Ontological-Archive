const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || "rat-local-dev-secret";

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username }, secret, { expiresIn: "30d" });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Falta token de autenticacion." });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch (error) {
    res.status(401).json({ error: "Sesion invalida o expirada." });
  }
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token) {
    try { req.user = jwt.verify(token, secret); } catch (_error) { req.user = null; }
  }
  next();
}

module.exports = { sign, requireAuth, optionalAuth };
