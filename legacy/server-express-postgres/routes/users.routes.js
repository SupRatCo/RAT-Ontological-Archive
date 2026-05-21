const express = require("express");
const { query } = require("../db/pool");
const { requireAuth } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");
const usersService = require("../services/users.service");
const storageService = require("../services/storage.service");

const router = express.Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await usersService.getPrivateProfile(req.user.id);
    res.json({ ok: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user.id, req.body);
    res.json({ ok: true, data: { user } });
  } catch (error) {
    next(error);
  }
});

router.post("/me/avatar", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const uploaded = await storageService.uploadFile(req.file, { userId: req.user.id, mediaType: "avatar", prefix: "avatars" });
    const user = await usersService.updateProfile(req.user.id, { avatar_url: uploaded.public_url });
    res.json({ ok: true, data: { user, media: uploaded } });
  } catch (error) {
    next(error);
  }
});

router.post("/me/banner", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    const uploaded = await storageService.uploadFile(req.file, { userId: req.user.id, mediaType: "banner", prefix: "banners" });
    const user = await usersService.updateProfile(req.user.id, { banner_url: uploaded.public_url });
    res.json({ ok: true, data: { user, media: uploaded } });
  } catch (error) {
    next(error);
  }
});

router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const users = await usersService.searchUsers(req.query.q || "");
    res.json({ ok: true, data: { users } });
  } catch (error) {
    next(error);
  }
});

router.get("/:userId/public", async (req, res, next) => {
  try {
    const profile = await usersService.getPublicProfile(req.params.userId);
    res.json({ ok: true, data: profile });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/settings", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await query(
      `UPDATE user_settings
          SET language = COALESCE($2, language),
              theme = COALESCE($3, theme),
              reduced_motion = COALESCE($4, reduced_motion),
              visual_quality = COALESCE($5, visual_quality),
              audio_volume = COALESCE($6, audio_volume),
              settings_json = settings_json || COALESCE($7::jsonb, '{}'::jsonb),
              updated_at = now()
        WHERE user_id = $1
        RETURNING *`,
      [
        req.user.id,
        payload.language ?? null,
        payload.theme ?? null,
        payload.reduced_motion ?? payload.reducedMotion ?? null,
        payload.visual_quality ?? payload.visualQuality ?? null,
        payload.audio_volume ?? payload.audioVolume ?? null,
        JSON.stringify(payload.settings_json || payload.settingsJson || {})
      ]
    );
    res.json({ ok: true, data: { settings: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
