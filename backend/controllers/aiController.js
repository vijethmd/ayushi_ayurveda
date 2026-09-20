const db = require('../config/db');
const { addTimelineEvent } = require('../utils/timeline');
const { buildDiseaseEvidence, evidenceToMarkdown } = require('../utils/efficacyEngine');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Retry transient Gemini errors (503 overloaded, 429 rate-limit, 5xx) with backoff.
const withRetry = async (fn, attempts = 3) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      lastErr = err;
      const transient = /\b(429|500|502|503|504|overloaded|high demand|unavailable)\b/i.test(err.message || '');
      if (!transient || i === attempts - 1) throw err;
      await sleep(1200 * (i + 1)); // 1.2s, 2.4s
    }
  }
  throw lastErr;
};

const getGeminiResponse = (prompt) => withRetry(async () => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
});

// Ask Gemini for a strict JSON object. Robust to code fences / stray prose, retries transient errors.
const getGeminiJSON = (prompt) => withRetry(async () => {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 4096 },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    throw new Error('Model did not return valid JSON');
  }
});

const DISCLAIMER = '\n\n---\n⚠️ *AI-generated insights are for analytical and research purposes only and should not be considered medical advice.*';

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const formatCareItems = (value) => {
  const items = parseJsonArray(value);
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (item.name) return [item.name, item.dosage, item.frequency].filter(Boolean).join(' ');
    return item.recommendation || item.advice || item.notes || JSON.stringify(item);
  }).filter(Boolean).join('; ') || 'Not recorded';
};

