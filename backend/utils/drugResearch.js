/**
 * Drug Research data — derived from Treatments.medicines_json.
 * The Drug_Administrations / Drug_Outcomes tables are empty in this dataset, so all
 * usage and efficacy is computed from the treatment plans (medicines_json) instead.
 * "Efficacy" here means status-based CURE RATE (no subjective percentage).
 */
const db = require('../config/db');

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

const parseMeds = (v) => {
  if (!v) return [];
  try {
    const p = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(p) ? p.filter(Boolean).map(m => (typeof m === 'string' ? { name: m } : m)) : [];
  } catch { return []; }
};

// Load every treatment once, with patient/disease/doctor context + parsed medicines.
async function loadTreatments() {
  const [rows] = await db.query(`
    SELECT t.treatment_id, t.patient_id, t.disease_id, t.status, t.start_date, t.end_date,
           t.medicines_json,
           p.name AS patient_name, p.patient_code, p.age,
           d.disease_name, u.name AS doctor_name,
           DATEDIFF(COALESCE(t.end_date, CURDATE()), t.start_date) AS duration_days
    FROM Treatments t
    JOIN Patients p ON t.patient_id = p.patient_id
    JOIN Diseases d ON t.disease_id = d.disease_id
    JOIN Users u ON t.doctor_id = u.user_id
  `);
  return rows.map(r => ({ ...r, meds: parseMeds(r.medicines_json) }));
}

const usesDrug = (t, nameLc) => t.meds.some(m => (m.name || '').trim().toLowerCase() === nameLc);
const medItem = (t, nameLc) => t.meds.find(m => (m.name || '').trim().toLowerCase() === nameLc) || {};

