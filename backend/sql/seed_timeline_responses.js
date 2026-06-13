/**
 * Seed richer timeline events — drug-response narratives.
 * --------------------------------------------------------
 * For every treatment, inserts 1–3 `drug_response` Timeline_Events that NAME the
 * medicine given and DESCRIBE the patient's qualitative response, tied to the
 * treatment's real outcome (status). These narratives are what the AI reads to
 * judge drug efficiency — e.g. "Good initial response, but changed due to reduced
 * performance" for a Left-Treatment case.
 *
 * Idempotent: deletes existing `drug_response` events before re-seeding.
 * Run:  node backend/sql/seed_timeline_responses.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

// Deterministic pseudo-random so re-runs are reproducible per treatment.
const pick = (arr, seed) => arr[seed % arr.length];

const parseMeds = (v) => {
  if (!v) return [];
  try {
    const p = typeof v === 'string' ? JSON.parse(v) : v;
    return Array.isArray(p) ? p.map(m => (typeof m === 'string' ? m : m.name)).filter(Boolean) : [];
  } catch { return []; }
};

// Symptom phrasing by broad category (best-effort from disease name keywords).
const symptomFor = (disease) => {
  const d = (disease || '').toLowerCase();
  if (/arthrit|joint|back|pain|gout|spondy/.test(d)) return 'joint stiffness and pain';
  if (/asthma|cough|bronch|respir|sinus/.test(d)) return 'breathlessness and cough';
  if (/diabet|thyroid|obes|metabol/.test(d)) return 'metabolic markers';
  if (/skin|psorias|eczema|acne|derma/.test(d)) return 'skin lesions and itching';
  if (/migrain|headache|anxiet|stress|insomnia|depress|neuro/.test(d)) return 'frequency of episodes';
  if (/ibs|gastr|acid|digest|constipat|liver|ulcer/.test(d)) return 'digestive discomfort';
  return 'presenting symptoms';
};

const sideEffects = ['mild gastric discomfort', 'transient nausea', 'mild drowsiness', 'a skin rash', 'mild acidity'];

// Narrative templates keyed to outcome. {med} {med2} {sym} {se} are filled in.
const templates = {
  Cured: [
    'Started {med}. Strong initial response — {sym} eased noticeably within the first few weeks. Response was sustained throughout; patient reached full recovery.',
    '{med} was well tolerated with steady, consistent improvement in {sym}. No adverse effects; complete resolution achieved by end of course.',
    'Excellent response to {med}; {sym} improved progressively and remained stable. Treatment concluded with the patient cured.',
  ],
  Improved: [
    'Good initial response to {med}; clear relief in {sym}. Improvement plateaued at a moderate level but remained clearly beneficial.',
    '{med} produced gradual, partial improvement in {sym}. Benefit maintained; patient stable and continuing to improve.',
    'Moderate, durable response to {med} — {sym} reduced and held steady, though not fully resolved.',
  ],
  Ongoing: [
    'Early positive response to {med}; {sym} gradually reducing. Treatment continuing with regular monitoring.',
    '{med} started; mild-to-moderate response so far in {sym}. Well tolerated, continuing as planned.',
    'Initial response to {med} is encouraging but still developing; {sym} slowly easing.',
  ],
  'Left Treatment': [
    'Good initial response to {med}, but efficacy reduced over the following weeks; despite adjustment the patient discontinued due to waning benefit.',
    '{med} showed early promise, however {sym} plateaued and mild side effects ({se}) emerged — patient left treatment before completion.',
    'Initial improvement with {med} was not sustained; response declined and the patient dropped out citing limited ongoing benefit.',
  ],
};

const switchTemplates = {
  Improved: 'Adjusted regimen: added {med2} alongside {med} to reinforce a partial response.',
  Ongoing: 'Adjusted regimen: {med2} introduced with {med} to strengthen the early response.',
  'Left Treatment': 'Switched from {med} to {med2} due to reduced performance, but the improved response was not maintained.',
  Cured: 'Combined {med} with {med2}; the pairing produced a strong, sustained response through to recovery.',
};

const fill = (tpl, { med, med2, sym, se }) =>
  tpl.replace(/{med2}/g, med2 || med).replace(/{med}/g, med).replace(/{sym}/g, sym).replace(/{se}/g, se);

// event_date roughly mid-course
const midDate = (start, end) => {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  return new Date(s.getTime() + (e - s) * 0.5);
};

async function seed() {
  try {
    const [treatments] = await db.query(`
      SELECT t.treatment_id, t.patient_id, t.doctor_id, t.status, t.start_date, t.end_date,
             t.medicines_json, d.disease_name
      FROM Treatments t JOIN Diseases d ON t.disease_id = d.disease_id
    `);

    // Clean previous response seed so this is idempotent
    const [del] = await db.query("DELETE FROM Timeline_Events WHERE event_type = 'drug_response'");
    console.log(`Cleared ${del.affectedRows} existing drug_response events.`);

    let inserted = 0;
    for (const t of treatments) {
      const meds = parseMeds(t.medicines_json);
      if (!meds.length) continue;
      const sym = symptomFor(t.disease_name);
      const seed = t.treatment_id;
      const se = pick(sideEffects, seed);
      const med = meds[0];
      const med2 = meds[1] || null;
      const status = t.status || 'Ongoing';

      // 1) Primary drug-response narrative
      const desc = fill(pick(templates[status] || templates.Ongoing, seed), { med, med2, sym, se });
      const when = midDate(t.start_date, t.end_date);
      await db.query(
        'INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by) VALUES (?,?,?,?,?,?)',
        [t.patient_id, 'drug_response', `Response to ${med}`, desc, when, t.doctor_id]
      );
      inserted++;

      // 2) For multi-drug treatments, a switch/combination narrative slightly later
      if (med2) {
        const sw = fill(switchTemplates[status] || switchTemplates.Ongoing, { med, med2, sym, se });
        const when2 = new Date(when.getTime() + 7 * 86400000);
        await db.query(
          'INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by) VALUES (?,?,?,?,?,?)',
          [t.patient_id, 'drug_response', `Regimen change — ${med2}`, sw, when2, t.doctor_id]
        );
        inserted++;
      }
    }

    console.log(`Inserted ${inserted} drug_response timeline events across ${treatments.length} treatments.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