// Clinical Insights
const generateClinicalInsights = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(DISTINCT p.patient_id) as total_patients,
        SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,
        SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END) as dropout,
        ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate,
        ROUND(SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as dropout_rate,
        ROUND(AVG(t.improvement_percentage),1) as avg_improvement,
        COUNT(DISTINCT f.followup_id) as total_followups
      FROM Patients p
      LEFT JOIN Treatments t ON p.patient_id = t.patient_id
      LEFT JOIN Followups f ON t.treatment_id = f.treatment_id
      WHERE p.is_active = 1
    `);

    const [topDiseases] = await db.query(`
      SELECT d.disease_name, d.category_name, COUNT(*) as count,
             ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate
      FROM Treatments t JOIN Diseases d ON t.disease_id = d.disease_id
      GROUP BY d.disease_id ORDER BY count DESC LIMIT 10
    `);

    const prompt = `You are an Ayurvedic clinical research analyst. Analyze the following clinic data and generate professional insights.

CLINIC STATISTICS:
- Total Patients: ${stats[0].total_patients}
- Overall Cure Rate: ${stats[0].cure_rate}%
- Dropout Rate: ${stats[0].dropout_rate}%
- Average Improvement: ${stats[0].avg_improvement}%
- Total Follow-ups Recorded: ${stats[0].total_followups}

TOP DISEASES TREATED:
${topDiseases.map(d => `- ${d.disease_name} (${d.category_name}): ${d.count} patients, ${d.cure_rate}% cure rate`).join('\n')}

Generate a comprehensive clinical insights report covering:
1. Overall clinic performance analysis
2. Disease category trends
3. Treatment success patterns
4. Dropout analysis and risk factors
5. Follow-up compliance observations
6. Research recommendations

Format as a professional markdown report with sections and bullet points.`;

    const reportText = await getGeminiResponse(prompt);

    const [result] = await db.query(
      'INSERT INTO AI_Reports (generated_by, report_type, report_title, report_text) VALUES (?,?,?,?)',
      [req.user.userId, 'clinical_insights', 'Clinical Insights Report - ' + new Date().toLocaleDateString(), reportText + DISCLAIMER]
    );

    await createNotification(req.user.userId, 'AI Report Generated', 'Clinical Insights report has been generated.', 'ai');

    res.json({ success: true, report: { report_id: result.insertId, report_text: reportText + DISCLAIMER } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
};

// Patient Summary
const generatePatientSummary = async (req, res) => {
  const { patientId } = req.params;
  try {
    const [patient] = await db.query('SELECT * FROM Patients WHERE patient_id = ?', [patientId]);
    if (patient.length === 0) return res.status(404).json({ success: false, message: 'Patient not found' });

    const [treatments] = await db.query(`
      SELECT t.*, d.disease_name, u.name as doctor_name, COUNT(f.followup_id) as followup_count,
             AVG(f.improvement_percentage) as avg_followup_improvement
      FROM Treatments t
      JOIN Diseases d ON t.disease_id = d.disease_id
      JOIN Users u ON t.doctor_id = u.user_id
      LEFT JOIN Followups f ON t.treatment_id = f.treatment_id
      WHERE t.patient_id = ?
      GROUP BY t.treatment_id
    `, [patientId]);

    const [timeline] = await db.query(
      'SELECT * FROM Timeline_Events WHERE patient_id = ? ORDER BY event_date ASC', [patientId]
    );

    const p = patient[0];
    const prompt = `You are an Ayurvedic clinical analyst. Generate a concise patient summary report.

PATIENT DETAILS:
- Name: ${p.name}, Age: ${p.age}, Gender: ${p.gender}
- Occupation: ${p.occupation || 'Not specified'}
- Registration Date: ${p.registration_date}

TREATMENT HISTORY:
${treatments.map(t => `- ${t.disease_name}: Status=${t.status}, Improvement=${t.improvement_percentage}%, Doctor=${t.doctor_name}, Follow-ups=${t.followup_count}`).join('\n')}

TIMELINE EVENTS (${timeline.length} total events):
${timeline.slice(-10).map(e => `- ${e.event_date}: ${e.event_title}`).join('\n')}

Generate a professional patient summary covering:
1. Patient Overview
2. Treatment Journey
3. Progress Analysis
4. Compliance Assessment
5. Key Observations
6. Follow-up Recommendations

Format as a structured markdown report.`;

    const reportText = await getGeminiResponse(prompt);

    await db.query(
      'INSERT INTO AI_Reports (generated_by, patient_id, report_type, report_title, report_text) VALUES (?,?,?,?,?)',
      [req.user.userId, patientId, 'patient_summary', `Patient Summary - ${p.name}`, reportText + DISCLAIMER]
    );

    await addTimelineEvent(patientId, 'ai_report', 'AI Report Generated',
      'AI-powered patient summary report generated.', req.user.userId);

    res.json({ success: true, report: { report_text: reportText + DISCLAIMER, patient: p } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
};

// Dropout Risk Analysis
const generateDropoutRisk = async (req, res) => {
  const { patientId } = req.params;
  try {
    const [patient] = await db.query('SELECT * FROM Patients WHERE patient_id = ?', [patientId]);
    const [treatment] = await db.query(`
      SELECT t.*, d.disease_name, 
             COUNT(f.followup_id) as followup_count,
             MAX(f.followup_date) as last_followup,
             DATEDIFF(CURDATE(), MAX(f.followup_date)) as days_since_followup
      FROM Treatments t
      LEFT JOIN Diseases d ON t.disease_id = d.disease_id
      LEFT JOIN Followups f ON t.treatment_id = f.treatment_id
      WHERE t.patient_id = ? AND t.status = 'Ongoing'
      GROUP BY t.treatment_id
      ORDER BY t.start_date DESC LIMIT 1
    `, [patientId]);

    if (treatment.length === 0) {
      return res.json({ success: true, risk: 'N/A', message: 'No active treatment found', report_text: 'Patient has no active ongoing treatment.' });
    }

    const t = treatment[0];
    const p = patient[0];
    const treatmentDays = Math.floor((new Date() - new Date(t.start_date)) / (1000 * 60 * 60 * 24));

    const prompt = `Analyze dropout risk for an Ayurvedic patient.

PATIENT: ${p.name}, Age ${p.age}, ${p.gender}
DISEASE: ${t.disease_name}
TREATMENT DURATION: ${treatmentDays} days
CURRENT IMPROVEMENT: ${t.improvement_percentage}%
FOLLOW-UP COUNT: ${t.followup_count}
DAYS SINCE LAST FOLLOW-UP: ${t.days_since_followup || 'No followup yet'}

Based on this data, provide:
1. Risk Level (Low/Medium/High)
2. Risk Factors Identified
3. Protective Factors
4. Specific Interventions to Prevent Dropout
5. Recommended Action Timeline

Be concise and actionable. Format with clear sections.`;

    const reportText = await getGeminiResponse(prompt);
    let riskLevel = 'Low';
    if (reportText.toLowerCase().includes('high risk')) riskLevel = 'High';
    else if (reportText.toLowerCase().includes('medium risk')) riskLevel = 'Medium';

    await db.query(
      'INSERT INTO AI_Reports (generated_by, patient_id, report_type, report_title, report_text) VALUES (?,?,?,?,?)',
      [req.user.userId, patientId, 'dropout_risk', `Dropout Risk - ${p.name}`, reportText + DISCLAIMER]
    );

    res.json({ success: true, risk: riskLevel, report: { report_text: reportText + DISCLAIMER } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
};

// Disease Intelligence AI
// Convert Gemini's structured interpretation into a markdown "AI Interpretation" section.
const interpretationToMarkdown = (ai) => {
  if (!ai || typeof ai !== 'object') return '';
  const md = ['## 🤖 AI Interpretation', ''];
  if (ai.headline) md.push(`**${ai.headline}**`, '');

  if (Array.isArray(ai.drug_verdicts) && ai.drug_verdicts.length) {
    md.push('### Drug Verdicts');
    md.push('| Drug | Verdict | Confidence | Rationale |');
    md.push('|---|---|---|---|');
    for (const d of ai.drug_verdicts) {
      md.push(`| ${d.drug || '—'} | ${d.verdict || '—'} | ${d.confidence || '—'} | ${(d.rationale || '').replace(/\|/g, '/')} |`);
    }
    md.push('');
  }
  if (ai.best_regimen) { md.push('### Best Regimen', ai.best_regimen, ''); }
  if (ai.lifestyle_diet_insight) { md.push('### Lifestyle & Diet', ai.lifestyle_diet_insight, ''); }
  if (ai.dropout_insight) { md.push('### Dropout', ai.dropout_insight, ''); }
  const list = (title, arr) => {
    if (Array.isArray(arr) && arr.length) { md.push(`### ${title}`); arr.forEach(i => md.push(`- ${i}`)); md.push(''); }
  };
  list('Likely Confounders', ai.confounders);
  list('Data Gaps', ai.data_gaps);
  list('What To Capture Next', ai.next_data_to_capture);
  return md.join('\n');
};

