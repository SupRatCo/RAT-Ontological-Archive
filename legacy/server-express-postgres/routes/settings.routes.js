const express = require("express");
const { query, hasDatabaseUrl } = require("../db/pool");
const { requireAuth } = require("../middleware/auth.middleware");
const storageService = require("../services/storage.service");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM user_settings WHERE user_id = $1", [req.user.id]);
    res.json({ ok: true, data: { settings: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.patch("/", requireAuth, async (req, res, next) => {
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

router.get("/diagnostics", (_req, res) => {
  res.json({
    ok: true,
    data: {
      api: "online",
      database: hasDatabaseUrl ? "configured" : "missing DATABASE_URL",
      storage: storageService.isConfigured() ? "configured" : "missing Supabase Storage env",
      mode: "express-postgres"
    }
  });
});

module.exports = router;
