/**
 * Deterministic Efficacy Engine
 * --------------------------------
 * Layer 1 of the two-layer AI strategy. Computes a structured, *correct* evidence
 * packet for a disease — drug efficacy with cohort lift, confidence tiers, regimens,
 * lifestyle/diet signals, cohort breakdowns and data-quality gaps.
 *
 * No AI here. These numbers are rendered directly in the UI and also fed to Gemini
 * (Layer 2) which only interprets them — it never invents figures.
 */
const db = require('../config/db');

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);
const round1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

// Sample-size driven confidence so small cohorts aren't over-trusted.
const confidenceTier = (n) => {
  if (n >= 30) return 'High';
  if (n >= 15) return 'Moderate';
  if (n >= 5) return 'Low';
  return 'Insufficient';
};

// medicines_json / lifestyle_json / diet_json may arrive parsed (JSON column) or as string.
const asArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

async function buildDiseaseEvidence(diseaseId) {
  const [[disease]] = await db.query('SELECT * FROM Diseases WHERE disease_id = ?', [diseaseId]);
  if (!disease) return null;

  // All treatments for this disease
  const [treatments] = await db.query(`
    SELECT t.treatment_id, t.patient_id, t.status, t.improvement_percentage,
           t.start_date, t.end_date, t.medicines_json, t.lifestyle_json, t.diet_json,
           DATEDIFF(COALESCE(t.end_date, CURDATE()), t.start_date) AS duration_days,
           p.age, p.gender, p.patient_code
    FROM Treatments t
    JOIN Patients p ON t.patient_id = p.patient_id
    WHERE t.disease_id = ?
  `, [diseaseId]);

  // Structured drug administrations + recorded outcomes for those treatments
  const [admins] = await db.query(`
    SELECT da.admin_id, da.treatment_id, da.drug_id, da.dosage,
           dr.name AS drug_name, dr.category,
           do2.efficacy_score, do2.side_effects
    FROM Drug_Administrations da
    JOIN Drugs dr ON da.drug_id = dr.drug_id
    JOIN Treatments t ON da.treatment_id = t.treatment_id
    LEFT JOIN Drug_Outcomes do2 ON da.admin_id = do2.admin_id
    WHERE t.disease_id = ?
  `, [diseaseId]);

  // Drug catalog for category lookup (medicines_json plans often omit category)
  const [drugCatalog] = await db.query('SELECT name, category FROM Drugs');
  const catByName = new Map(drugCatalog.map(d => [String(d.name).trim().toLowerCase(), d.category]));

  // Qualitative drug-response narratives from the timeline (for patients in this cohort)
  const patientIds = [...new Set(treatments.map(t => t.patient_id))];
  let responseEvents = [];
  if (patientIds.length) {
    const ph = patientIds.map(() => '?').join(',');
    const [rows] = await db.query(
      `SELECT patient_id, event_title, event_description FROM Timeline_Events
       WHERE event_type = 'drug_response' AND patient_id IN (${ph})`, patientIds
    );
    responseEvents = rows;
  }

  const total = treatments.length;
  const isCured = (t) => t.status === 'Cured';

  // ── Overall outcomes ──────────────────────────────────────────────────────────
  const cured = treatments.filter(isCured).length;
  const left = treatments.filter(t => t.status === 'Left Treatment').length;
  const ongoing = treatments.filter(t => t.status === 'Ongoing').length;
  const improved = treatments.filter(t => t.status === 'Improved').length;
  const curedDurations = treatments.filter(isCured).map(t => t.duration_days).filter(d => d > 0);
  const avgDaysToCure = curedDurations.length ? Math.round(curedDurations.reduce((a, b) => a + b, 0) / curedDurations.length) : null;

  // ── Map treatment → its drugs / outcomes ────────────────────────────────────────
  // Drug usage is drawn from BOTH the structured Drug_Administrations table AND the
  // medicines_json treatment plan (the latter is the primary data source today).
  const txDrugs = new Map();   // treatment_id → Set(drug_name)
  const drugAgg = new Map();   // drug_name → aggregate
  const ensureDrug = (name, category) => {
    const key = name.trim();
    if (!drugAgg.has(key)) {
      drugAgg.set(key, {
        drug_name: key, category: category || catByName.get(key.toLowerCase()) || 'Uncategorized',
        treatmentIds: new Set(), efficacyScores: [], outcomeRecords: 0, sideEffectRecords: 0,
      });
    }
    return drugAgg.get(key);
  };
  const linkDrug = (treatmentId, name, category) => {
    if (!name || !String(name).trim()) return;
    if (!txDrugs.has(treatmentId)) txDrugs.set(treatmentId, new Set());
    txDrugs.get(treatmentId).add(name.trim());
    ensureDrug(name, category).treatmentIds.add(treatmentId);
  };

  // From medicines_json treatment plans
  for (const t of treatments) {
    for (const med of asArray(t.medicines_json)) {
      const name = typeof med === 'string' ? med : med.name;
      linkDrug(t.treatment_id, name);
    }
  }

  // From structured administrations + outcomes (adds efficacy scores / side-effect signals)
  for (const a of admins) {
    linkDrug(a.treatment_id, a.drug_name, a.category);
    const g = ensureDrug(a.drug_name, a.category);
    if (a.efficacy_score != null) { g.efficacyScores.push(a.efficacy_score); g.outcomeRecords++; }
    if (a.side_effects && String(a.side_effects).trim()) g.sideEffectRecords++;
  }

  const txById = new Map(treatments.map(t => [t.treatment_id, t]));

  // ── Per-drug efficacy with cohort lift ──────────────────────────────────────────
  const drugs = [];
  for (const g of drugAgg.values()) {
    const withTx = [...g.treatmentIds].map(id => txById.get(id)).filter(Boolean);
    const withN = withTx.length;
    const withCured = withTx.filter(isCured).length;
    const cureWith = pct(withCured, withN);

    // Baseline: treatments for the SAME disease that did NOT use this drug
    const withoutTx = treatments.filter(t => !g.treatmentIds.has(t.treatment_id));
    const cureWithout = withoutTx.length ? pct(withoutTx.filter(isCured).length, withoutTx.length) : null;
    const lift = cureWithout == null ? null : round1(cureWith - cureWithout);

    // Objective outcome: average days to cure among cured treatments using this drug
    const curedDays = withTx.filter(isCured).map(t => t.duration_days).filter(x => x > 0);
    const avgDaysToCure = curedDays.length ? Math.round(curedDays.reduce((a, b) => a + b, 0) / curedDays.length) : null;
    const recordedEff = g.efficacyScores.length ? round1(g.efficacyScores.reduce((a, b) => a + b, 0) / g.efficacyScores.length) : null;

    drugs.push({
      drug_name: g.drug_name,
      category: g.category,
      n_treatments: withN,
      cured_with: withCured,
      cure_rate_with: cureWith,
      cure_rate_without: cureWithout,
      cohort_lift: lift,
      avg_days_to_cure: avgDaysToCure,
      recorded_efficacy: recordedEff,
      outcome_records: g.outcomeRecords,
      side_effect_rate: pct(g.sideEffectRecords, withN),
      confidence: confidenceTier(withN),
    });
  }
  // Rank by cohort lift (fallback cure rate), most-evidenced first
  drugs.sort((a, b) =>
    (b.cohort_lift ?? b.cure_rate_with) - (a.cohort_lift ?? a.cure_rate_with) ||
    b.n_treatments - a.n_treatments
  );

  // ── Attach qualitative response narratives per drug (mentions the drug by name) ──
  for (const d of drugs) {
    const needle = d.drug_name.toLowerCase();
    d.response_notes = responseEvents
      .filter(e => (e.event_description || '').toLowerCase().includes(needle))
      .map(e => e.event_description)
      .slice(0, 5);
  }
  // Disease-level response narratives, each tagged with patient code + outcome so the
  // list is auditable (not anonymous). No cap — this is the full response log.
  const drugNamesLc = new Set([...drugAgg.keys()].map(s => s.toLowerCase()));
  const patientInfo = new Map(); // patient_id → { patient_code, status }
  for (const t of treatments) patientInfo.set(t.patient_id, { patient_code: t.patient_code, status: t.status });
  const responseSamples = responseEvents
    .filter(e => [...drugNamesLc].some(n => (e.event_description || '').toLowerCase().includes(n)))
    .map(e => {
      const info = patientInfo.get(e.patient_id) || {};
      return {
        patient_id: e.patient_id,
        patient_code: info.patient_code || '—',
        status: info.status || 'Unknown',
        note: e.event_description,
      };
    });

  // ── Regimen (drug-combination) analysis ─────────────────────────────────────────
  const regimenAgg = new Map();
  for (const [tid, set] of txDrugs.entries()) {
    if (set.size === 0) continue;
    const key = [...set].sort().join(' + ');
    if (!regimenAgg.has(key)) regimenAgg.set(key, { regimen: key, drug_count: set.size, treatmentIds: [] });
    regimenAgg.get(key).treatmentIds.push(tid);
  }
  const regimens = [...regimenAgg.values()].map(r => {
    const tx = r.treatmentIds.map(id => txById.get(id)).filter(Boolean);
    const curedDays = tx.filter(isCured).map(t => t.duration_days).filter(x => x > 0);
    return {
      regimen: r.regimen, drug_count: r.drug_count, n_treatments: tx.length,
      cured: tx.filter(isCured).length,
      cure_rate: pct(tx.filter(isCured).length, tx.length),
      avg_days_to_cure: curedDays.length ? Math.round(curedDays.reduce((a, b) => a + b, 0) / curedDays.length) : null,
      confidence: confidenceTier(tx.length),
    };
  }).filter(r => r.n_treatments >= 2)
    .sort((a, b) => b.cure_rate - a.cure_rate || b.n_treatments - a.n_treatments)
    .slice(0, 6);

  // ── Lifestyle / diet signal (present vs absent) ─────────────────────────────────
  const signal = (key) => {
    const withRec = treatments.filter(t => asArray(t[key]).length > 0);
    const withoutRec = treatments.filter(t => asArray(t[key]).length === 0);
    return {
      with_n: withRec.length,
      with_cure_rate: pct(withRec.filter(isCured).length, withRec.length),
      without_n: withoutRec.length,
      without_cure_rate: withoutRec.length ? pct(withoutRec.filter(isCured).length, withoutRec.length) : null,
    };
  };
  const lifestyleSignal = signal('lifestyle_json');
  const dietSignal = signal('diet_json');

  // ── Cohort breakdowns ───────────────────────────────────────────────────────────
  const ageBand = (age) => age == null ? 'Unknown'
    : age < 18 ? 'Under 18' : age <= 30 ? '18-30' : age <= 45 ? '31-45' : age <= 60 ? '46-60' : 'Above 60';
  const groupBy = (fn) => {
    const m = new Map();
    for (const t of treatments) {
      const k = fn(t);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    }
    return [...m.entries()].map(([k, tx]) => ({
      group: k, n: tx.length, cure_rate: pct(tx.filter(isCured).length, tx.length),
    })).sort((a, b) => b.n - a.n);
  };

  // ── Dropout ─────────────────────────────────────────────────────────────────────
  const leftTx = treatments.filter(t => t.status === 'Left Treatment');
  const dropout = {
    n: left,
    rate: pct(left, total),
    avg_days_before_dropout: (() => {
      const ds = leftTx.map(t => t.duration_days).filter(d => d > 0);
      return ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : null;
    })(),
  };

  // ── Data-quality gaps ────────────────────────────────────────────────────────────
  const txWithAnyDrug = txDrugs.size;
  const dataQuality = {
    total_treatments: total,
    treatments_with_any_drug: txWithAnyDrug,
    pct_missing_any_drug: pct(total - txWithAnyDrug, total),
    treatments_with_efficacy_scores: new Set(admins.filter(a => a.efficacy_score != null).map(a => a.treatment_id)).size,
    outcome_score_records: admins.filter(a => a.efficacy_score != null).length,
    note: admins.length === 0
      ? 'No structured Drug_Administrations/Drug_Outcomes records exist — drug efficacy is inferred from treatment plans (medicines_json) and outcomes only. Recorded efficacy scores and side-effect rates are unavailable.'
      : `${pct(admins.filter(a => a.efficacy_score == null).length, admins.length)}% of structured drug administrations have no recorded efficacy score.`,
  };

  return {
    generated_at: new Date().toISOString(),
    disease: { id: disease.disease_id, name: disease.disease_name, category: disease.category_name, description: disease.description },
    overview: {
      total_treatments: total, distinct_patients: new Set(treatments.map(t => t.patient_id)).size,
      cured, improved, ongoing, left,
      cure_rate: pct(cured, total), dropout_rate: pct(left, total),
      avg_days_to_cure: avgDaysToCure,
      confidence: confidenceTier(total),
    },
    drugs,
    regimens,
    lifestyle_signal: lifestyleSignal,
    diet_signal: dietSignal,
    cohorts: { by_age: groupBy(t => ageBand(t.age)), by_gender: groupBy(t => t.gender || 'Unknown') },
    dropout,
    response_samples: responseSamples,
    data_quality: dataQuality,
  };
}

