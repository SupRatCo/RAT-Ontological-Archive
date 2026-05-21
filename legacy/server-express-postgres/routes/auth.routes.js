const express = require("express");
const authService = require("../services/auth.service");
const { requireAuth } = require("../middleware/auth.middleware");
const { authLimiter } = require("../middleware/rateLimit.middleware");

const router = express.Router();

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserBundle(req.user.id);
    res.json({ ok: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true, data: { loggedOut: true } });
});

module.exports = router;
