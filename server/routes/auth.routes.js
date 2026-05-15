const express = require("express");
const bcrypt = require("bcrypt");
const { run, get } = require("../database");
const { sign, requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar_url || "",
    avatar_url: user.avatar_url || "",
    settings: JSON.parse(user.settings_json || "{}"),
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (!username) return res.status(400).json({ error: "Username required" });
    if (username.length < 3) return res.status(400).json({ error: "El usuario debe tener al menos 3 caracteres." });
    if (password.length < 4) return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres." });
    const existing = await get("SELECT id FROM users WHERE lower(username) = lower(?)", [username]);
    if (existing) return res.status(409).json({ error: "Username already exists" });
    const id = uid("user");
    const hash = await bcrypt.hash(password, 10);
    await run("INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", [id, username, hash, now(), now()]);
    const user = await get("SELECT * FROM users WHERE id = ?", [id]);
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const user = await get("SELECT * FROM users WHERE lower(username) = lower(?)", [username]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => res.json({ ok: true }));

module.exports = router;