// Render the deterministic packet as Markdown (GFM tables) — the *correct* numbers,
// shown directly so they never depend on the AI.
function evidenceToMarkdown(p) {
  const o = p.overview;
  const liftStr = (v) => v == null ? '—' : (v > 0 ? `+${v}` : `${v}`);
  const md = [];

  md.push(`## 📊 Deterministic Evidence — ${p.disease.name}`);
  md.push(`*Computed from clinic records on ${new Date(p.generated_at).toLocaleString()} · evidence confidence: **${o.confidence}** (n=${o.total_treatments})*`);
  md.push('');
  md.push(`**Outcomes:** ${o.total_treatments} treatments · ${o.distinct_patients} patients · Cured ${o.cured} (${o.cure_rate}%) · Improved ${o.improved} · Ongoing ${o.ongoing} · Left ${o.left} (${o.dropout_rate}%)${o.avg_days_to_cure ? ` · Avg ${o.avg_days_to_cure} days to cure` : ''}`);
  md.push('');

  if (p.drugs.length) {
    md.push(`### Drug Efficacy (ranked by cohort lift)`);
    md.push(`*Cohort lift = cure rate **with** the drug minus cure rate **without** it, same disease. Positive lift = the drug cohort did better.*`);
    md.push('');
    md.push(`| Drug | Category | n | Cure% (with) | Cure% (without) | Lift | Avg days→cure | Side-effects% | Confidence |`);
    md.push(`|---|---|---|---|---|---|---|---|---|`);
    for (const d of p.drugs) {
      md.push(`| ${d.drug_name} | ${d.category} | ${d.n_treatments} | ${d.cure_rate_with}% | ${d.cure_rate_without == null ? '—' : d.cure_rate_without + '%'} | ${liftStr(d.cohort_lift)} | ${d.avg_days_to_cure == null ? '—' : d.avg_days_to_cure + 'd'} | ${d.side_effect_rate}% | ${d.confidence} |`);
    }
    md.push('');
  }

  if (p.regimens.length) {
    md.push(`### Top Regimens (drug combinations)`);
    md.push(`| Regimen | Drugs | n | Cure% | Avg days→cure | Confidence |`);
    md.push(`|---|---|---|---|---|---|`);
    for (const r of p.regimens) {
      md.push(`| ${r.regimen} | ${r.drug_count} | ${r.n_treatments} | ${r.cure_rate}% | ${r.avg_days_to_cure == null ? '—' : r.avg_days_to_cure + 'd'} | ${r.confidence} |`);
    }
    md.push('');
  }

  const ls = p.lifestyle_signal, ds = p.diet_signal;
  md.push(`### Lifestyle & Diet Signal`);
  md.push(`- **Lifestyle advice present:** ${ls.with_cure_rate}% cure (n=${ls.with_n}) vs ${ls.without_cure_rate == null ? '—' : ls.without_cure_rate + '%'} when absent (n=${ls.without_n})`);
  md.push(`- **Diet advice present:** ${ds.with_cure_rate}% cure (n=${ds.with_n}) vs ${ds.without_cure_rate == null ? '—' : ds.without_cure_rate + '%'} when absent (n=${ds.without_n})`);
  md.push('');

  md.push(`### Dropout`);
  md.push(`- ${p.dropout.n} left treatment (${p.dropout.rate}%)${p.dropout.avg_days_before_dropout ? ` · avg ${p.dropout.avg_days_before_dropout} days before leaving` : ''}`);
  md.push('');

  if (p.response_samples && p.response_samples.length) {
    md.push(`### Recorded Response Notes (qualitative)`);
    md.push(`*Doctor-recorded narratives of how patients responded to each medicine — used by the AI to weigh efficacy.*`);
    md.push('');
    for (const r of p.response_samples.slice(0, 15)) md.push(`- **${r.patient_code}** _(${r.status})_ — ${r.note}`);
    md.push('');
  }

  const dq = p.data_quality;
  md.push(`### Data-Quality Gaps`);
  md.push(`- ${dq.pct_missing_any_drug}% of treatments have **no drug recorded** (${dq.total_treatments - dq.treatments_with_any_drug}/${dq.total_treatments})`);
  md.push(`- ${dq.note}`);
  md.push('');

  return md.join('\n');
}

module.exports = { buildDiseaseEvidence, evidenceToMarkdown, confidenceTier };
