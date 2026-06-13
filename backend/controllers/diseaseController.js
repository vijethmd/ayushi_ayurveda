const db = require('../config/db');

const getAllDiseases = async (req, res) => {
  const { search, category, is_active } = req.query;
  try {
    let where = [];
    let params = [];
    if (search) { where.push('(d.disease_name LIKE ? OR d.category_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (category) { where.push('d.category_name = ?'); params.push(category); }
    if (is_active !== undefined) { where.push('d.is_active = ?'); params.push(is_active); }
    else { where.push('d.is_active = 1'); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [diseases] = await db.query(`SELECT * FROM Diseases ${whereClause} ORDER BY category_name, disease_name`, params);
    res.json({ success: true, diseases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDiseaseCategories = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT DISTINCT category_name, COUNT(*) as disease_count FROM Diseases WHERE is_active=1 GROUP BY category_name ORDER BY category_name'
    );
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDiseaseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM Diseases WHERE disease_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Disease not found' });
    res.json({ success: true, disease: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDisease = async (req, res) => {
  const { category_name, disease_name, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Diseases (category_name, disease_name, description) VALUES (?,?,?)',
      [category_name, disease_name, description]
    );
    res.status(201).json({ success: true, message: 'Disease created', diseaseId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDisease = async (req, res) => {
  const { id } = req.params;
  const { category_name, disease_name, description } = req.body;
  try {
    await db.query('UPDATE Diseases SET category_name=?, disease_name=?, description=? WHERE disease_id=?',
      [category_name, disease_name, description, id]);
    res.json({ success: true, message: 'Disease updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleDiseaseStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT is_active FROM Diseases WHERE disease_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE Diseases SET is_active = ? WHERE disease_id = ?', [newStatus, id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Disease Intelligence
const getDiseaseIntelligence = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT d.disease_id, d.disease_name, d.category_name,
             COUNT(DISTINCT t.patient_id) as total_patients,
             SUM(CASE WHEN t.status = 'Ongoing' THEN 1 ELSE 0 END) as active_patients,
             SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) as cured_patients,
             SUM(CASE WHEN t.status = 'Left Treatment' THEN 1 ELSE 0 END) as left_patients,
             SUM(CASE WHEN t.status = 'Improved' THEN 1 ELSE 0 END) as improved_patients,
             ROUND(SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.treatment_id), 0), 1) as cure_rate,
             ROUND(AVG(t.improvement_percentage), 1) as avg_improvement,
             ROUND(AVG(DATEDIFF(COALESCE(t.end_date, CURDATE()), t.start_date)), 0) as avg_treatment_days
      FROM Diseases d
      LEFT JOIN Treatments t ON d.disease_id = t.disease_id
      WHERE d.is_active = 1
      GROUP BY d.disease_id
      HAVING total_patients > 0
      ORDER BY total_patients DESC
    `);
    res.json({ success: true, diseases: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDiseaseDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [disease] = await db.query('SELECT * FROM Diseases WHERE disease_id = ?', [id]);
    if (disease.length === 0) return res.status(404).json({ success: false, message: 'Not found' });

    const [stats] = await db.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status='Ongoing' THEN 1 ELSE 0 END) as active,
             SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END) as cured,
             SUM(CASE WHEN status='Left Treatment' THEN 1 ELSE 0 END) as left_treatment,
             SUM(CASE WHEN status='Improved' THEN 1 ELSE 0 END) as improved,
             ROUND(SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate,
             ROUND(AVG(improvement_percentage),1) as avg_improvement
      FROM Treatments WHERE disease_id = ?
    `, [id]);

    const [patients] = await db.query(`
      SELECT p.patient_id, p.patient_code, p.name as patient_name, p.age, p.gender,
             t.status, t.improvement_percentage, t.start_date, t.end_date,
             u.name as doctor_name
      FROM Treatments t
      JOIN Patients p ON t.patient_id = p.patient_id
      JOIN Users u ON t.doctor_id = u.user_id
      WHERE t.disease_id = ?
      ORDER BY t.start_date DESC
      LIMIT 100
    `, [id]);

    const [monthlyTrend] = await db.query(`
      SELECT DATE_FORMAT(start_date, '%Y-%m') as month, COUNT(*) as registrations,
             SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END) as cured
      FROM Treatments WHERE disease_id = ?
      GROUP BY month ORDER BY month DESC LIMIT 12
    `, [id]);

    const [aiReports] = await db.query(
      'SELECT * FROM AI_Reports WHERE disease_id = ? ORDER BY generated_at DESC LIMIT 5', [id]
    );

    res.json({ success: true, disease: disease[0], stats: stats[0], patients, monthlyTrend, aiReports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllDiseases, getDiseaseCategories, getDiseaseById, createDisease,
  updateDisease, toggleDiseaseStatus, getDiseaseIntelligence, getDiseaseDetail
};