const generateDiseaseIntelligence = async (req, res) => {
  const { diseaseId } = req.params;
  const refresh = req.query.refresh === '1' || req.body?.refresh;
  try {
    // ── LAYER 1: deterministic evidence engine (correct numbers, no AI) ───────────
    const evidence = await buildDiseaseEvidence(diseaseId);
    if (!evidence) return res.status(404).json({ success: false, message: 'Disease not found' });

    const d = evidence.disease;
    const deterministicMd = evidenceToMarkdown(evidence);

    if (evidence.overview.total_treatments === 0) {
      const reportText = deterministicMd + '\n\n*No treatment records yet — nothing to interpret.*' + DISCLAIMER;
      return res.json({ success: true, report: { report_text: reportText, disease: d, evidence } });
    }

    // ── CACHE: reuse the last saved report unless an explicit refresh was asked ────
    // Saves Gemini quota — only brand-new diseases or "Regenerate" hit the API.
    if (!refresh) {
      const [cached] = await db.query(
        "SELECT report_id, report_text, generated_at FROM AI_Reports WHERE disease_id=? AND report_type='disease_intelligence' ORDER BY generated_at DESC LIMIT 1",
        [diseaseId]
      );
      if (cached.length) {
        return res.json({ success: true, cached: true, generated_at: cached[0].generated_at,
          report: { report_text: cached[0].report_text, disease: d, evidence } });
      }
    }

    // ── LAYER 2: Gemini interprets the evidence packet (never computes numbers) ────
    const prompt = `You are an Ayurvedic clinical research analyst. You are given a PRE-COMPUTED evidence packet (JSON) of real clinic data for one disease. The numbers are already correct — DO NOT recompute, invent, or alter any figures. Interpret only what the data supports, and respect each item's confidence tier (Insufficient/Low/Moderate/High): never call an "Insufficient" or "Low" finding conclusive.

Pay special attention to "cohort_lift" for each drug (cure rate with the drug minus without it, same disease) — this is the strongest efficacy signal. A high raw cure rate on n=1 is NOT evidence.

Outcomes here are CATEGORICAL (Cured / Improved / Ongoing / Left Treatment). There is deliberately NO "improvement percentage" metric — a self-reported percentage is subjective and not measurable in Ayurveda. Judge efficacy ONLY by cure rate, cohort lift, time-to-cure (days), and dropout. Do not invent or ask for a percentage-improvement figure.

Each drug also has "response_notes" (and there is a disease-level "response_samples") — doctor-recorded QUALITATIVE narratives of how patients responded (e.g. "good initial response, but efficacy reduced over weeks; patient discontinued"). USE these narratives to refine each drug verdict: a drug with a strong cohort lift but narratives describing waning response or side effects deserves a tempered verdict; consistent "sustained response" narratives strengthen a positive verdict. Quote or paraphrase the response pattern in your rationale where relevant.

EVIDENCE PACKET:
${JSON.stringify(evidence, null, 2)}

Return ONLY a JSON object with EXACTLY these keys:
{
  "headline": "one-sentence overall takeaway for ${d.name}",
  "drug_verdicts": [{ "drug": "name", "verdict": "Promising|Inconclusive|Underperforming|Insufficient evidence", "confidence": "High|Moderate|Low|Insufficient", "rationale": "1 sentence grounded in lift/sample size" }],
  "best_regimen": "which combination looks best and the caveat, or null if data too thin",
  "lifestyle_diet_insight": "what the lifestyle/diet signal suggests (or that it cannot be assessed)",
  "dropout_insight": "interpretation of the dropout numbers",
  "confounders": ["reasons these numbers might mislead — co-prescription, small n, no control, etc."],
  "data_gaps": ["specific missing data that weakens conclusions"],
  "next_data_to_capture": ["concrete fields/measurements to start recording"]
}
Limit drug_verdicts to the most-evidenced 6 drugs. Be concise and honest about uncertainty.`;

    let aiInterpretation = null;
    let interpretationMd = '';
    try {
      aiInterpretation = await getGeminiJSON(prompt);
      interpretationMd = interpretationToMarkdown(aiInterpretation);
    } catch (aiErr) {
      interpretationMd = `## 🤖 AI Interpretation\n\n*AI interpretation unavailable: ${aiErr.message}. The deterministic evidence above is still valid.*`;
    }

    const reportText = `${deterministicMd}\n\n---\n\n${interpretationMd}${DISCLAIMER}`;

    await db.query(
      'INSERT INTO AI_Reports (generated_by, disease_id, report_type, report_title, report_text) VALUES (?,?,?,?,?)',
      [req.user.userId, diseaseId, 'disease_intelligence', `Disease Intelligence: ${d.name}`, reportText]
    );

    res.json({ success: true, report: { report_text: reportText, disease: d, evidence, interpretation: aiInterpretation } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
};

// Doctor Performance Insights
const generateDoctorInsights = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const [doctor] = await db.query("SELECT * FROM Users WHERE user_id = ? AND role = 'doctor'", [doctorId]);
    if (doctor.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const [perf] = await db.query(`
      SELECT COUNT(*) as total, 
             SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END) as cured,
             SUM(CASE WHEN status='Left Treatment' THEN 1 ELSE 0 END) as dropout,
             ROUND(SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate,
             ROUND(AVG(improvement_percentage),1) as avg_improvement
      FROM Treatments WHERE doctor_id = ?
    `, [doctorId]);

    const [topDiseases] = await db.query(`
      SELECT d.disease_name, COUNT(*) as count,
             ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate
      FROM Treatments t JOIN Diseases d ON t.disease_id = d.disease_id
      WHERE t.doctor_id = ? GROUP BY d.disease_id ORDER BY count DESC LIMIT 5
    `, [doctorId]);

    const doc = doctor[0]; const p = perf[0];
    const prompt = `Generate a doctor performance insights report for an Ayurvedic practitioner.

DOCTOR: ${doc.name}
QUALIFICATION: ${doc.qualification}
SPECIALIZATION: ${doc.specialization}
EXPERIENCE: ${doc.experience_years} years

PERFORMANCE DATA:
- Total Treatments: ${p.total}
- Cure Rate: ${p.cure_rate}%
- Dropout Rate: ${Math.round((p.dropout/p.total)*100)}%
- Avg Patient Improvement: ${p.avg_improvement}%

TOP DISEASES TREATED:
${topDiseases.map(d => `- ${d.disease_name}: ${d.count} patients, ${d.cure_rate}% cure rate`).join('\n')}

Generate professional performance insights covering:
1. Overall Performance Assessment
2. Strengths Identified
3. Areas for Improvement
4. Disease-specific Performance
5. Comparison Benchmarks
6. Professional Development Recommendations

Keep it constructive and data-driven.`;

    const reportText = await getGeminiResponse(prompt);

    await db.query(
      'INSERT INTO AI_Reports (generated_by, report_type, report_title, report_text) VALUES (?,?,?,?)',
      [req.user.userId, 'doctor_performance', `Doctor Performance: ${doc.name}`, reportText + DISCLAIMER]
    );

    res.json({ success: true, report: { report_text: reportText + DISCLAIMER, doctor: doc, performance: p } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI generation failed: ' + err.message });
  }
};

const getAIReports = async (req, res) => {
  const { patient_id, disease_id, drug_id, report_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let where = [];
    let params = [];
    if (patient_id) { where.push('r.patient_id = ?'); params.push(patient_id); }
    if (disease_id) { where.push('r.disease_id = ?'); params.push(disease_id); }
    if (drug_id) { where.push('r.drug_id = ?'); params.push(drug_id); }
    if (report_type) { where.push('r.report_type = ?'); params.push(report_type); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [reports] = await db.query(`
      SELECT r.*, u.name as generated_by_name, p.name as patient_name, d.disease_name, dr.name as drug_name
      FROM AI_Reports r
      LEFT JOIN Users u ON r.generated_by = u.user_id
      LEFT JOIN Patients p ON r.patient_id = p.patient_id
      LEFT JOIN Diseases d ON r.disease_id = d.disease_id
      LEFT JOIN Drugs dr ON r.drug_id = dr.drug_id
      ${whereClause}
      ORDER BY r.generated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countRows] = await db.query(`SELECT COUNT(*) as total FROM AI_Reports r ${whereClause}`, params);
    res.json({ success: true, reports, total: countRows[0].total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await db.query(
      'INSERT INTO Notifications (user_id, title, message, type) VALUES (?,?,?,?)',
      [userId, title, message, type]
    );
  } catch (e) { /* silent */ }
};

module.exports = {
  generateClinicalInsights, generatePatientSummary, generateDropoutRisk,
  generateDiseaseIntelligence, generateDoctorInsights, getAIReports
};