// List of catalog drugs enriched with usage/cure-rate from medicines_json.
async function listDrugUsage({ search = '', category = '' } = {}) {
  const where = ['is_active = 1'];
  const params = [];
  if (search) { where.push('(name LIKE ? OR traditional_use LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (category) { where.push('category = ?'); params.push(category); }
  const [drugs] = await db.query(`SELECT * FROM Drugs WHERE ${where.join(' AND ')} ORDER BY name`, params);

  const treatments = await loadTreatments();

  const enriched = drugs.map(drug => {
    const lc = drug.name.trim().toLowerCase();
    const using = treatments.filter(t => usesDrug(t, lc));
    const cured = using.filter(t => t.status === 'Cured').length;
    return {
      ...drug,
      times_prescribed: using.length,
      treatments_used: new Set(using.map(t => t.patient_id)).size,
      diseases_count: new Set(using.map(t => t.disease_id)).size,
      avg_efficacy: using.length ? pct(cured, using.length) : 0, // = cure rate
    };
  });

  // Most-used first so the page leads with drugs that actually have data
  enriched.sort((a, b) => b.times_prescribed - a.times_prescribed || a.name.localeCompare(b.name));
  return enriched;
}

// Full detail for one drug.
async function drugDetail(drugId) {
  const [[drug]] = await db.query('SELECT * FROM Drugs WHERE drug_id = ?', [drugId]);
  if (!drug) return null;
  const lc = drug.name.trim().toLowerCase();

  const treatments = await loadTreatments();
  const using = treatments.filter(t => usesDrug(t, lc));
  const cured = using.filter(t => t.status === 'Cured').length;
  const curedDays = using.filter(t => t.status === 'Cured').map(t => t.duration_days).filter(x => x > 0);

  const enrichedDrug = {
    ...drug,
    times_prescribed: using.length,
    patients_treated: new Set(using.map(t => t.patient_id)).size,
    avg_efficacy: using.length ? pct(cured, using.length) : null, // cure rate
    avg_days_to_cure: curedDays.length ? Math.round(curedDays.reduce((a, b) => a + b, 0) / curedDays.length) : null,
  };

  // Per-disease breakdown
  const byDisease = new Map();
  for (const t of using) {
    if (!byDisease.has(t.disease_name)) byDisease.set(t.disease_name, { disease_name: t.disease_name, list: [] });
    byDisease.get(t.disease_name).list.push(t);
  }
  const diseaseBreakdown = [...byDisease.values()].map(d => ({
    disease_name: d.disease_name,
    prescriptions: d.list.length,
    cured: d.list.filter(t => t.status === 'Cured').length,
    avg_efficacy: pct(d.list.filter(t => t.status === 'Cured').length, d.list.length),
  })).sort((a, b) => b.prescriptions - a.prescriptions);

  // Administration rows (from the plan)
  const administrations = using
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
    .slice(0, 80)
    .map(t => {
      const m = medItem(t, lc);
      return {
        patient_name: t.patient_name, patient_code: t.patient_code, age: t.age,
        disease_name: t.disease_name, doctor_name: t.doctor_name,
        dosage: m.dosage || null, frequency: m.frequency || null,
        treatment_status: t.status,
        efficacy_score: null, outcome_se: null,
      };
    });

  // Monthly cure-rate trend (repurposes the efficacy-trend chart)
  const byMonth = new Map();
  for (const t of using) {
    if (!t.start_date) continue;
    const month = String(t.start_date).slice(0, 7);
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(t);
  }
  const outcomesTrend = [...byMonth.entries()]
    .map(([month, list]) => ({ month, avg_efficacy: pct(list.filter(t => t.status === 'Cured').length, list.length) }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  return { drug: enrichedDrug, diseaseBreakdown, administrations, outcomesTrend };
}

// Analytics for the Drug Research "Analytics" tab (all from medicines_json; efficacy = cure rate).
async function drugAnalytics() {
  const [catalog] = await db.query('SELECT drug_id, name, category FROM Drugs WHERE is_active = 1');
  const treatments = await loadTreatments();

  const topEfficacy = [], mostPrescribed = [], drugDisease = [];
  const catAgg = new Map();
  let totalPrescriptions = 0;

  for (const drug of catalog) {
    const lc = drug.name.trim().toLowerCase();
    const using = treatments.filter(t => usesDrug(t, lc));
    if (!using.length) continue;
    const cured = using.filter(t => t.status === 'Cured').length;
    const cureRate = pct(cured, using.length);
    totalPrescriptions += using.length;

    topEfficacy.push({ name: drug.name, avg_efficacy: cureRate, prescriptions: using.length });
    mostPrescribed.push({ name: drug.name, prescriptions: using.length });

    if (!catAgg.has(drug.category)) catAgg.set(drug.category, { category: drug.category, prescriptions: 0, cured: 0, drugs: new Set() });
    const ca = catAgg.get(drug.category);
    ca.prescriptions += using.length; ca.cured += cured; ca.drugs.add(drug.drug_id);

    // per-disease for this drug
    const byDisease = new Map();
    for (const t of using) {
      if (!byDisease.has(t.disease_name)) byDisease.set(t.disease_name, []);
      byDisease.get(t.disease_name).push(t);
    }
    for (const [disease_name, list] of byDisease) {
      drugDisease.push({
        drug_name: drug.name, disease_name,
        prescriptions: list.length,
        avg_efficacy: pct(list.filter(t => t.status === 'Cured').length, list.length),
        cured_cases: list.filter(t => t.status === 'Cured').length,
      });
    }
  }

  topEfficacy.sort((a, b) => b.avg_efficacy - a.avg_efficacy || b.prescriptions - a.prescriptions);
  mostPrescribed.sort((a, b) => b.prescriptions - a.prescriptions);
  drugDisease.sort((a, b) => b.avg_efficacy - a.avg_efficacy || b.prescriptions - a.prescriptions);

  const byCategory = [...catAgg.values()].map(c => ({
    category: c.category, prescriptions: c.prescriptions,
    avg_efficacy: pct(c.cured, c.prescriptions), drug_count: c.drugs.size,
  })).sort((a, b) => b.avg_efficacy - a.avg_efficacy);

  const overall = {
    total_drugs: catalog.length,
    total_prescriptions: totalPrescriptions,
    outcomes_recorded: totalPrescriptions, // cure-rate is derived from every treatment's status
    overall_avg_efficacy: pct(treatments.filter(t => t.status === 'Cured').length, treatments.length),
    treatments_with_drugs: treatments.filter(t => t.meds.length).length,
  };

  return {
    topEfficacy: topEfficacy.slice(0, 10),
    mostPrescribed: mostPrescribed.slice(0, 10),
    byCategory,
    drugDisease: drugDisease.slice(0, 20),
    sideEffects: [],
    overall,
  };
}

// Data packet for the per-drug AI report (includes qualitative response narratives).
async function drugAIData(drugId) {
  const detail = await drugDetail(drugId);
  if (!detail) return null;
  const lc = detail.drug.name.trim().toLowerCase();

  const [responses] = await db.query(
    `SELECT event_description FROM Timeline_Events
     WHERE event_type = 'drug_response' AND LOWER(event_description) LIKE ? LIMIT 12`,
    [`%${lc}%`]
  );

  return {
    drug: detail.drug,
    diseaseBreakdown: detail.diseaseBreakdown,
    response_notes: responses.map(r => r.event_description),
  };
}

module.exports = { listDrugUsage, drugDetail, drugAnalytics, drugAIData };
