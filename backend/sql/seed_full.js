/**
 * Comprehensive, CONSISTENT re-seed of the AYUSHI clinical dataset.
 * --------------------------------------------------------------------
 * - Keeps schema unchanged. Keeps Users (admin + doctors) and Doctor_Requests.
 * - Truncates & rebuilds: Diseases, Drugs, Patients, Treatments, Followups,
 *   Timeline_Events, Drug_Administrations, Drug_Outcomes, AI_Reports.
 * - Guarantees cross-dataset consistency:
 *     • medicines_json drug names === Drugs catalog names
 *     • treatment_started / drug_response timeline text names the SAME medicines
 *     • drug_response narrative matches the treatment's outcome (status)
 *     • first-line drugs (index 0) are prescribed more AND cure more → real cohort lift
 *
 * Run:  cd backend && node sql/seed_full.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const fmtDate = (d) => d.toISOString().split('T')[0];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// ── Drug catalog (name → category) ───────────────────────────────────────────
const DRUG_CAT = {
  'Shallaki': 'Anti-inflammatory', 'Rasna': 'Anti-inflammatory', 'Dashamool': 'Anti-inflammatory',
  'Yograj Guggulu': 'Guggulu Formulation', 'Kaishore Guggulu': 'Guggulu Formulation', 'Guggulu': 'Guggulu Formulation',
  'Kanchnar Guggulu': 'Guggulu Formulation', 'Medohar Guggulu': 'Guggulu Formulation',
  'Ashwagandha': 'Adaptogen / Rasayana', 'Amalaki': 'Adaptogen / Rasayana', 'Shatavari': 'Adaptogen / Rasayana',
  'Guduchi': 'Immunomodulator', 'Punarnava': 'Diuretic / Renal', 'Gokshura': 'Diuretic / Renal',
  'Varuna': 'Renal / Lithotriptic', 'Chandraprabha': 'Urological',
  'Triphala': 'Digestive', 'Haritaki': 'Digestive', 'Bilva': 'Digestive', 'Trikatu': 'Digestive Stimulant',
  'Kutaja': 'Antidiarrheal', 'Hingvastak': 'Carminative', 'Avipattikar': 'Antacid',
  'Yashtimadhu': 'Demulcent', 'Isabgol': 'Bulk Laxative', 'Eranda Taila': 'Purgative', 'Shankha Bhasma': 'Antacid',
  'Vasa': 'Respiratory', 'Sitopaladi': 'Respiratory', 'Kantakari': 'Respiratory', 'Talisadi': 'Respiratory',
  'Pushkarmool': 'Cardio-respiratory', 'Tulsi': 'Respiratory',
  'Haridra': 'Anti-inflammatory / Skin', 'Manjistha': 'Blood Purifier', 'Neem': 'Antimicrobial',
  'Khadira': 'Blood Purifier', 'Sariva': 'Blood Purifier', 'Bakuchi': 'Skin',
  'Brahmi': 'Nervine', 'Jatamansi': 'Nervine Sedative', 'Shankhpushpi': 'Nervine', 'Tagara': 'Sedative',
  'Godanti': 'Headache', 'Pathyadi': 'Headache', 'Shirashooladi': 'Headache',
  'Sarpagandha': 'Antihypertensive', 'Arjuna': 'Cardiotonic',
  'Meshashringi (Gymnema)': 'Antidiabetic', 'Methi': 'Antidiabetic', 'Nisha Amalaki': 'Antidiabetic',
};

// ── Diseases (drugs[0] = first-line / most effective) ────────────────────────
const LIFESTYLE = {
  'Musculoskeletal Disorders': ['Gentle morning yoga', 'Warm sesame-oil massage (Abhyanga)', 'Avoid heavy lifting', 'Regular gentle walking'],
  'Digestive Disorders': ['Regular meal timings', 'Mindful eating, avoid overeating', 'Light walking after meals', 'Stress reduction'],
  'Respiratory Disorders': ['Steam inhalation', 'Pranayama breathing exercises', 'Avoid cold/dusty exposure', 'Adequate rest'],
  'Skin Disorders': ['Avoid harsh soaps', 'Daily gentle cleansing', 'Stress management', 'Adequate hydration'],
  'Neurological & Mental Health': ['Meditation 20 min daily', 'Regular sleep schedule', 'Reduce screen time before bed', 'Daily walk in nature'],
  'Metabolic & Endocrine': ['Daily 30-min brisk walk', 'Weight management', 'Consistent meal timing', 'Yoga and stress control'],
  'Urological & Renal': ['Increase water intake', 'Avoid holding urine', 'Reduce salt intake', 'Regular light activity'],
  'Cardiovascular Disorders': ['Daily moderate walking', 'Stress reduction & meditation', 'Adequate sleep', 'Avoid smoking'],
};
const DIET = {
  'Musculoskeletal Disorders': ['Warm cooked meals', 'Anti-inflammatory foods (turmeric, ginger)', 'Avoid cold and fermented foods'],
  'Digestive Disorders': ['Easily digestible foods', 'Avoid spicy & fried food', 'Buttermilk and warm water'],
  'Respiratory Disorders': ['Warm soups', 'Honey with warm water', 'Avoid cold drinks & dairy at night'],
  'Skin Disorders': ['Bitter vegetables', 'Avoid fermented & sour foods', 'Plenty of fresh fruit'],
  'Neurological & Mental Health': ['Warm milk with nutmeg at night', 'Avoid caffeine', 'Ghee and nourishing foods'],
  'Metabolic & Endocrine': ['High-fibre, low-glycaemic diet', 'Avoid refined sugar', 'Bitter gourd & fenugreek'],
  'Urological & Renal': ['Plenty of fluids', 'Reduce oxalate-rich foods', 'Coconut water'],
  'Cardiovascular Disorders': ['Low-salt diet', 'Arjuna bark tea', 'Avoid fried & processed food'],
};

const DISEASES = [
  ['Musculoskeletal Disorders', 'Osteoarthritis', 'Degenerative joint disease causing pain and stiffness', ['Shallaki', 'Yograj Guggulu', 'Ashwagandha', 'Rasna']],
  ['Musculoskeletal Disorders', 'Rheumatoid Arthritis', 'Autoimmune inflammatory joint disorder', ['Shallaki', 'Guggulu', 'Guduchi', 'Ashwagandha']],
  ['Musculoskeletal Disorders', 'Lower Back Pain', 'Chronic lumbar pain', ['Yograj Guggulu', 'Dashamool', 'Rasna', 'Ashwagandha']],
  ['Musculoskeletal Disorders', 'Gout', 'Uric-acid arthropathy', ['Kaishore Guggulu', 'Guduchi', 'Punarnava', 'Triphala']],
  ['Digestive Disorders', 'Irritable Bowel Syndrome', 'Functional bowel disorder', ['Kutaja', 'Bilva', 'Hingvastak', 'Triphala']],
  ['Digestive Disorders', 'Acid Reflux (GERD)', 'Gastro-oesophageal reflux', ['Avipattikar', 'Yashtimadhu', 'Amalaki', 'Shatavari']],
  ['Digestive Disorders', 'Chronic Constipation', 'Persistent difficult bowel movement', ['Triphala', 'Isabgol', 'Haritaki', 'Eranda Taila']],
  ['Digestive Disorders', 'Peptic Ulcer', 'Gastric/duodenal ulceration', ['Yashtimadhu', 'Shatavari', 'Shankha Bhasma', 'Amalaki']],
  ['Respiratory Disorders', 'Bronchial Asthma', 'Reversible airway obstruction', ['Vasa', 'Sitopaladi', 'Kantakari', 'Pushkarmool']],
  ['Respiratory Disorders', 'Chronic Bronchitis', 'Chronic airway inflammation', ['Sitopaladi', 'Talisadi', 'Vasa', 'Kantakari']],
  ['Respiratory Disorders', 'Allergic Rhinitis', 'Allergic nasal inflammation', ['Haridra', 'Sitopaladi', 'Tulsi', 'Trikatu']],
  ['Respiratory Disorders', 'Sinusitis', 'Paranasal sinus inflammation', ['Trikatu', 'Sitopaladi', 'Tulsi', 'Haridra']],
  ['Skin Disorders', 'Psoriasis', 'Chronic scaly skin plaques', ['Manjistha', 'Neem', 'Khadira', 'Haridra']],
  ['Skin Disorders', 'Eczema', 'Chronic itchy dermatitis', ['Neem', 'Manjistha', 'Haridra', 'Khadira']],
  ['Skin Disorders', 'Acne Vulgaris', 'Inflammatory skin condition', ['Manjistha', 'Neem', 'Sariva', 'Haridra']],
  ['Skin Disorders', 'Vitiligo', 'Depigmentation disorder', ['Bakuchi', 'Manjistha', 'Khadira', 'Neem']],
  ['Neurological & Mental Health', 'Migraine', 'Recurrent vascular headache', ['Brahmi', 'Godanti', 'Pathyadi', 'Shirashooladi']],
  ['Neurological & Mental Health', 'Generalized Anxiety', 'Persistent excessive worry', ['Brahmi', 'Jatamansi', 'Ashwagandha', 'Shankhpushpi']],
  ['Neurological & Mental Health', 'Insomnia', 'Difficulty sleeping', ['Jatamansi', 'Tagara', 'Ashwagandha', 'Brahmi']],
  ['Neurological & Mental Health', 'Depression', 'Persistent low mood', ['Brahmi', 'Ashwagandha', 'Jatamansi', 'Shankhpushpi']],
  ['Metabolic & Endocrine', 'Type 2 Diabetes', 'Insulin-resistant hyperglycaemia', ['Meshashringi (Gymnema)', 'Guduchi', 'Methi', 'Nisha Amalaki']],
  ['Metabolic & Endocrine', 'Hypothyroidism', 'Underactive thyroid', ['Kanchnar Guggulu', 'Ashwagandha', 'Guggulu', 'Punarnava']],
  ['Metabolic & Endocrine', 'Obesity', 'Excess body weight', ['Medohar Guggulu', 'Triphala', 'Trikatu', 'Guggulu']],
  ['Metabolic & Endocrine', 'Hyperlipidemia', 'Elevated blood lipids', ['Guggulu', 'Arjuna', 'Triphala', 'Medohar Guggulu']],
  ['Urological & Renal', 'Kidney Stones', 'Renal calculi', ['Gokshura', 'Varuna', 'Punarnava', 'Chandraprabha']],
  ['Urological & Renal', 'Urinary Tract Infection', 'Lower urinary tract infection', ['Chandraprabha', 'Gokshura', 'Punarnava', 'Varuna']],
  ['Urological & Renal', 'Benign Prostatic Hyperplasia', 'Prostate enlargement', ['Gokshura', 'Varuna', 'Punarnava', 'Chandraprabha']],
  ['Cardiovascular Disorders', 'Hypertension', 'High blood pressure', ['Arjuna', 'Sarpagandha', 'Punarnava', 'Jatamansi']],
  ['Cardiovascular Disorders', 'Ischemic Heart Disease', 'Reduced coronary blood flow', ['Arjuna', 'Pushkarmool', 'Guggulu', 'Ashwagandha']],
];

// effectiveness (cure probability) by drug position in a disease's list
const EFFECT = [0.62, 0.48, 0.38, 0.28];
const PRESCRIBE_WEIGHT = [0.45, 0.28, 0.17, 0.10]; // first-line prescribed most

const FIRST = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Krishna','Ishaan','Rohan','Rahul','Vikram','Ananya','Diya','Aadhya','Saanvi','Pari','Ananee','Myra','Aarohi','Kavya','Lakshmi','Priya','Meera','Radha','Sneha','Pooja','Neha','Anjali','Deepa','Suresh','Ramesh','Mahesh','Ganesh','Karthik','Manoj','Sanjay','Anil','Vijay','Prakash'];
const LAST = ['Sharma','Patel','Nair','Reddy','Iyer','Menon','Pillai','Rao','Gupta','Singh','Kumar','Das','Bhat','Joshi','Verma','Shah','Naidu','Mishra','Chauhan','Desai'];
const DOSAGES = ['250 mg', '500 mg', '1 g', '5 ml', '10 ml', '1 tablet', '2 tablets'];
const FREQ = ['once daily', 'twice daily', 'thrice daily', 'after meals', 'before bed'];
const SYMPTOM = {
  'Musculoskeletal Disorders': 'joint stiffness and pain', 'Digestive Disorders': 'bloating and irregular digestion',
  'Respiratory Disorders': 'cough and breathlessness', 'Skin Disorders': 'itching and skin lesions',
  'Neurological & Mental Health': 'episode frequency and intensity', 'Metabolic & Endocrine': 'metabolic markers',
  'Urological & Renal': 'urinary discomfort', 'Cardiovascular Disorders': 'blood pressure and palpitations',
};
const SIDE_EFFECTS = ['mild gastric discomfort', 'transient nausea', 'mild acidity', 'mild drowsiness'];

// narratives keyed to status; {m}=primary med, {sym}=symptom, {se}=side effect
const NARR = {
  'Cured': [
    'Started {m}. Strong initial response — {sym} eased noticeably within the first few weeks. Sustained throughout; patient reached full recovery.',
    '{m} was well tolerated with steady, consistent improvement in {sym}. No adverse effects; complete resolution by end of course.',
  ],
  'Improved': [
    'Good initial response to {m}; clear relief in {sym}. Improvement plateaued at a moderate level but remained clearly beneficial.',
    '{m} produced gradual, partial improvement in {sym}; benefit maintained, patient stable.',
  ],
  'Ongoing': [
    'Early positive response to {m}; {sym} gradually reducing. Treatment continuing with monitoring.',
    '{m} started; mild-to-moderate response so far in {sym}. Tolerated well, continuing.',
  ],
  'Left Treatment': [
    'Good initial response to {m}, but efficacy reduced over the following weeks; patient discontinued due to waning benefit.',
    '{m} showed early promise, however {sym} plateaued and mild side effects ({se}) emerged — patient left before completion.',
  ],
};
const fill = (t, o) => t.replace(/{m}/g, o.m).replace(/{sym}/g, o.sym).replace(/{se}/g, o.se);

async function run() {
  try {
    const [docs] = await db.query("SELECT user_id FROM Users WHERE role='doctor' AND is_active=1");
    if (!docs.length) throw new Error('No doctors found in Users — keep at least the seeded doctors.');
    const doctorIds = docs.map(d => d.user_id);
    const [[admin]] = await db.query("SELECT user_id FROM Users WHERE role='admin' LIMIT 1");
    const adminId = admin ? admin.user_id : doctorIds[0];

    // ── Truncate clinical tables (schema untouched) ──────────────────────────
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of ['AI_Reports', 'Drug_Outcomes', 'Drug_Administrations', 'Followups', 'Timeline_Events', 'Treatments', 'Patients', 'Diseases', 'Drugs']) {
      await db.query(`TRUNCATE TABLE ${t}`);
    }
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Truncated clinical tables (Users & Doctor_Requests kept).');

    // ── Drugs catalog ────────────────────────────────────────────────────────
    const drugIds = {};
    for (const [name, category] of Object.entries(DRUG_CAT)) {
      const [r] = await db.query(
        'INSERT INTO Drugs (name, category, description, traditional_use) VALUES (?,?,?,?)',
        [name, category, `${name} — classical Ayurvedic ${category.toLowerCase()} agent.`, `Traditionally used in ${category.toLowerCase()} conditions.`]
      );
      drugIds[name] = r.insertId;
    }
    console.log(`Inserted ${Object.keys(drugIds).length} drugs.`);

    // ── Diseases ───────────────────────────────────────────────────────────────
    const diseaseRows = [];
    for (const [category, name, desc] of DISEASES) {
      const [r] = await db.query('INSERT INTO Diseases (category_name, disease_name, description) VALUES (?,?,?)', [category, name, desc]);
      diseaseRows.push(r.insertId);
    }
    console.log(`Inserted ${DISEASES.length} diseases.`);

    // ── Patients + Treatments + Followups + Timeline ─────────────────────────
    let patientSeq = 0, treatmentCount = 0, followupCount = 0, timelineCount = 0;
    const today = new Date();

    for (let di = 0; di < DISEASES.length; di++) {
      const [category, dName, , drugs] = DISEASES[di];
      const diseaseId = diseaseRows[di];
      const sym = SYMPTOM[category];
      const nPatients = rand(40, 60); // large, consistent cohort per disease for sharper signal

      for (let i = 0; i < nPatients; i++) {
        patientSeq++;
        const code = 'AYU-' + String(patientSeq).padStart(4, '0');
        const name = `${pick(FIRST)} ${pick(LAST)}`;
        const age = rand(18, 78);
        const gender = pick(['Male', 'Female', 'Female', 'Male', 'Other']);
        const startDate = addDays(today, -rand(30, 1000));
        const regDate = addDays(startDate, -rand(0, 8));
        const doctorId = pick(doctorIds);

        const [pr] = await db.query(
          'INSERT INTO Patients (patient_code, name, age, gender, phone, address, occupation, registration_date, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
          [code, name, age, gender, '9' + rand(100000000, 999999999), `${pick(['MG Road','Park St','Lake View','Gandhi Nagar'])}, ${pick(['Bengaluru','Chennai','Mumbai','Pune','Kochi'])}`, pick(['Teacher','Farmer','Engineer','Homemaker','Retired','Clerk','Business']), fmtDate(regDate), doctorId]
        );
        const patientId = pr.insertId;

        // ── Choose regimen (weighted toward first-line; mostly solo so each drug
        //    gets its own cases, varied partner when combined → distinct cohort lift) ──
        let r = Math.random(), idx = 0, acc = 0;
        for (let k = 0; k < PRESCRIBE_WEIGHT.length; k++) { acc += PRESCRIBE_WEIGHT[k]; if (r < acc) { idx = k; break; } }
        const primary = drugs[idx];
        const combined = chance(0.30); // 70% solo prescriptions
        let secondIdx = null;
        if (combined) secondIdx = pick([0, 1, 2, 3].filter(j => j !== idx)); // random partner, not always idx+1
        const regimenIdx = secondIdx == null ? [idx] : [idx, secondIdx];
        const regimenDrugs = regimenIdx.map(j => drugs[j]);
        const second = secondIdx == null ? null : drugs[secondIdx];
        const medsJson = regimenDrugs.map(m => ({ name: m, dosage: pick(DOSAGES), frequency: pick(FREQ) }));

        // ── Outcome driven by the MOST effective drug in the regimen → real cohort lift ──
        const bestIdx = Math.min(...regimenIdx);
        let cureP = EFFECT[bestIdx] + (combined ? 0.04 : 0);
        const roll = Math.random();
        let status;
        if (roll < cureP) status = 'Cured';
        else if (roll < cureP + 0.25) status = 'Improved';
        else if (roll < cureP + 0.42) status = 'Ongoing';
        else status = 'Left Treatment';

        const impr = status === 'Cured' ? rand(85, 100) : status === 'Improved' ? rand(50, 78) : status === 'Ongoing' ? rand(25, 50) : rand(10, 40);
        let endDate = null;
        if (status === 'Cured') endDate = addDays(startDate, rand(90, 300));
        else if (status === 'Left Treatment') endDate = addDays(startDate, rand(20, 180));
        if (endDate && endDate > today) endDate = today;

        const lifestyle = [pick(LIFESTYLE[category]), pick(LIFESTYLE[category])].filter((v, idx2, a) => a.indexOf(v) === idx2).map(s => ({ recommendation: s }));
        const diet = [pick(DIET[category]), pick(DIET[category])].filter((v, idx2, a) => a.indexOf(v) === idx2).map(s => ({ recommendation: s }));
        const notes = status === 'Cured' ? 'Patient responded well; full recovery achieved.'
          : status === 'Improved' ? 'Noticeable improvement; continuing maintenance.'
          : status === 'Ongoing' ? 'Treatment in progress; responding gradually.'
          : 'Patient discontinued treatment before completion.';

        const [tr] = await db.query(
          'INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, end_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
          [patientId, doctorId, diseaseId, fmtDate(startDate), endDate ? fmtDate(endDate) : null, status, impr, JSON.stringify(medsJson), JSON.stringify(lifestyle), JSON.stringify(diet), notes]
        );
        const treatmentId = tr.insertId;
        treatmentCount++;

        // ── Timeline: registration ──
        const tl = async (type, title, desc, date) => {
          await db.query('INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by) VALUES (?,?,?,?,?,?)',
            [patientId, type, title, desc, fmtDate(date) + ' 09:00:00', doctorId]); timelineCount++;
        };
        await tl('registration', 'Patient Registered', `Patient ${name} (${code}) registered at Ayushi clinic.`, regDate);

        // ── Timeline: treatment started (names the SAME medicines + lifestyle + diet) ──
        const medText = medsJson.map(m => `${m.name} ${m.dosage} ${m.frequency}`).join(', ');
        const lifeText = lifestyle.map(l => l.recommendation).join(', ');
        const dietText = diet.map(d => d.recommendation).join(', ');
        await tl('treatment_started', `Treatment Started - ${dName}`,
          `Ayurvedic treatment started for ${dName}. Medicines: ${medText}. Lifestyle: ${lifeText}. Diet: ${dietText}.`, startDate);

        // ── Timeline: drug response (narrative matches outcome + names primary drug) ──
        const se = pick(SIDE_EFFECTS);
        await tl('drug_response', `Response to ${primary}`, fill(pick(NARR[status]), { m: primary, sym, se }), addDays(startDate, rand(20, 45)));
        if (second) {
          const swtext = status === 'Left Treatment'
            ? `Switched to / added ${second} due to reduced performance, but the improved response was not sustained.`
            : `Added ${second} alongside ${primary} to reinforce the response.`;
          await tl('drug_response', `Regimen change — ${second}`, swtext, addDays(startDate, rand(46, 70)));
        }

        // ── Followups ──
        const nF = status === 'Cured' ? rand(3, 5) : status === 'Improved' ? rand(2, 4) : status === 'Ongoing' ? rand(1, 3) : rand(1, 2);
        const horizon = endDate || today;
        const span = Math.max(1, Math.round((horizon - startDate) / (1000 * 60 * 60 * 24)));
        for (let f = 1; f <= nF; f++) {
          const fDate = addDays(startDate, Math.round((span / (nF + 1)) * f) + rand(-3, 3));
          if (fDate > today) break;
          const fImpr = status === 'Left Treatment' ? Math.max(5, impr - rand(0, 15)) : Math.min(100, Math.round((impr / nF) * f));
          const resp = status === 'Left Treatment' && f === nF ? `Response waning; ${sym} no longer improving.` : `Response noted; ${sym} ${status === 'Cured' || status === 'Improved' ? 'improving steadily' : 'slowly easing'}.`;
          const sideEff = (status === 'Left Treatment' && chance(0.5)) ? pick(SIDE_EFFECTS) : 'None';
          await db.query(
            'INSERT INTO Followups (treatment_id, followup_date, symptoms, improvement_percentage, side_effects, notes) VALUES (?,?,?,?,?,?)',
            [treatmentId, fmtDate(fDate), resp, fImpr, sideEff, `Follow-up ${f} of ${nF}.`]
          ); followupCount++;
          await tl('followup', 'Follow-Up Completed', `Follow-up on ${fmtDate(fDate)}. ${resp}${sideEff !== 'None' ? ' Side effects: ' + sideEff + '.' : ''}`, fDate);
        }

        // ── Terminal events ──
        if (status === 'Cured') await tl('treatment_completed', 'Treatment Completed', `Patient successfully cured of ${dName}. Treatment concluded.`, endDate);
        if (status === 'Left Treatment') await tl('left_treatment', 'Patient Left Treatment', `Patient discontinued ${dName} treatment.`, endDate);
      }
    }

    console.log(`\nDONE. Patients: ${patientSeq} | Treatments: ${treatmentCount} | Followups: ${followupCount} | Timeline events: ${timelineCount}`);
    console.log('All medicines reference the Drugs catalog; timeline + response notes match each treatment.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

run();
