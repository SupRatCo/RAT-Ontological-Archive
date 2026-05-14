const express = require("express");
const { run, all, get } = require("../database");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

async function notify(userId, title, message, type = "system", meta = {}) {
  await run("INSERT INTO notifications (id, user_id, title, message, type, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [uid("notice"), userId, title, message, type, JSON.stringify(meta), now()]);
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    res.json({ notifications: rows.map((n) => ({ ...n, meta: JSON.parse(n.meta_json || "{}") })) });
  } catch (error) { next(error); }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    await notify(req.body.userId || req.user.id, req.body.title, req.body.message || "", req.body.type || "system", req.body.meta || {});
    res.json({ ok: true });
  } catch (error) { next(error); }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notice = await get("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    if (!notice) return res.status(404).json({ error: "Notification not found" });
    await run("UPDATE notifications SET read = 1 WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

module.exports = { router, notify };
