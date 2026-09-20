const db = require('../config/db');
const bcrypt = require('bcryptjs');

const getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.phone, u.qualification, u.specialization,
             u.experience_years, u.is_active, u.created_at,
             COUNT(DISTINCT t.patient_id) as total_patients,
             SUM(CASE WHEN t.status = 'Ongoing' THEN 1 ELSE 0 END) as active_patients,
             SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) as cured_patients,
             ROUND(SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.treatment_id), 0), 1) as cure_rate
      FROM Users u
      LEFT JOIN Treatments t ON u.user_id = t.doctor_id
      WHERE u.role = 'doctor'
      GROUP BY u.user_id
      ORDER BY u.name
    `);
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.phone, u.qualification, u.specialization,
             u.experience_years, u.is_active, u.created_at,
             COUNT(DISTINCT t.patient_id) as total_patients,
             SUM(CASE WHEN t.status = 'Ongoing' THEN 1 ELSE 0 END) as active_patients,
             SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) as cured_patients,
             SUM(CASE WHEN t.status = 'Left Treatment' THEN 1 ELSE 0 END) as left_patients,
             ROUND(SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.treatment_id), 0), 1) as cure_rate
      FROM Users u
      LEFT JOIN Treatments t ON u.user_id = t.doctor_id
      WHERE u.user_id = ? AND u.role = 'doctor'
      GROUP BY u.user_id
    `, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, doctor: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDoctor = async (req, res) => {
  const { name, email, phone, password, qualification, specialization, experience_years } = req.body;
  try {
    const [existing] = await db.query('SELECT user_id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already exists' });
    const hash = await bcrypt.hash(password || 'Ayushi@123', 10);
    const [result] = await db.query(
      'INSERT INTO Users (name, email, phone, password_hash, role, qualification, specialization, experience_years, is_verified) VALUES (?,?,?,?,?,?,?,?,1)',
      [name, email, phone, hash, 'doctor', qualification, specialization, experience_years || 0]
    );
    res.status(201).json({ success: true, message: 'Doctor created', doctorId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { name, phone, qualification, specialization, experience_years } = req.body;
  try {
    await db.query(
      "UPDATE Users SET name=?, phone=?, qualification=?, specialization=?, experience_years=? WHERE user_id=? AND role='doctor'",
      [name, phone, qualification, specialization, experience_years, id]
    );
    res.json({ success: true, message: 'Doctor updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const toggleDoctorStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT is_active FROM Users WHERE user_id = ? AND role = 'doctor'", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found' });
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE Users SET is_active = ? WHERE user_id = ?', [newStatus, id]);
    res.json({ success: true, message: `Doctor ${newStatus ? 'enabled' : 'disabled'}`, is_active: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDoctorPerformance = async (req, res) => {
  try {
    const [performance] = await db.query(`
      SELECT u.user_id, u.name, u.specialization,
             COUNT(DISTINCT t.treatment_id) as total_treatments,
             COUNT(DISTINCT t.patient_id) as total_patients,
             SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) as cured,
             SUM(CASE WHEN t.status = 'Ongoing' THEN 1 ELSE 0 END) as ongoing,
             SUM(CASE WHEN t.status = 'Left Treatment' THEN 1 ELSE 0 END) as dropout,
             ROUND(SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.treatment_id), 0), 1) as cure_rate,
             ROUND(AVG(t.improvement_percentage), 1) as avg_improvement,
             COUNT(DISTINCT f.followup_id) as total_followups
      FROM Users u
      LEFT JOIN Treatments t ON u.user_id = t.doctor_id
      LEFT JOIN Followups f ON t.treatment_id = f.treatment_id
      WHERE u.role = 'doctor' AND u.is_active = 1
      GROUP BY u.user_id
      ORDER BY cure_rate DESC
    `);
    res.json({ success: true, performance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllDoctors, getDoctorById, createDoctor, updateDoctor, toggleDoctorStatus, getDoctorPerformance };
