const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const notificationsService = require("../services/notifications.service");

const router = express.Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const notifications = await notificationsService.listNotifications(req.user.id);
    res.json({ ok: true, data: { notifications } });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await notificationsService.markRead(req.user.id, req.params.id);
    res.json({ ok: true, data: { notification } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
