const { query } = require("../db/pool");

async function listNotifications(userId) {
  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 80`,
    [userId]
  );
  return result.rows;
}

async function createNotification(userId, payload = {}) {
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, data_json)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [userId, payload.type || "system", payload.title || "Notificación", payload.message || "", JSON.stringify(payload.data_json || payload.dataJson || {})]
  );
  return result.rows[0];
}

async function markRead(userId, notificationId) {
  const result = await query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

module.exports = {
  listNotifications,
  createNotification,
  markRead
};
