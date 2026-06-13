const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    const [patientStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT p.patient_id) as total_patients,
        SUM(CASE WHEN t.status = 'Ongoing' THEN 1 ELSE 0 END) as active_patients,
        SUM(CASE WHEN t.status = 'Cured' THEN 1 ELSE 0 END) as cured_patients,
        SUM(CASE WHEN t.status = 'Left Treatment' THEN 1 ELSE 0 END) as left_patients
      FROM Patients p
      LEFT JOIN Treatments t ON p.patient_id = t.patient_id
      WHERE p.is_active = 1
    `);

    const [doctorCount] = await db.query(`SELECT COUNT(*) as total_doctors FROM Users WHERE role='doctor' AND is_active=1`);
    const [diseaseCount] = await db.query(`SELECT COUNT(*) as total_diseases FROM Diseases WHERE is_active=1`);

    const [statusDist] = await db.query(`
      SELECT status, COUNT(*) as count FROM Treatments GROUP BY status
    `);

    const [diseaseDist] = await db.query(`
      SELECT d.disease_name, d.category_name, COUNT(t.treatment_id) as count
      FROM Diseases d
      JOIN Treatments t ON d.disease_id = t.disease_id
      GROUP BY d.disease_id ORDER BY count DESC LIMIT 10
    `);

    const [monthlyReg] = await db.query(`
      SELECT DATE_FORMAT(registration_date, '%Y-%m') as month, COUNT(*) as count
      FROM Patients WHERE is_active = 1
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    const [recoveryTrend] = await db.query(`
      SELECT DATE_FORMAT(end_date, '%Y-%m') as month, COUNT(*) as cured
      FROM Treatments WHERE status = 'Cured' AND end_date IS NOT NULL
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    const [topDoctors] = await db.query(`
      SELECT u.name, u.specialization,
             COUNT(t.treatment_id) as treatments,
             SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,
             ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate
      FROM Users u
      JOIN Treatments t ON u.user_id = t.doctor_id
      WHERE u.role = 'doctor'
      GROUP BY u.user_id ORDER BY cure_rate DESC LIMIT 5
    `);

    const [upcomingFollowups] = await db.query(`
      SELECT f.followup_date, p.name as patient_name, p.patient_code, d.disease_name, u.name as doctor_name
      FROM Followups f
      JOIN Treatments t ON f.treatment_id = t.treatment_id
      JOIN Patients p ON t.patient_id = p.patient_id
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      WHERE f.followup_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY f.followup_date ASC LIMIT 10
    `);

    const [recentActivity] = await db.query(`
      SELECT te.*, p.name as patient_name, p.patient_code
      FROM Timeline_Events te
      JOIN Patients p ON te.patient_id = p.patient_id
      ORDER BY te.event_date DESC LIMIT 15
    `);

    res.json({
      success: true,
      stats: {
        ...patientStats[0],
        total_doctors: doctorCount[0].total_doctors,
        total_diseases: diseaseCount[0].total_diseases,
      },
      charts: {
        statusDistribution: statusDist,
        diseaseDistribution: diseaseDist,
        monthlyRegistrations: monthlyReg.reverse(),
        recoveryTrend: recoveryTrend.reverse(),
        topDoctors,
      },
      upcomingFollowups,
      recentActivity,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const [categoryStats] = await db.query(`
      SELECT d.category_name,
             COUNT(t.treatment_id) as total,
             SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,
             SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END) as dropout,
             ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate
      FROM Diseases d
      JOIN Treatments t ON d.disease_id = t.disease_id
      GROUP BY d.category_name ORDER BY total DESC
    `);

    const [ageGroup] = await db.query(`
      SELECT
        CASE
          WHEN p.age < 18 THEN 'Under 18'
          WHEN p.age BETWEEN 18 AND 30 THEN '18-30'
          WHEN p.age BETWEEN 31 AND 45 THEN '31-45'
          WHEN p.age BETWEEN 46 AND 60 THEN '46-60'
          ELSE 'Above 60'
        END as age_group,
        COUNT(*) as count
      FROM Patients p WHERE p.is_active = 1 GROUP BY age_group ORDER BY count DESC
    `);

    const [genderDist] = await db.query(`
      SELECT gender, COUNT(*) as count FROM Patients WHERE is_active=1 GROUP BY gender
    `);

    const [yearlyGrowth] = await db.query(`
      SELECT YEAR(registration_date) as year, COUNT(*) as patients,
             SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured
      FROM Patients p LEFT JOIN Treatments t ON p.patient_id = t.patient_id
      WHERE p.is_active=1 GROUP BY year ORDER BY year
    `);

    const [dropoutAnalysis] = await db.query(`
      SELECT 
        FLOOR(DATEDIFF(end_date, start_date)/30) as month_number,
        COUNT(*) as dropouts
      FROM Treatments WHERE status='Left Treatment' AND end_date IS NOT NULL
      GROUP BY month_number ORDER BY month_number
    `);

    res.json({ success: true, categoryStats, ageGroup, genderDist, yearlyGrowth, dropoutAnalysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getAnalytics };
