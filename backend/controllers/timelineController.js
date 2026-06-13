const db = require('../config/db');

// Timeline
const getPatientTimeline = async (req, res) => {
  const { patientId } = req.params;
  const { event_type, search, limit = 50, page = 1 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let where = ['te.patient_id = ?'];
    let params = [patientId];
    if (event_type) { where.push('te.event_type = ?'); params.push(event_type); }
    if (search) { where.push('(te.event_title LIKE ? OR te.event_description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const [events] = await db.query(`
      SELECT te.*, u.name as created_by_name
      FROM Timeline_Events te
      LEFT JOIN Users u ON te.created_by = u.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY te.event_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total FROM Timeline_Events te WHERE ${where.join(' AND ')}`, params
    );
    res.json({ success: true, events, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Notifications
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const [notifications] = await db.query(
      'SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.userId, parseInt(limit), parseInt(offset)]
    );
    const [countRows] = await db.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) as unread FROM Notifications WHERE user_id = ?',
      [req.user.userId]
    );
    res.json({ success: true, notifications, total: countRows[0].total, unread: countRows[0].unread });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    if (id === 'all') {
      await db.query('UPDATE Notifications SET is_read = 1 WHERE user_id = ?', [req.user.userId]);
    } else {
      await db.query('UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?', [id, req.user.userId]);
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPatientTimeline, getNotifications, markNotificationRead };
