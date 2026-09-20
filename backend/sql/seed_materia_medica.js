/**
 * Materia Medica — derivation hierarchy + classical pharmacology for every drug.
 * ------------------------------------------------------------------------------
 * Adds to Drugs the axes the public /materia-medica tree is built from:
 *   source_type       derivation — Audbhida (plant) / Parthiva (mineral) / Jangama (animal)
 *   source_subtype    Vriksha, Oshadhi, Virudha, Rasa Dravya, Dhatu-Upadhatu …
 *   preparation_class Single drug (ekala dravya) vs Compound formulation (yoga)
 * …and the Rasapanchaka each entry is described by:
 *   rasa, guna, virya, vipaka, prabhava, dosha_effect, part_used,
 *   classical_reference, dosage, anupana, contraindications
 *
 * Idempotent.  Run:  node backend/sql/seed_materia_medica.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

const addColumn = async (table, column, ddl) => {
  const [r] = await db.query(
    `SELECT COUNT(*) c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, [table, column]);
  if (r[0].c === 0) { await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`); return 1; }
  return 0;
};

// Shorthand used in the table below.
const PLANT = 'Audbhida (Plant origin)';
const MIN   = 'Parthiva (Mineral origin)';
const ANIM  = 'Jangama (Animal origin)';
const SINGLE = 'Single drug (Ekala dravya)';
const COMPOUND = 'Compound formulation (Yoga)';

// name, source_type, source_subtype, preparation_class, part_used,
// rasa, guna, virya, vipaka, dosha_effect, classical_reference, dosage, anupana, contraindications
const M = [
['Shallaki', PLANT,'Vriksha (Tree)',SINGLE,'Oleo-gum resin (Niryasa)','Tikta, Kashaya, Madhura','Laghu, Ruksha','Shita','Katu','Pacifies Kapha & Vata','Bhavaprakasha Nighantu · Sushruta Samhita','250–500 mg twice daily','Warm water / milk','Use cautiously in hyperacidity'],
['Rasna', PLANT,'Oshadhi (Herb)',SINGLE,'Root, leaf','Tikta','Guru','Ushna','Katu','Pacifies Vata & Kapha','Bhavaprakasha Nighantu','1–3 g churna','Warm water','Pitta aggravation in excess'],
['Dashamool', PLANT,'Vriksha + Virudha (mixed)',COMPOUND,'Roots of ten drugs','Madhura, Tikta, Kashaya','Laghu, Ruksha','Ushna','Katu','Chiefly Vata-Kapha hara','Sharangadhara Samhita · Bhaishajya Ratnavali','15–30 ml arishta','Equal warm water','Avoid in high Pitta / gastritis'],
['Yograj Guggulu', PLANT,'Niryasa Kalpa (Resin formulation)',COMPOUND,'Purified guggulu + 28 drugs','Tikta, Katu, Kashaya','Laghu, Ruksha, Sara','Ushna','Katu','Vata-Kapha hara','Sharangadhara Samhita','1–2 tablets twice daily','Warm water / Dashamool kwatha','Pregnancy; acute nephritis'],
['Kaishore Guggulu', PLANT,'Niryasa Kalpa (Resin formulation)',COMPOUND,'Guggulu + Guduchi + Triphala','Tikta, Kashaya','Laghu, Ruksha','Ushna','Katu','Pitta-Vata hara; rakta-shodhaka','Sharangadhara Samhita · Bhaishajya Ratnavali','1–2 tablets twice daily','Warm water','Pregnancy'],
['Guggulu', PLANT,'Vriksha (Tree)',SINGLE,'Oleo-gum resin (Niryasa)','Tikta, Katu','Laghu, Ruksha, Vishada, Sara','Ushna','Katu','Tridoshahara, chiefly Kapha-Vata','Charaka Samhita · Sushruta Samhita','500 mg–1 g purified','Warm water','Pregnancy; acute kidney disease'],
['Kanchnar Guggulu', PLANT,'Niryasa Kalpa (Resin formulation)',COMPOUND,'Kanchnara bark + guggulu','Kashaya, Tikta','Laghu, Ruksha','Ushna','Katu','Kapha-Medohara; granthi-hara','Sharangadhara Samhita','1–2 tablets twice daily','Warm water','Pregnancy'],
['Medohar Guggulu', PLANT,'Niryasa Kalpa (Resin formulation)',COMPOUND,'Guggulu + Triphala + Trikatu','Katu, Tikta, Kashaya','Laghu, Ruksha, Tikshna','Ushna','Katu','Kapha-Medohara','Bhaishajya Ratnavali','1–2 tablets twice daily','Warm water / honey water','Emaciation; pregnancy'],
['Ashwagandha', PLANT,'Oshadhi (Herb)',SINGLE,'Root (Mula)','Tikta, Kashaya, Madhura','Laghu, Snigdha','Ushna','Madhura','Vata-Kapha hara; Balya-Rasayana','Charaka Samhita (Balya) · Bhavaprakasha','3–6 g churna','Warm milk','Severe Ama; acute infection'],
['Amalaki', PLANT,'Vriksha (Tree)',SINGLE,'Fruit (Phala)','All but Lavana; chiefly Amla','Laghu, Ruksha, Shita','Shita','Madhura','Tridoshahara; best Vayasthapana','Charaka Samhita (Vayasthapana) · Bhavaprakasha','3–6 g churna','Honey / ghee / water','Acute cold & cough (raw, chilled)'],
['Shatavari', PLANT,'Virudha (Creeper)',SINGLE,'Tuberous root (Mula)','Madhura, Tikta','Guru, Snigdha','Shita','Madhura','Vata-Pitta hara; Stanyajanana','Charaka Samhita · Bhavaprakasha','3–6 g churna','Warm milk','Heavy Kapha; Ama conditions'],
['Guduchi', PLANT,'Virudha (Creeper)',SINGLE,'Stem (Kanda), satva','Tikta, Kashaya','Guru, Snigdha','Ushna','Madhura','Tridoshahara; Rasayana, Jvarahara','Charaka Samhita · Bhavaprakasha','1–3 g satva / 3–6 g churna','Warm water / honey','Caution in constipation'],
['Punarnava', PLANT,'Oshadhi (Herb)',SINGLE,'Whole plant, root','Madhura, Tikta, Kashaya','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Shothahara','Charaka Samhita · Bhavaprakasha','3–6 g churna','Warm water','Dehydration; hypotension'],
['Gokshura', PLANT,'Oshadhi (Herb)',SINGLE,'Fruit, whole plant','Madhura','Guru, Snigdha','Shita','Madhura','Vata-Pitta hara; Mutrala','Charaka Samhita · Bhavaprakasha','3–6 g churna','Milk / warm water','Severe renal failure without supervision'],
['Varuna', PLANT,'Vriksha (Tree)',SINGLE,'Bark (Twak)','Tikta, Kashaya','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Ashmarihara','Sushruta Samhita · Bhavaprakasha','3–6 g churna / 20–40 ml kwatha','Warm water','High Pitta states'],
['Chandraprabha', MIN,'Rasa Dravya (Herbo-mineral)',COMPOUND,'37 drugs incl. Shilajatu & Guggulu','Tikta, Katu, Kashaya','Laghu, Ruksha','Ushna','Katu','Tridoshahara; Mutravaha-shodhaka','Sharangadhara Samhita','1–2 tablets twice daily','Warm water / milk','Pregnancy; monitor in renal disease'],
['Triphala', PLANT,'Vriksha (Tree)',COMPOUND,'Fruits of Amalaki, Bibhitaki, Haritaki','Five rasa (no Lavana)','Laghu, Ruksha','Anushna-shita','Madhura','Tridoshahara; Rasayana','Charaka Samhita · Ashtanga Hridaya','3–6 g churna at night','Warm water / honey','Pregnancy; severe diarrhoea'],
['Haritaki', PLANT,'Vriksha (Tree)',SINGLE,'Fruit (Phala)','Five rasa (no Lavana); chiefly Kashaya','Laghu, Ruksha','Ushna','Madhura','Tridoshahara; Anulomana','Charaka Samhita · Bhavaprakasha','3–6 g churna','Warm water; varies by season','Pregnancy; emaciation; dehydration'],
['Bilva', PLANT,'Vriksha (Tree)',SINGLE,'Unripe fruit, root bark','Kashaya, Tikta','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Grahi','Charaka Samhita · Bhavaprakasha','3–6 g churna','Warm water / buttermilk','Constipation'],
['Trikatu', PLANT,'Oshadhi + Virudha (mixed)',COMPOUND,'Shunthi, Maricha, Pippali','Katu','Laghu, Ruksha, Tikshna','Ushna','Katu','Kapha-Vata hara; Dipana-Pachana','Sharangadhara Samhita','1–3 g churna','Honey / warm water','Hyperacidity; ulcers; pregnancy'],
['Kutaja', PLANT,'Vriksha (Tree)',SINGLE,'Bark, seed (Indrayava)','Tikta, Kashaya','Laghu, Ruksha','Shita','Katu','Kapha-Pitta hara; Atisarahara','Charaka Samhita · Bhavaprakasha','3–6 g churna / 15–30 ml arishta','Buttermilk / warm water','Constipation'],
['Hingvastak', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Hingu + seven digestives','Katu','Laghu, Tikshna, Ruksha','Ushna','Katu','Vata-Kapha hara; Dipana','Bhaishajya Ratnavali','2–4 g with first morsel','Ghee / warm water','Hyperacidity; ulcers'],
['Avipattikar', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Trikatu, Triphala, Musta, Lavanga','Madhura, Katu','Laghu, Ruksha','Shita','Madhura','Pitta hara; Amlapittahara','Sharangadhara Samhita','3–6 g churna','Cold / warm water','Severe Vata constipation'],
['Yashtimadhu', PLANT,'Oshadhi (Herb)',SINGLE,'Root (Mula)','Madhura','Guru, Snigdha','Shita','Madhura','Vata-Pitta hara; Ropana','Charaka Samhita · Bhavaprakasha','2–4 g churna','Milk / honey','Hypertension; oedema; long-term use'],
['Isabgol', PLANT,'Oshadhi (Herb)',SINGLE,'Seed husk (Bija twak)','Madhura, Kashaya','Guru, Snigdha, Picchila','Shita','Madhura','Pitta-Vata hara; Anulomana','Bhavaprakasha Nighantu (later texts)','5–10 g at night','Warm water / milk','Intestinal obstruction; take with ample water'],
['Eranda Taila', PLANT,'Vriksha (Tree)',SINGLE,'Seed oil (Taila)','Madhura, Katu, Kashaya','Guru, Snigdha, Tikshna','Ushna','Madhura','Vata-Kapha hara; Virechana','Charaka Samhita (Virechana) · Sushruta','5–20 ml','Warm milk / Dashamool kwatha','Pregnancy; menstruation; ulcerative colitis'],
['Shankha Bhasma', MIN,'Sudha Varga (Calcareous group)',SINGLE,'Conch shell calx (Bhasma)','Katu, Kashaya','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Amlapittahara','Rasaratna Samuchchaya · Rasatarangini','125–250 mg','Honey / warm water','Only classically prepared bhasma, under supervision'],
['Vasa', PLANT,'Oshadhi (Herb)',SINGLE,'Leaf, root','Tikta, Kashaya','Laghu, Ruksha','Shita','Katu','Kapha-Pitta hara; Raktastambhaka','Charaka Samhita · Bhavaprakasha','10–20 ml svarasa','Honey','Pregnancy (uterine stimulant)'],
['Sitopaladi', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Sita, Vamshalochana, Pippali, Ela, Twak','Madhura, Katu','Laghu, Snigdha','Ushna','Madhura','Kapha-Vata hara; Kasahara','Sharangadhara Samhita','1–3 g with honey','Honey / ghee','Diabetes (sugar base)'],
['Kantakari', PLANT,'Oshadhi (Herb)',SINGLE,'Whole plant, fruit','Tikta, Katu','Laghu, Ruksha, Tikshna','Ushna','Katu','Kapha-Vata hara; Shvasahara','Charaka Samhita (Dashamoola) · Bhavaprakasha','3–6 g churna','Honey / warm water','High Pitta; pregnancy'],
['Talisadi', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Talisapatra, Trikatu, Ela, Twak, Sita','Katu, Madhura','Laghu, Tikshna','Ushna','Katu','Kapha-Vata hara; Dipana-Kasahara','Sharangadhara Samhita','1–3 g churna','Honey','Hyperacidity'],
['Pushkarmool', PLANT,'Oshadhi (Herb)',SINGLE,'Root (Mula)','Tikta, Katu','Laghu, Tikshna','Ushna','Katu','Kapha-Vata hara; Hridya-Shvasahara','Charaka Samhita · Bhavaprakasha','1–3 g churna','Honey / warm water','High Pitta; pregnancy'],
['Tulsi', PLANT,'Oshadhi (Herb)',SINGLE,'Leaf (Patra), seed','Katu, Tikta','Laghu, Ruksha, Tikshna','Ushna','Katu','Kapha-Vata hara; Jvarahara','Bhavaprakasha Nighantu','5–10 ml svarasa / 1–2 g churna','Honey / warm water','Caution with anticoagulants; high Pitta'],
['Haridra', PLANT,'Oshadhi (Herb)',SINGLE,'Rhizome (Kanda)','Tikta, Katu','Laghu, Ruksha','Ushna','Katu','Kapha-Pitta hara; Varnya, Lekhana','Charaka Samhita · Bhavaprakasha','1–3 g churna','Warm milk / honey','Biliary obstruction; before surgery'],
['Manjistha', PLANT,'Virudha (Creeper)',SINGLE,'Root, stem','Madhura, Tikta, Kashaya','Guru, Ruksha','Ushna','Katu','Kapha-Pitta hara; Raktashodhaka','Charaka Samhita · Bhavaprakasha','2–4 g churna','Warm water / milk','Pregnancy (may colour urine)'],
['Neem', PLANT,'Vriksha (Tree)',SINGLE,'Leaf, bark, seed oil','Tikta, Kashaya','Laghu','Shita','Katu','Kapha-Pitta hara; Krimighna','Charaka Samhita · Bhavaprakasha','2–4 g churna','Warm water','Pregnancy; infants; debility'],
['Khadira', PLANT,'Vriksha (Tree)',SINGLE,'Heartwood (Sara)','Tikta, Kashaya','Laghu, Ruksha','Shita','Katu','Kapha-Pitta hara; Kushthaghna','Charaka Samhita (Kushthaghna) · Bhavaprakasha','2–4 g churna / 15–30 ml arishta','Warm water','Severe Vata; dryness'],
['Sariva', PLANT,'Virudha (Creeper)',SINGLE,'Root (Mula)','Madhura, Tikta','Guru, Snigdha','Shita','Madhura','Pitta-Vata hara; Raktashodhaka','Charaka Samhita · Bhavaprakasha','3–6 g churna','Milk / water','Heavy Kapha'],
['Bakuchi', PLANT,'Oshadhi (Herb)',SINGLE,'Seed (Bija), oil','Katu, Tikta','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Kushthaghna, Twachya','Charaka Samhita · Bhavaprakasha','1–3 g churna (internal, supervised)','Milk / warm water','Photosensitivity — avoid sun; liver disease; pregnancy'],
['Brahmi', PLANT,'Oshadhi (Herb)',SINGLE,'Whole plant (Panchanga)','Tikta, Kashaya, Madhura','Laghu, Sara','Shita','Madhura','Tridoshahara; Medhya-Rasayana','Charaka Samhita (Medhya) · Bhavaprakasha','3–6 g churna','Milk / ghee','Bradycardia; heavy Kapha'],
['Jatamansi', PLANT,'Oshadhi (Herb)',SINGLE,'Rhizome (Kanda)','Tikta, Kashaya, Madhura','Laghu, Snigdha','Shita','Katu','Tridoshahara; Nidrajanana','Charaka Samhita · Bhavaprakasha','1–3 g churna','Milk / warm water','Pregnancy; with sedatives'],
['Shankhpushpi', PLANT,'Oshadhi (Herb)',SINGLE,'Whole plant (Panchanga)','Tikta, Kashaya','Snigdha, Picchila','Shita','Madhura','Tridoshahara; Medhya','Charaka Samhita (Medhya) · Bhavaprakasha','3–6 g churna / 10–20 ml syrup','Milk','Hypotension; bradycardia'],
['Tagara', PLANT,'Oshadhi (Herb)',SINGLE,'Rhizome, root','Tikta, Katu, Kashaya','Laghu, Snigdha','Ushna','Katu','Tridoshahara; Nidrajanana','Charaka Samhita · Bhavaprakasha','1–3 g churna','Warm milk','Pregnancy; with sedatives; long-term use'],
['Godanti', MIN,'Dhatu-Upadhatu (Mineral)',SINGLE,'Gypsum calx (Bhasma)','Kashaya, Madhura','Laghu, Ruksha','Shita','Madhura','Pitta hara; Jvarahara, Shirashoolahara','Rasatarangini · Ayurveda Prakasha','125–250 mg','Honey / warm water','Only classically prepared bhasma, under supervision'],
['Pathyadi', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Haritaki, Amalaki, Bibhitaki, Nimba, Haridra','Tikta, Kashaya','Laghu, Ruksha','Shita','Katu','Kapha-Pitta hara; Shirashoolahara','Sahasrayogam · Bhaishajya Ratnavali','15–30 ml kashayam','Warm water','Severe Vata dryness'],
['Shirashooladi', MIN,'Rasa Dravya (Herbo-mineral)',COMPOUND,'Parada, Gandhaka + herbs','Katu, Tikta','Laghu, Tikshna','Ushna','Katu','Vata-Kapha hara; Shirashoolahara','Bhaishajya Ratnavali · Rasayoga Sagara','125–250 mg','Honey / ginger juice','Strictly supervised; pregnancy; children'],
['Sarpagandha', PLANT,'Oshadhi (Herb)',SINGLE,'Root (Mula)','Tikta, Katu','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Nidrajanana, Raktachapahara','Bhavaprakasha Nighantu · Rasa texts','125–500 mg','Warm water / milk','Depression; pregnancy; bradycardia — supervise'],
['Arjuna', PLANT,'Vriksha (Tree)',SINGLE,'Bark (Twak)','Kashaya','Laghu, Ruksha','Shita','Katu','Kapha-Pitta hara; Hridya','Charaka Samhita · Bhavaprakasha','3–6 g churna / 15–30 ml arishta','Milk / warm water','Severe Vata; monitor with cardiac drugs'],
['Meshashringi (Gymnema)', PLANT,'Virudha (Creeper)',SINGLE,'Leaf (Patra)','Tikta, Kashaya','Laghu, Ruksha','Ushna','Katu','Kapha-Vata hara; Madhumehahara','Bhavaprakasha Nighantu','2–4 g churna','Warm water','Monitor glucose with hypoglycaemics'],
['Methi', PLANT,'Oshadhi (Herb)',SINGLE,'Seed (Bija)','Tikta, Katu','Laghu, Snigdha','Ushna','Katu','Kapha-Vata hara; Dipana','Bhavaprakasha Nighantu','2–5 g churna','Warm water','Pregnancy in large doses; monitor glucose'],
['Nisha Amalaki', PLANT,'Oshadhi Kalpa (Herb formulation)',COMPOUND,'Haridra + Amalaki','Tikta, Katu, Amla','Laghu, Ruksha','Anushna-shita','Katu','Kapha-Pitta hara; Madhumehahara','Bhaishajya Ratnavali · Sahasrayogam','3–6 g churna','Warm water','Monitor glucose with hypoglycaemics'],
];

(async () => {
  try {
    console.log('→ Schema');
    let added = 0;
    for (const [c, d] of [
      ['source_type','VARCHAR(80) NULL'], ['source_subtype','VARCHAR(100) NULL'],
      ['preparation_class','VARCHAR(60) NULL'], ['part_used','VARCHAR(180) NULL'],
      ['rasa','VARCHAR(160) NULL'], ['guna','VARCHAR(160) NULL'],
      ['virya','VARCHAR(60) NULL'], ['vipaka','VARCHAR(60) NULL'],
      ['dosha_effect','VARCHAR(180) NULL'], ['classical_reference','VARCHAR(200) NULL'],
      ['dosage','VARCHAR(160) NULL'], ['anupana','VARCHAR(160) NULL'],
      ['contraindications','VARCHAR(255) NULL'],
    ]) added += await addColumn('Drugs', c, d);
    console.log(`   ${added} column(s) added`);
    for (const [name, idx] of [['idx_drugs_source','source_type'], ['idx_drugs_prep','preparation_class']]) {
      const [r] = await db.query(
        `SELECT COUNT(*) c FROM information_schema.statistics
          WHERE table_schema=DATABASE() AND table_name='Drugs' AND index_name=?`, [name]);
      if (r[0].c === 0) await db.query(`CREATE INDEX ${name} ON Drugs (${idx})`);
    }

    console.log('→ Materia Medica entries');
    let n = 0; const missing = [];
    for (const row of M) {
      const [name, st, sub, prep, part, rasa, guna, virya, vipaka, dosha, ref, dose, anu, ci] = row;
      const [r] = await db.query(
        `UPDATE Drugs SET source_type=?, source_subtype=?, preparation_class=?, part_used=?,
                          rasa=?, guna=?, virya=?, vipaka=?, dosha_effect=?,
                          classical_reference=?, dosage=?, anupana=?, contraindications=?
          WHERE name=?`,
        [st, sub, prep, part, rasa, guna, virya, vipaka, dosha, ref, dose, anu, ci, name]);
      if (r.affectedRows) n++; else missing.push(name);
    }
    const [[{ t }]] = await db.query('SELECT COUNT(*) t FROM Drugs WHERE source_type IS NULL AND is_active=1');
    console.log(`   ${n} entries written; ${t} drug(s) still unclassified`);
    if (missing.length) console.log(`   ⚠ no Drugs row for: ${missing.join(', ')}`);

    console.log('\n✅ Materia Medica seeded.\n');
    process.exit(0);
  } catch (err) { console.error('\n❌ Failed:', err.message); process.exit(1); }
})();
