const db = require('../config/db');
const { addTimelineEvent } = require('../utils/timeline');

const generatePatientCode = async () => {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM Patients');
  return `AYU-${String(rows[0].count+1).padStart(4,'0')}`;
};

// ALL patients visible to all doctors + admin
const getAllPatients = async (req, res) => {
  const { search, disease_id, status, doctor_id, my_patients, page=1, limit=20 } = req.query;
  const offset = (page-1)*limit;
  try {
    let where = ['p.is_active=1'];
    let params = [];

    if (search) {
      where.push('(p.name LIKE ? OR p.patient_code LIKE ? OR p.phone LIKE ?)');
      params.push(`%${search}%`,`%${search}%`,`%${search}%`);
    }
    if (disease_id) { where.push('t.disease_id=?'); params.push(disease_id); }
    if (status)     { where.push('t.status=?');     params.push(status); }

    // "my_patients" filter — show only patients this doctor has treated
    if (my_patients==='true' || (doctor_id && doctor_id!='all')) {
      const docId = doctor_id && doctor_id!='all' ? doctor_id : req.user.userId;
      where.push('t.doctor_id=?'); params.push(docId);
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;

    const [patients] = await db.query(`
      SELECT DISTINCT p.*,
        t.status as treatment_status,
        t.improvement_percentage,
        d.disease_name,
        u.name as doctor_name,
        t.doctor_id
      FROM Patients p
      LEFT JOIN Treatments t ON p.patient_id=t.patient_id
      LEFT JOIN Diseases d   ON t.disease_id=d.disease_id
      LEFT JOIN Users u      ON t.doctor_id=u.user_id
      ${whereClause}
      ORDER BY p.registration_date DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countRows] = await db.query(`
      SELECT COUNT(DISTINCT p.patient_id) as total
      FROM Patients p
      LEFT JOIN Treatments t ON p.patient_id=t.patient_id
      ${whereClause}
    `, params);

    res.json({ success:true, patients, total:countRows[0].total, page:parseInt(page), limit:parseInt(limit) });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const getPatientById = async (req,res) => {
  const { id } = req.params;
  try {
    const [patients] = await db.query('SELECT * FROM Patients WHERE patient_id=? AND is_active=1',[id]);
    if (!patients.length) return res.status(404).json({ success:false, message:'Patient not found' });

    const [treatments] = await db.query(`
      SELECT t.*, d.disease_name, d.category_name, u.name as doctor_name
      FROM Treatments t
      JOIN Diseases d ON t.disease_id=d.disease_id
      JOIN Users u ON t.doctor_id=u.user_id
      WHERE t.patient_id=? ORDER BY t.start_date DESC`, [id]);

    const [timeline] = await db.query(
      'SELECT * FROM Timeline_Events WHERE patient_id=? ORDER BY event_date DESC LIMIT 30',[id]);

    const [aiReports] = await db.query(
      'SELECT * FROM AI_Reports WHERE patient_id=? ORDER BY generated_at DESC',[id]);

    // Drug administrations for this patient
    const [drugs] = await db.query(`
      SELECT da.*, dr.name as drug_name, dr.category,
        do2.efficacy_score, do2.side_effects as outcome_se, do2.assessment_date,
        t.status as treatment_status, dis.disease_name
      FROM Drug_Administrations da
      JOIN Drugs dr ON da.drug_id=dr.drug_id
      JOIN Treatments t ON da.treatment_id=t.treatment_id
      JOIN Diseases dis ON t.disease_id=dis.disease_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      WHERE t.patient_id=? ORDER BY da.created_at DESC`, [id]);

    res.json({ success:true, patient:patients[0], treatments, timeline, aiReports, drugAdministrations:drugs });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const createPatient = async (req,res) => {
  const { name, age, gender, phone, address, occupation } = req.body;
  const registration_date = new Date().toISOString().split('T')[0];
  try {
    const patient_code = await generatePatientCode();
    const [result] = await db.query(
      'INSERT INTO Patients(patient_code,name,age,gender,phone,address,occupation,registration_date,created_by) VALUES(?,?,?,?,?,?,?,?,?)',
      [patient_code,name,age,gender,phone,address,occupation,registration_date,req.user.userId]
    );
    const patientId = result.insertId;
    await addTimelineEvent(patientId,'registration','Patient Registered',
      `Patient ${name} (${patient_code}) registered at Ayushi clinic.`,req.user.userId);
    res.status(201).json({ success:true, message:'Patient created', patientId, patient_code });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const updatePatient = async (req,res) => {
  const { name, age, gender, phone, address, occupation } = req.body;
  try {
    await db.query('UPDATE Patients SET name=?,age=?,gender=?,phone=?,address=?,occupation=? WHERE patient_id=?',
      [name,age,gender,phone,address,occupation,req.params.id]);
    res.json({ success:true, message:'Patient updated' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const deletePatient = async (req,res) => {
  try {
    await db.query('UPDATE Patients SET is_active=0 WHERE patient_id=?',[req.params.id]);
    res.json({ success:true, message:'Patient removed' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const searchPatients = async (req,res) => {
  const { q } = req.query;
  try {
    const [patients] = await db.query(
      'SELECT patient_id,patient_code,name,age,gender,phone FROM Patients WHERE is_active=1 AND (name LIKE ? OR patient_code LIKE ?) LIMIT 10',
      [`%${q}%`,`%${q}%`]
    );
    res.json({ success:true, patients });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// Doctor's OWN patient stats for the "My Dashboard"
const getMyPatientStats = async (req,res) => {
  const doctorId = req.user.userId;
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(DISTINCT t.patient_id) as my_patients,
        SUM(CASE WHEN t.status='Ongoing' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,
        SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END) as dropout,
        ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate
      FROM Treatments t WHERE t.doctor_id=?`,[doctorId]);

    const [recentPatients] = await db.query(`
      SELECT p.patient_id, p.patient_code, p.name, p.age, p.gender,
        t.treatment_id, t.status, t.improvement_percentage, d.disease_name, t.start_date
      FROM Treatments t
      JOIN Patients p ON t.patient_id=p.patient_id
      JOIN Diseases d ON t.disease_id=d.disease_id
      WHERE t.doctor_id=?
      ORDER BY t.created_at DESC LIMIT 10`,[doctorId]);

    const [upcomingFollowups] = await db.query(`
      SELECT f.followup_date, p.name as patient_name, p.patient_code, d.disease_name
      FROM Followups f
      JOIN Treatments t ON f.treatment_id=t.treatment_id
      JOIN Patients p ON t.patient_id=p.patient_id
      JOIN Diseases d ON t.disease_id=d.disease_id
      WHERE t.doctor_id=? AND f.followup_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 7 DAY)
      ORDER BY f.followup_date ASC LIMIT 8`,[doctorId]);

    const [myDiseases] = await db.query(`
      SELECT d.disease_name, COUNT(*) as count,
        ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate
      FROM Treatments t JOIN Diseases d ON t.disease_id=d.disease_id
      WHERE t.doctor_id=? GROUP BY d.disease_id ORDER BY count DESC LIMIT 6`,[doctorId]);

    res.json({ success:true, stats:stats[0], recentPatients, upcomingFollowups, myDiseases });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, searchPatients, getMyPatientStats };
