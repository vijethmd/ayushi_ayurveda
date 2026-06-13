const db = require('../config/db');
const { addTimelineEvent } = require('../utils/timeline');

const getTreatmentsByPatient = async (req, res) => {
  const { patientId } = req.params;
  try {
    const [treatments] = await db.query(`
      SELECT t.*, d.disease_name, d.category_name, u.name as doctor_name,
             COUNT(f.followup_id) as followup_count
      FROM Treatments t
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      LEFT JOIN Followups f ON t.treatment_id = f.treatment_id
      WHERE t.patient_id = ?
      GROUP BY t.treatment_id
      ORDER BY t.start_date DESC
    `, [patientId]);
    res.json({ success: true, treatments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTreatmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT t.*, d.disease_name, d.category_name, u.name as doctor_name,
             p.name as patient_name, p.patient_code, p.age, p.gender
      FROM Treatments t
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      JOIN Patients p ON t.patient_id = p.patient_id
      WHERE t.treatment_id = ?
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Treatment not found' });

    const [followups] = await db.query(
      'SELECT * FROM Followups WHERE treatment_id = ? ORDER BY followup_date DESC', [id]
    );
    res.json({ success: true, treatment: rows[0], followups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Build a readable summary of medicines / lifestyle / diet for timeline descriptions
const careSummary = (medicines_json, lifestyle_json, diet_json) => {
  const fmt = (arr) => (Array.isArray(arr) ? arr : []).map(item => {
    if (typeof item === 'string') return item;
    if (item && item.name) return [item.name, item.dosage, item.frequency].filter(Boolean).join(' ');
    return (item && (item.recommendation || item.advice || item.notes)) || '';
  }).filter(Boolean);
  const parts = [];
  const meds = fmt(medicines_json);
  const life = fmt(lifestyle_json);
  const diet = fmt(diet_json);
  if (meds.length) parts.push(`Medicines: ${meds.join(', ')}`);
  if (life.length) parts.push(`Lifestyle: ${life.join(', ')}`);
  if (diet.length) parts.push(`Diet: ${diet.join(', ')}`);
  return parts.join('. ');
};

const createTreatment = async (req, res) => {
  const { patient_id, doctor_id, disease_id, start_date, medicines_json, lifestyle_json, diet_json, current_notes } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [patient_id, doctor_id || req.user.userId, disease_id, start_date, 'Ongoing', 0,
       JSON.stringify(medicines_json || []), JSON.stringify(lifestyle_json || []), JSON.stringify(diet_json || []), current_notes]
    );
    const [disease] = await db.query('SELECT disease_name FROM Diseases WHERE disease_id = ?', [disease_id]);
    const summary = careSummary(medicines_json, lifestyle_json, diet_json);
    await addTimelineEvent(patient_id, 'treatment_started', `Treatment Started - ${disease[0]?.disease_name}`,
      `Ayurvedic treatment started for ${disease[0]?.disease_name}.` + (summary ? ' ' + summary + '.' : ' Medicines prescribed.'),
      req.user.userId);
    res.status(201).json({ success: true, message: 'Treatment created', treatmentId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateTreatment = async (req, res) => {
  const { id } = req.params;
  const { status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes, end_date } = req.body;
  try {
    const [prev] = await db.query('SELECT * FROM Treatments WHERE treatment_id = ?', [id]);
    if (prev.length === 0) return res.status(404).json({ success: false, message: 'Not found' });

    await db.query(
      'UPDATE Treatments SET status=?, improvement_percentage=?, medicines_json=?, lifestyle_json=?, diet_json=?, current_notes=?, end_date=?, updated_at=NOW() WHERE treatment_id=?',
      [status, improvement_percentage,
       JSON.stringify(medicines_json || []), JSON.stringify(lifestyle_json || []), JSON.stringify(diet_json || []),
       current_notes, end_date || null, id]
    );

    const { patient_id } = prev[0];
    if (prev[0].status !== status) {
      await addTimelineEvent(patient_id, 'status_changed', `Status Updated`,
        `Treatment status changed: ${prev[0].status} → ${status} (${improvement_percentage}% improvement)`, req.user.userId);
    }
    if (prev[0].medicines_json !== JSON.stringify(medicines_json)) {
      const summary = careSummary(medicines_json, lifestyle_json, diet_json);
      await addTimelineEvent(patient_id, 'medicine_updated', 'Medicines Updated',
        'Treatment plan updated by the doctor.' + (summary ? ' ' + summary + '.' : ''), req.user.userId);
    }
    if (status === 'Cured' || status === 'Left Treatment') {
      await addTimelineEvent(patient_id, 'treatment_completed',
        status === 'Cured' ? 'Treatment Completed' : 'Patient Left Treatment',
        status === 'Cured' ? 'Patient successfully cured. Treatment completed.' : 'Patient discontinued treatment.',
        req.user.userId);
    }
    res.json({ success: true, message: 'Treatment updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllTreatments = async (req, res) => {
  const { status, doctor_id, disease_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let where = [];
    let params = [];
    if (status) { where.push('t.status = ?'); params.push(status); }
    if (doctor_id) { where.push('t.doctor_id = ?'); params.push(doctor_id); }
    if (disease_id) { where.push('t.disease_id = ?'); params.push(disease_id); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [treatments] = await db.query(`
      SELECT t.*, p.name as patient_name, p.patient_code, d.disease_name, u.name as doctor_name
      FROM Treatments t
      JOIN Patients p ON t.patient_id = p.patient_id
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      ${whereClause}
      ORDER BY t.start_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countRows] = await db.query(`SELECT COUNT(*) as total FROM Treatments t ${whereClause}`, params);
    res.json({ success: true, treatments, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTreatmentsByPatient, getTreatmentById, createTreatment, updateTreatment, getAllTreatments };
