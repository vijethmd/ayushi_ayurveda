const db = require('../config/db');
const { addTimelineEvent } = require('../utils/timeline');

const getFollowupsByTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  try {
    const [followups] = await db.query(
      'SELECT * FROM Followups WHERE treatment_id = ? ORDER BY followup_date DESC', [treatmentId]
    );
    res.json({ success: true, followups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createFollowup = async (req, res) => {
  const { treatment_id, followup_date, symptoms, side_effects, notes } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Followups (treatment_id, followup_date, symptoms, side_effects, notes) VALUES (?,?,?,?,?)',
      [treatment_id, followup_date, symptoms, side_effects, notes]
    );
    await db.query('UPDATE Treatments SET updated_at = NOW() WHERE treatment_id = ?', [treatment_id]);
    const [treatment] = await db.query('SELECT patient_id FROM Treatments WHERE treatment_id = ?', [treatment_id]);
    if (treatment.length > 0) {
      const detail = [symptoms && `Response: ${symptoms}`, side_effects && `Side effects: ${side_effects}`, notes].filter(Boolean).join('. ');
      await addTimelineEvent(treatment[0].patient_id, 'followup', 'Follow-Up Completed',
        `Follow-up on ${followup_date}.${detail ? ' ' + detail : ''}`, req.user.userId);
    }
    res.status(201).json({ success: true, message: 'Follow-up added', followupId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFollowup = async (req, res) => {
  const { id } = req.params;
  const { followup_date, symptoms, side_effects, notes } = req.body;
  try {
    await db.query(
      'UPDATE Followups SET followup_date=?, symptoms=?, side_effects=?, notes=? WHERE followup_id=?',
      [followup_date, symptoms, side_effects, notes, id]
    );
    res.json({ success: true, message: 'Follow-up updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUpcomingFollowups = async (req, res) => {
  try {
    const [followups] = await db.query(`
      SELECT f.*, p.name as patient_name, p.patient_code, d.disease_name, u.name as doctor_name
      FROM Followups f
      JOIN Treatments t ON f.treatment_id = t.treatment_id
      JOIN Patients p ON t.patient_id = p.patient_id
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      WHERE f.followup_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ${req.user.role === 'doctor' ? 'AND t.doctor_id = ' + req.user.userId : ''}
      ORDER BY f.followup_date ASC
      LIMIT 50
    `);
    res.json({ success: true, followups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMissedFollowups = async (req, res) => {
  try {
    const [followups] = await db.query(`
      SELECT f.*, p.name as patient_name, p.patient_code, d.disease_name, u.name as doctor_name
      FROM Followups f
      JOIN Treatments t ON f.treatment_id = t.treatment_id
      JOIN Patients p ON t.patient_id = p.patient_id
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      WHERE f.followup_date < CURDATE() AND t.status = 'Ongoing'
      ${req.user.role === 'doctor' ? 'AND t.doctor_id = ' + req.user.userId : ''}
      ORDER BY f.followup_date DESC
      LIMIT 50
    `);
    res.json({ success: true, followups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFollowupsByTreatment, createFollowup, updateFollowup, getUpcomingFollowups, getMissedFollowups };
