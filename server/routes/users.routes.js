const express = require("express");
const { run, get, all } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");
const { avatarUpload } = require("../middleware/upload.middleware");

const router = express.Router();
const now = () => new Date().toISOString();

function publicUser(user) {
  const settings = JSON.parse(user.settings_json || "{}");
  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar_url || "",
    avatar_url: user.avatar_url || "",
    banner: settings.banner || "",
    bio: settings.bio || "",
    links: settings.links || "",
    accent: settings.accent || "",
    settings,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const users = await all("SELECT id, username, avatar_url, settings_json, created_at, updated_at FROM users ORDER BY username");
    res.json({ users: users.map(publicUser) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const settings = req.body.settings ? JSON.stringify(req.body.settings) : null;
    if (username) {
      const existing = await get("SELECT id FROM users WHERE lower(username) = lower(?) AND id <> ?", [username, req.user.id]);
      if (existing) return res.status(409).json({ error: "Ese nombre de usuario ya existe." });
      await run("UPDATE users SET username = ?, updated_at = ? WHERE id = ?", [username, now(), req.user.id]);
    }
    if (settings) await run("UPDATE users SET settings_json = ?, updated_at = ? WHERE id = ?", [settings, now(), req.user.id]);
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/me/avatar", requireAuth, avatarUpload.single("avatar"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio ningun avatar." });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await run("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?", [avatarUrl, now(), req.user.id]);
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/me/banner", requireAuth, avatarUpload.single("banner"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No se recibio ningun banner." });
    const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    const settings = JSON.parse((user && user.settings_json) || "{}");
    settings.banner = `/uploads/avatars/${req.file.filename}`;
    await run("UPDATE users SET settings_json = ?, updated_at = ? WHERE id = ?", [JSON.stringify(settings), now(), req.user.id]);
    const updated = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: publicUser(updated) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/public", async (req, res, next) => {
  try {
    const user = await get("SELECT id, username, avatar_url, settings_json, created_at, updated_at FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const posts = await all("SELECT id, title, summary, created_at FROM forum_posts WHERE user_id = ? AND visibility = 'public' ORDER BY created_at DESC", [req.params.id]);
    const projects = await all("SELECT id, name, description, created_at FROM projects WHERE owner_id = ? AND visibility = 'public' ORDER BY created_at DESC", [req.params.id]);
    res.json({ user: publicUser(user), posts, projects });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
