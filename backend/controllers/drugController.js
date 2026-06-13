const db = require('../config/db');
const { addTimelineEvent } = require('../utils/timeline');

// ── DRUGS MASTER ─────────────────────────────────────────────────────────────
const getAllDrugs = async (req, res) => {
  const { search, category } = req.query;
  try {
    let where = ['d.is_active = 1'];
    let params = [];
    if (search) { where.push('(d.name LIKE ? OR d.category LIKE ? OR d.traditional_use LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (category) { where.push('d.category = ?'); params.push(category); }
    const [drugs] = await db.query(`SELECT d.*,
      COUNT(DISTINCT da.admin_id) as times_prescribed,
      COUNT(DISTINCT da.treatment_id) as treatments_used,
      ROUND(AVG(do2.efficacy_score),1) as avg_efficacy
      FROM Drugs d
      LEFT JOIN Drug_Administrations da ON d.drug_id = da.drug_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id = do2.admin_id
      WHERE ${where.join(' AND ')}
      GROUP BY d.drug_id ORDER BY times_prescribed DESC, d.name`, params);
    res.json({ success:true, drugs });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const getDrugById = async (req,res) => {
  try {
    const [drugs] = await db.query(`SELECT d.*,
      COUNT(DISTINCT da.admin_id) as times_prescribed,
      COUNT(DISTINCT da.treatment_id) as treatments_used,
      COUNT(DISTINCT t.patient_id) as patients_treated,
      ROUND(AVG(do2.efficacy_score),1) as avg_efficacy,
      MIN(do2.efficacy_score) as min_efficacy,
      MAX(do2.efficacy_score) as max_efficacy
      FROM Drugs d
      LEFT JOIN Drug_Administrations da ON d.drug_id=da.drug_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      LEFT JOIN Treatments t ON da.treatment_id=t.treatment_id
      WHERE d.drug_id=?
      GROUP BY d.drug_id`, [req.params.id]);
    if (!drugs.length) return res.status(404).json({ success:false, message:'Drug not found' });

    // Disease breakdown
    const [diseaseBreakdown] = await db.query(`
      SELECT dis.disease_name, dis.category_name,
        COUNT(DISTINCT da.admin_id) as prescriptions,
        ROUND(AVG(do2.efficacy_score),1) as avg_efficacy,
        SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,
        COUNT(DISTINCT t.treatment_id) as total_treatments
      FROM Drug_Administrations da
      JOIN Treatments t ON da.treatment_id=t.treatment_id
      JOIN Diseases dis ON t.disease_id=dis.disease_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      WHERE da.drug_id=?
      GROUP BY dis.disease_id ORDER BY prescriptions DESC`, [req.params.id]);

    // Outcomes over time
    const [outcomesTrend] = await db.query(`
      SELECT DATE_FORMAT(do2.assessment_date,'%Y-%m') as month,
        ROUND(AVG(do2.efficacy_score),1) as avg_efficacy,
        COUNT(*) as assessments
      FROM Drug_Outcomes do2
      JOIN Drug_Administrations da ON do2.admin_id=da.admin_id
      WHERE da.drug_id=?
      GROUP BY month ORDER BY month DESC LIMIT 12`, [req.params.id]);

    // Side effects summary
    const [sideEffects] = await db.query(`
      SELECT do2.side_effects, COUNT(*) as frequency
      FROM Drug_Outcomes do2
      JOIN Drug_Administrations da ON do2.admin_id=da.admin_id
      WHERE da.drug_id=? AND do2.side_effects IS NOT NULL AND do2.side_effects != ''
      GROUP BY do2.side_effects ORDER BY frequency DESC LIMIT 10`, [req.params.id]);

    // Recent administrations
    const [administrations] = await db.query(`
      SELECT da.*, p.name as patient_name, p.patient_code, p.age, p.gender,
        dis.disease_name, u.name as doctor_name, t.status as treatment_status,
        do2.efficacy_score, do2.side_effects as outcome_side_effects
      FROM Drug_Administrations da
      JOIN Treatments t ON da.treatment_id=t.treatment_id
      JOIN Patients p ON t.patient_id=p.patient_id
      JOIN Diseases dis ON t.disease_id=dis.disease_id
      JOIN Users u ON t.doctor_id=u.user_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      WHERE da.drug_id=?
      ORDER BY da.created_at DESC LIMIT 50`, [req.params.id]);

    res.json({ success:true, drug:drugs[0], diseaseBreakdown, outcomesTrend:[...outcomesTrend].reverse(), sideEffects, administrations });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const createDrug = async (req,res) => {
  const { name, category, description, traditional_use } = req.body;
  try {
    const [r] = await db.query('INSERT INTO Drugs(name,category,description,traditional_use) VALUES(?,?,?,?)',[name,category,description,traditional_use]);
    res.status(201).json({ success:true, drugId:r.insertId });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const updateDrug = async (req,res) => {
  const { name, category, description, traditional_use } = req.body;
  try {
    await db.query('UPDATE Drugs SET name=?,category=?,description=?,traditional_use=? WHERE drug_id=?',[name,category,description,traditional_use,req.params.id]);
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── DRUG ADMINISTRATIONS ─────────────────────────────────────────────────────
const getAdminsByTreatment = async (req,res) => {
  try {
    const [rows] = await db.query(`
      SELECT da.*, d.name as drug_name, d.category,
        do2.efficacy_score, do2.side_effects as outcome_se, do2.assessment_date
      FROM Drug_Administrations da
      JOIN Drugs d ON da.drug_id=d.drug_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      WHERE da.treatment_id=?
      ORDER BY da.created_at DESC`, [req.params.treatmentId]);
    res.json({ success:true, administrations:rows });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const addDrugAdmin = async (req,res) => {
  const { treatment_id, drug_id, dosage, frequency, duration_days, start_date, end_date, route, notes } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO Drug_Administrations(treatment_id,drug_id,dosage,frequency,duration_days,start_date,end_date,route,notes) VALUES(?,?,?,?,?,?,?,?,?)',
      [treatment_id,drug_id,dosage,frequency,duration_days||null,start_date||null,end_date||null,route||'Oral',notes||null]
    );
    const [details] = await db.query(`
      SELECT t.patient_id, dis.disease_name, d.name as drug_name
      FROM Treatments t
      JOIN Diseases dis ON t.disease_id=dis.disease_id
      JOIN Drugs d ON d.drug_id=?
      WHERE t.treatment_id=?
      LIMIT 1
    `, [drug_id, treatment_id]);
    if (details.length) {
      const detail = details[0];
      await addTimelineEvent(
        detail.patient_id,
        'medicine_updated',
        'Drug Prescribed',
        `${detail.drug_name} prescribed for ${detail.disease_name}${dosage ? `, dosage ${dosage}` : ''}${frequency ? `, ${frequency}` : ''}.`,
        req.user?.userId || null
      );
    }
    res.status(201).json({ success:true, adminId:r.insertId });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

const updateDrugAdmin = async (req,res) => {
  const { dosage,frequency,duration_days,end_date,notes } = req.body;
  try {
    await db.query('UPDATE Drug_Administrations SET dosage=?,frequency=?,duration_days=?,end_date=?,notes=? WHERE admin_id=?',
      [dosage,frequency,duration_days,end_date,notes,req.params.id]);
    res.json({ success:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── DRUG OUTCOMES ─────────────────────────────────────────────────────────────
const addOutcome = async (req,res) => {
  const { admin_id, assessment_date, efficacy_score, side_effects, patient_feedback, doctor_notes } = req.body;
  try {
    const [r] = await db.query(
      'INSERT INTO Drug_Outcomes(admin_id,assessment_date,efficacy_score,side_effects,patient_feedback,doctor_notes) VALUES(?,?,?,?,?,?)',
      [admin_id,assessment_date,efficacy_score,side_effects||null,patient_feedback||null,doctor_notes||null]
    );
    const [details] = await db.query(`
      SELECT t.patient_id, dis.disease_name, d.name as drug_name
      FROM Drug_Administrations da
      JOIN Drugs d ON da.drug_id=d.drug_id
      JOIN Treatments t ON da.treatment_id=t.treatment_id
      JOIN Diseases dis ON t.disease_id=dis.disease_id
      WHERE da.admin_id=?
      LIMIT 1
    `, [admin_id]);
    if (details.length) {
      const detail = details[0];
      await addTimelineEvent(
        detail.patient_id,
        'medicine_updated',
        'Drug Efficacy Recorded',
        `${detail.drug_name} outcome for ${detail.disease_name}: ${efficacy_score}% efficacy${side_effects ? `, side effects: ${side_effects}` : ''}.`,
        req.user?.userId || null
      );
    }
    res.status(201).json({ success:true, outcomeId:r.insertId });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── DRUG ANALYTICS ────────────────────────────────────────────────────────────
const getDrugAnalytics = async (req,res) => {
  try {
    // Derived from medicines_json (Drug_Administrations is empty). Efficacy = cure rate.
    const { drugAnalytics } = require('../utils/drugResearch');
    const data = await drugAnalytics();
    res.json({ success:true, ...data });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

// ── AI DRUG INTELLIGENCE ──────────────────────────────────────────────────────
const generateDrugAI = async (req,res) => {
  const { drugId } = req.params;
  const refresh = req.query.refresh === '1' || req.body?.refresh;
  try {
    // Cache: reuse last saved report unless refresh requested (saves Gemini quota)
    if (!refresh) {
      const [cached] = await db.query(
        "SELECT report_text, generated_at FROM AI_Reports WHERE drug_id=? AND report_type='drug_research' ORDER BY generated_at DESC LIMIT 1",
        [drugId]
      );
      if (cached.length) {
        const [[drug]] = await db.query('SELECT * FROM Drugs WHERE drug_id=?', [drugId]);
        return res.json({ success:true, cached:true, generated_at: cached[0].generated_at, report:{ report_text:cached[0].report_text, drug } });
      }
    }
    const { drugAIData } = require('../utils/drugResearch');
    const { getGeminiResponse } = require('../utils/gemini');
    const data = await drugAIData(drugId);
    if (!data) return res.status(404).json({ success:false, message:'Drug not found' });
    const { drug, diseaseBreakdown, response_notes } = data;

    const prompt = `You are an Ayurvedic clinical research analyst. Analyze this drug's REAL clinic data and generate a research report.

DRUG: ${drug.name}
CATEGORY: ${drug.category}
TRADITIONAL USE: ${drug.traditional_use || 'n/a'}
DESCRIPTION: ${drug.description || 'n/a'}

CLINICAL DATA (from treatment records — efficacy is the status-based CURE RATE, NOT a subjective percentage):
- Times Prescribed: ${drug.times_prescribed}
- Patients Treated: ${drug.patients_treated}
- Cure Rate: ${drug.avg_efficacy == null ? 'n/a' : drug.avg_efficacy + '%'}
- Avg Days to Cure: ${drug.avg_days_to_cure == null ? 'n/a' : drug.avg_days_to_cure}

DISEASE-WISE PERFORMANCE:
${diseaseBreakdown.length ? diseaseBreakdown.map(d=>`- ${d.disease_name}: ${d.prescriptions} cases, ${d.avg_efficacy}% cure rate, ${d.cured} cured`).join('\n') : '- No disease data.'}

QUALITATIVE RESPONSE NOTES (doctor-recorded narratives — use these to judge how the drug actually performed, e.g. waning response, side effects, sustained benefit):
${response_notes.length ? response_notes.map(n=>`- ${n}`).join('\n') : '- None recorded.'}

Judge efficacy by cure rate, days-to-cure, and the qualitative response narratives. Respect sample size — a high cure rate on very few patients is weak evidence; say so. Do NOT invent a percentage-improvement metric.

Generate a markdown report covering:
1. **Drug Overview**
2. **Cure-Rate & Time-to-Cure Analysis** (with sample-size caveats)
3. **Disease-wise Performance** — which conditions respond best
4. **Response Pattern Insights** — synthesize the qualitative notes (initial vs sustained response, side effects, dropout)
5. **Research Recommendations** — what to capture next

End with: This is AI-generated analysis for research purposes only. Not medical advice.`;

    const reportText = await getGeminiResponse(prompt);

    await db.query(
      'INSERT INTO AI_Reports(generated_by,drug_id,report_type,report_title,report_text) VALUES(?,?,?,?,?)',
      [req.user.userId,drugId,'drug_research',`Drug Research: ${drug.name}`,reportText]
    );

    res.json({ success:true, report:{ report_text:reportText, drug } });
  } catch(err) {
    console.error('Drug AI error:', err.message);
    const quota = /\b429\b|quota|rate.?limit|exceeded/i.test(err.message || '');
    const message = quota
      ? 'AI is temporarily unavailable — the Gemini free-tier daily limit (20 reports/day) has been reached. Please try again later or add a billed API key. (The cure-rate and usage data above is computed locally and remains accurate.)'
      : 'AI generation failed: ' + err.message;
    res.status(quota ? 429 : 500).json({ success:false, message });
  }
};

const getDrugCategories = async (req,res) => {
  try {
    const [cats] = await db.query('SELECT DISTINCT category, COUNT(*) as count FROM Drugs WHERE is_active=1 GROUP BY category ORDER BY count DESC');
    res.json({ success:true, categories:cats });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
};

module.exports = {
  getAllDrugs, getDrugById, createDrug, updateDrug, getDrugCategories,
  getAdminsByTreatment, addDrugAdmin, updateDrugAdmin,
  addOutcome, getDrugAnalytics, generateDrugAI
};
