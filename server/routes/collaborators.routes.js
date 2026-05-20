const express = require("express");
const { query } = require("../db/pool");
const { requireAuth } = require("../middleware/auth.middleware");
const { badRequest, forbidden, notFound } = require("../utils/errors");
const { getProjectRole } = require("../services/permissions.service");

const router = express.Router();

router.get("/friends", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT f.*, u.username, p.display_name, p.avatar_url
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE (f.requester_id = $1 OR f.receiver_id = $1)
        ORDER BY f.updated_at DESC`,
      [req.user.id]
    );
    res.json({ ok: true, data: { friends: result.rows } });
  } catch (error) {
    next(error);
  }
});

router.post("/friends/:userId", requireAuth, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) throw badRequest("No puedes enviarte una solicitud a ti mismo.");
    const result = await query(
      `INSERT INTO friendships (requester_id, receiver_id, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (requester_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = now()
       RETURNING *`,
      [req.user.id, req.params.userId]
    );
    res.status(201).json({ ok: true, data: { friendship: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.patch("/friends/:friendshipId", requireAuth, async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!["accepted", "rejected", "blocked"].includes(status)) throw badRequest("Estado de amistad inválido.");
    const result = await query(
      `UPDATE friendships
          SET status = $3, updated_at = now()
        WHERE id = $1 AND (requester_id = $2 OR receiver_id = $2)
        RETURNING *`,
      [req.params.friendshipId, req.user.id, status]
    );
    if (!result.rows[0]) throw notFound("Solicitud no encontrada.");
    res.json({ ok: true, data: { friendship: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.get("/projects/:projectId/members", requireAuth, async (req, res, next) => {
  try {
    const role = await getProjectRole(req.params.projectId, req.user.id);
    if (!role) throw forbidden("No tienes acceso a este proyecto.");
    const result = await query(
      `SELECT pm.*, u.username, p.display_name, p.avatar_url
         FROM project_members pm
         JOIN users u ON u.id = pm.user_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE pm.project_id = $1
        ORDER BY pm.created_at ASC`,
      [req.params.projectId]
    );
    res.json({ ok: true, data: { members: result.rows } });
  } catch (error) {
    next(error);
  }
});

router.post("/projects/:projectId/invites", requireAuth, async (req, res, next) => {
  try {
    const role = await getProjectRole(req.params.projectId, req.user.id);
    if (role !== "owner") throw forbidden("Solo el owner puede invitar colaboradores.");
    const invitedUserId = req.body.invited_user_id || req.body.invitedUserId;
    if (!invitedUserId) throw badRequest("Falta el usuario invitado.");
    const inviteRole = req.body.role === "editor" ? "editor" : "viewer";
    const result = await query(
      `INSERT INTO project_invites (project_id, inviter_id, invited_user_id, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.projectId, req.user.id, invitedUserId, inviteRole]
    );
    res.status(201).json({ ok: true, data: { invite: result.rows[0] } });
  } catch (error) {
    next(error);
  }
});

router.patch("/invites/:inviteId", requireAuth, async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!["accepted", "rejected"].includes(status)) throw badRequest("Estado de invitación inválido.");
    const inviteResult = await query(
      `UPDATE project_invites
          SET status = $3, updated_at = now()
        WHERE id = $1 AND invited_user_id = $2
        RETURNING *`,
      [req.params.inviteId, req.user.id, status]
    );
    const invite = inviteResult.rows[0];
    if (!invite) throw notFound("Invitación no encontrada.");
    if (status === "accepted") {
      await query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
        [invite.project_id, req.user.id, invite.role]
      );
    }
    res.json({ ok: true, data: { invite } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
