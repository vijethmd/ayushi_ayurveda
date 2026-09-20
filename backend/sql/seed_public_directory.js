/**
 * Public directory: schema migration + India-specific sample data.
 * ---------------------------------------------------------------
 * Powers the public landing-page search:
 *    Doctors   → by speciality | by area
 *    Medicines → by generic name | by brand name | by manufacturer
 *
 * Adds:
 *   Users  → clinic_name, area, city, state, consultation_fee, languages
 *   Drugs  → generic_name, botanical_name, dosage_form
 *   Medicine_Brands (new) → brand_name + manufacturer per generic formulation
 *
 * The manufacturers and brands below are real Indian Ayurvedic companies and
 * their well-known products. Pack sizes and MRPs are indicative sample values,
 * not a live price list.
 *
 * Idempotent — safe to re-run.  Run: node backend/sql/seed_public_directory.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

// ── 1. Schema ────────────────────────────────────────────────────────────────
const addColumn = async (table, column, ddl) => {
  const [r] = await db.query(
    `SELECT COUNT(*) c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (r[0].c === 0) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    console.log(`   + ${table}.${column}`);
  }
};

async function migrate() {
  console.log('→ Schema');
  await addColumn('Users', 'clinic_name',      'VARCHAR(180) NULL');
  await addColumn('Users', 'area',             'VARCHAR(120) NULL');
  await addColumn('Users', 'city',             'VARCHAR(100) NULL');
  await addColumn('Users', 'state',            'VARCHAR(100) NULL');
  await addColumn('Users', 'consultation_fee', 'INT NULL');
  await addColumn('Users', 'languages',        'VARCHAR(200) NULL');

  await addColumn('Drugs', 'generic_name',   'VARCHAR(180) NULL');
  await addColumn('Drugs', 'botanical_name', 'VARCHAR(180) NULL');
  await addColumn('Drugs', 'dosage_form',    'VARCHAR(80) NULL');

  await db.query(`
    CREATE TABLE IF NOT EXISTS Medicine_Brands (
      brand_id     INT AUTO_INCREMENT PRIMARY KEY,
      drug_id      INT NOT NULL,
      brand_name   VARCHAR(180) NOT NULL,
      manufacturer VARCHAR(180) NOT NULL,
      dosage_form  VARCHAR(80)  NULL,
      pack_size    VARCHAR(80)  NULL,
      mrp          DECIMAL(10,2) NULL,
      is_active    TINYINT(1) DEFAULT 1,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_brand (brand_name, manufacturer),
      KEY idx_brand_name (brand_name),
      KEY idx_manufacturer (manufacturer),
      CONSTRAINT fk_brand_drug FOREIGN KEY (drug_id) REFERENCES Drugs(drug_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  console.log('   + Medicine_Brands');

  // Indexes used by the public search
  const idx = async (table, name, cols) => {
    const [r] = await db.query(
      `SELECT COUNT(*) c FROM information_schema.statistics
        WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`, [table, name]);
    if (r[0].c === 0) await db.query(`CREATE INDEX ${name} ON ${table} (${cols})`);
  };
  await idx('Users', 'idx_users_area', 'area');
  await idx('Users', 'idx_users_city', 'city');
  await idx('Drugs', 'idx_drugs_generic', 'generic_name');
}

// ── 2. Doctors: clinic + locality across Indian cities ───────────────────────
const DOCTORS = [
  // name                  clinic                              area                 city               state            fee  languages
  ['Dr. Priya Nair',       'Punarjani Ayurveda Centre',        'Kadavanthra',       'Kochi',           'Kerala',        500, 'Malayalam, English, Hindi'],
  ['Dr. Arun Kumar',       'Sanjeevani Ayurveda Clinic',       'Jayanagar',         'Bengaluru',       'Karnataka',     450, 'Kannada, English, Hindi'],
  ['Dr. Meenakshi Iyer',   'Aayush Neuro Ayurveda',            'Mylapore',          'Chennai',         'Tamil Nadu',    600, 'Tamil, English'],
  ['Dr. Vikram Reddy',     'Charaka Skin & Ayurveda',          'Banjara Hills',     'Hyderabad',       'Telangana',     700, 'Telugu, Hindi, English'],
  ['Dr. Kavitha Menon',    'Vaidyaratnam Breath Care',         'Edappally',         'Kochi',           'Kerala',        500, 'Malayalam, English'],
  ['Dr. Suresh Pillai',    'Hridaya Ayurveda Hospital',        'Kowdiar',           'Thiruvananthapuram','Kerala',      800, 'Malayalam, Tamil, English'],
  ['Dr. Ananya Singh',     'Stree Ayurveda Wellness',          'Gomti Nagar',       'Lucknow',         'Uttar Pradesh', 550, 'Hindi, English'],
  ['Dr. Ramesh Patil',     'Dhanvantari Ayurveda Kendra',      'Kothrud',           'Pune',            'Maharashtra',   600, 'Marathi, Hindi, English'],
  ['Dr. Lakshmi Devi',     'Bala Ayurveda Child Care',         'Basavanagudi',      'Bengaluru',       'Karnataka',     400, 'Kannada, Telugu, English'],
  ['Dr. Mohan Das',        'Kottakkal Panchakarma Centre',     'Kottakkal',         'Malappuram',      'Kerala',        900, 'Malayalam, English, Hindi'],
  ['Dr. Shanti Krishnan',  'Netra Jyothi Ayurveda',            'T. Nagar',          'Chennai',         'Tamil Nadu',    550, 'Tamil, English'],
  ['Dr. Ganesh Rao',       'Shravan ENT Ayurveda',             'Malleshwaram',      'Bengaluru',       'Karnataka',     500, 'Kannada, Konkani, English'],
  ['Dr. Radha Varma',      'Mutra Ayurveda Clinic',            'Vaishali Nagar',    'Jaipur',          'Rajasthan',     450, 'Hindi, English'],
  ['Dr. Deepak Joshi',     'Yakrit Ayurveda Liver Care',       'Navrangpura',       'Ahmedabad',       'Gujarat',       650, 'Gujarati, Hindi, English'],
  ['Dr. Usha Nambiar',     'Manas Ayurveda Wellness',          'Indiranagar',       'Bengaluru',       'Karnataka',     750, 'Malayalam, English, Kannada'],
  ['Dr. Harish Bhat',      'Jara Geriatric Ayurveda',          'Vijayanagar',       'Mysuru',          'Karnataka',     400, 'Kannada, Tulu, English'],
  ['Dr. Sujatha Nair',     'Medohara Weight Clinic',           'Adyar',             'Chennai',         'Tamil Nadu',    500, 'Tamil, Malayalam, English'],
  ['Dr. Balakrishnan',     'Shuddhi Detox Ayurveda',           'Ollur',             'Thrissur',        'Kerala',        700, 'Malayalam, English'],
  ['Dr. Parvati Iyer',     'Prana Allergy & Ayurveda',         'Dadar West',        'Mumbai',          'Maharashtra',   650, 'Marathi, Tamil, Hindi, English'],
  ['Dr. Narayanan',        'Marma Sports Ayurveda',            'HSR Layout',        'Bengaluru',       'Karnataka',     800, 'Malayalam, English, Kannada'],
  ['Dr. Geetha Pillai',    'Kesha Ayurveda Trichology',        'Anna Nagar',        'Chennai',         'Tamil Nadu',    500, 'Tamil, Malayalam, English'],
  ['Dr. Sathish Kumar',    'Aarogya Chronic Care Ayurveda',    'Koramangala',       'Bengaluru',       'Karnataka',     600, 'Kannada, Tamil, English'],
  ['Dr. Mythili Rajan',    'Sutika Mother & Child Ayurveda',   'R. S. Puram',       'Coimbatore',      'Tamil Nadu',    550, 'Tamil, English'],
  ['Dr. Chandrasekhar',    'Ojas Immunity Ayurveda',           'Salt Lake',         'Kolkata',         'West Bengal',   600, 'Bengali, Hindi, English'],
  ['Dr. Vasantha Devi',    'Madhumeha Ayurveda Centre',        'Kukatpally',        'Hyderabad',       'Telangana',     500, 'Telugu, Hindi, English'],
  ['Vijeth M D',           'AYUSHI Ayurvedic Clinic',          'Basaveshwaranagar', 'Bengaluru',       'Karnataka',     300, 'Kannada, Hindi, English'],
];

async function seedDoctors() {
  console.log('→ Doctors');
  let n = 0;
  for (const [name, clinic, area, city, state, fee, langs] of DOCTORS) {
    const [r] = await db.query(
      `UPDATE Users SET clinic_name=?, area=?, city=?, state=?, consultation_fee=?, languages=?
        WHERE name=? AND role='doctor'`,
      [clinic, area, city, state, fee, langs, name]
    );
    n += r.affectedRows;
  }
  console.log(`   ${n} doctors located across ${new Set(DOCTORS.map(d => d[4])).size} states`);
}

// ── 3. Medicines: generic formulation → Indian brands & manufacturers ────────
// [ drug name in Drugs, generic/classical name, botanical source, default form,
//   [ [brand, manufacturer, form, pack, MRP ₹], … ] ]
const MEDICINES = [
  ['Shallaki', 'Shallaki (Boswellia)', 'Boswellia serrata', 'Tablet', [
    ['Himalaya Shallaki Tablets',      'Himalaya Wellness Company',            'Tablet',   '60 tablets',  190],
    ['Rumalaya Forte',                 'Himalaya Wellness Company',            'Tablet',   '60 tablets',  235],
    ['Baidyanath Shallaki Capsules',   'Shree Baidyanath Ayurved Bhawan',      'Capsule',  '60 capsules', 240],
    ['Organic India Joint Care',       'Organic India Pvt. Ltd.',              'Capsule',  '60 capsules', 310],
  ]],
  ['Rasna', 'Rasnadi Yoga', 'Pluchea lanceolata', 'Churna', [
    ['Kottakkal Rasnadi Churnam',      'Arya Vaidya Sala, Kottakkal',          'Churna',   '100 g',       165],
    ['Rasnadi Kashayam',               'Kerala Ayurveda Ltd.',                 'Kashayam', '200 ml',      190],
    ['AVP Rasnasapthakam Kashayam',    'The Arya Vaidya Pharmacy, Coimbatore', 'Kashayam', '200 ml',      180],
  ]],
  ['Dashamool', 'Dashamoolarishta', 'Ten-root polyherbal decoction', 'Arishta', [
    ['Dabur Dashmularishta',           'Dabur India Ltd.',                     'Arishta',  '450 ml',      175],
    ['Baidyanath Dashmularishta',      'Shree Baidyanath Ayurved Bhawan',      'Arishta',  '450 ml',      165],
    ['Kottakkal Dasamoolarishtam',     'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      190],
    ['Divya Dashmoolarishta',          'Patanjali Ayurved Ltd.',               'Arishta',  '450 ml',      130],
  ]],
  ['Yograj Guggulu', 'Yogaraja Guggulu', 'Commiphora wightii polyherbal', 'Tablet', [
    ['Dhootapapeshwar Yogaraj Guggul', 'Shree Dhootapapeshwar Ltd.',           'Tablet',   '60 tablets',  205],
    ['Baidyanath Yograj Guggulu',      'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  185],
    ['Kottakkal Yogaraja Gulika',      'Arya Vaidya Sala, Kottakkal',          'Gulika',   '100 tablets', 220],
    ['Divya Yograj Guggulu',           'Patanjali Ayurved Ltd.',               'Tablet',   '80 tablets',  140],
  ]],
  ['Kaishore Guggulu', 'Kaishora Guggulu', 'Commiphora wightii with Guduchi', 'Tablet', [
    ['Dhootapapeshwar Kaishore Guggul','Shree Dhootapapeshwar Ltd.',           'Tablet',   '60 tablets',  215],
    ['Baidyanath Kaishore Guggulu',    'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  190],
    ['Kerala Ayurveda Kaishore Guggulu','Kerala Ayurveda Ltd.',                'Tablet',   '100 tablets', 260],
  ]],
  ['Guggulu', 'Shuddha Guggulu', 'Commiphora wightii', 'Tablet', [
    ['Himalaya Guggul Tablets',        'Himalaya Wellness Company',            'Tablet',   '60 tablets',  185],
    ['Baidyanath Shuddha Guggulu',     'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  155],
    ['Sandu Guggul',                   'Sandu Pharmaceuticals Ltd.',           'Tablet',   '60 tablets',  170],
  ]],
  ['Kanchnar Guggulu', 'Kanchanara Guggulu', 'Bauhinia variegata polyherbal', 'Tablet', [
    ['Dhootapapeshwar Kanchnar Guggul','Shree Dhootapapeshwar Ltd.',           'Tablet',   '60 tablets',  210],
    ['Baidyanath Kanchnar Guggulu',    'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  180],
    ['Divya Kanchnar Guggulu',         'Patanjali Ayurved Ltd.',               'Tablet',   '80 tablets',  135],
  ]],
  ['Medohar Guggulu', 'Medohara Guggulu', 'Commiphora wightii with Triphala', 'Tablet', [
    ['Baidyanath Medohar Guggulu',     'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  175],
    ['Divya Medohar Vati',             'Patanjali Ayurved Ltd.',               'Vati',     '50 g',        120],
    ['Dhootapapeshwar Medohar Guggul', 'Shree Dhootapapeshwar Ltd.',           'Tablet',   '60 tablets',  200],
  ]],
  ['Ashwagandha', 'Ashwagandha', 'Withania somnifera', 'Churna', [
    ['Himalaya Ashvagandha Tablets',   'Himalaya Wellness Company',            'Tablet',   '60 tablets',  195],
    ['Dabur Ashwagandha Churna',       'Dabur India Ltd.',                     'Churna',   '100 g',       150],
    ['Organic India Ashwagandha',      'Organic India Pvt. Ltd.',              'Capsule',  '60 capsules', 325],
    ['Divya Ashwagandha Churna',       'Patanjali Ayurved Ltd.',               'Churna',   '100 g',       105],
    ['Kottakkal Ashwagandhadi Lehyam', 'Arya Vaidya Sala, Kottakkal',          'Lehyam',   '500 g',       385],
    ['Zandu Vigorex',                  'Emami Ltd. (Zandu)',                   'Capsule',  '20 capsules', 275],
  ]],
  ['Amalaki', 'Amalaki (Amla)', 'Phyllanthus emblica', 'Churna', [
    ['Dabur Chyawanprash',             'Dabur India Ltd.',                     'Avaleha',  '1 kg',        515],
    ['Baidyanath Chyawanprash Special','Shree Baidyanath Ayurved Bhawan',      'Avaleha',  '1 kg',        430],
    ['Zandu Kesari Jivan',             'Emami Ltd. (Zandu)',                   'Avaleha',  '900 g',       445],
    ['Himalaya Amalaki Tablets',       'Himalaya Wellness Company',            'Tablet',   '60 tablets',  170],
    ['Patanjali Amla Juice',           'Patanjali Ayurved Ltd.',               'Juice',    '1 litre',     140],
  ]],
  ['Shatavari', 'Shatavari', 'Asparagus racemosus', 'Churna', [
    ['Dhootapapeshwar Shatavari Kalpa','Shree Dhootapapeshwar Ltd.',           'Granules', '350 g',       390],
    ['Himalaya Shatavari Tablets',     'Himalaya Wellness Company',            'Tablet',   '60 tablets',  185],
    ['Baidyanath Shatavari Churna',    'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       160],
    ['Kottakkal Shatavari Gulam',      'Arya Vaidya Sala, Kottakkal',          'Lehyam',   '500 g',       360],
  ]],
  ['Guduchi', 'Guduchi (Giloy)', 'Tinospora cordifolia', 'Ghanvati', [
    ['Divya Giloy Ghanvati',           'Patanjali Ayurved Ltd.',               'Ghanvati', '60 tablets',   95],
    ['Dabur Giloy Ghanvati',           'Dabur India Ltd.',                     'Ghanvati', '60 tablets',  145],
    ['Himalaya Guduchi Tablets',       'Himalaya Wellness Company',            'Tablet',   '60 tablets',  175],
    ['Baidyanath Giloy Ghanvati',      'Shree Baidyanath Ayurved Bhawan',      'Ghanvati', '50 tablets',  130],
  ]],
  ['Punarnava', 'Punarnava', 'Boerhavia diffusa', 'Tablet', [
    ['Himalaya Punarnava Tablets',     'Himalaya Wellness Company',            'Tablet',   '60 tablets',  180],
    ['Baidyanath Punarnavadi Mandur',  'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  165],
    ['Dhootapapeshwar Punarnavadi Mandur','Shree Dhootapapeshwar Ltd.',        'Tablet',   '60 tablets',  195],
    ['Punarnavadi Kashayam',           'Kerala Ayurveda Ltd.',                 'Kashayam', '200 ml',      185],
  ]],
  ['Gokshura', 'Gokshura', 'Tribulus terrestris', 'Tablet', [
    ['Himalaya Gokshura Tablets',      'Himalaya Wellness Company',            'Tablet',   '60 tablets',  190],
    ['Dabur Gokshuradi Guggulu',       'Dabur India Ltd.',                     'Tablet',   '80 tablets',  175],
    ['Baidyanath Gokshuradi Guggulu',  'Shree Baidyanath Ayurved Bhawan',      'Tablet',   '80 tablets',  160],
  ]],
  ['Varuna', 'Varuna', 'Crataeva nurvala', 'Kashayam', [
    ['Himalaya Cystone',               'Himalaya Wellness Company',            'Tablet',   '100 tablets', 215],
    ['Charak Calcury',                 'Charak Pharma Pvt. Ltd.',              'Tablet',   '60 tablets',  245],
    ['Neeri Tablets',                  'Aimil Pharmaceuticals (India) Ltd.',   'Tablet',   '60 tablets',  290],
    ['Kottakkal Varanadi Kashayam',    'Arya Vaidya Sala, Kottakkal',          'Kashayam', '200 ml',      185],
  ]],
  ['Chandraprabha', 'Chandraprabha Vati', 'Polyherbal-mineral formulation', 'Vati', [
    ['Dhootapapeshwar Chandraprabha Vati','Shree Dhootapapeshwar Ltd.',        'Vati',     '60 tablets',  225],
    ['Baidyanath Chandraprabha Vati',  'Shree Baidyanath Ayurved Bhawan',      'Vati',     '80 tablets',  185],
    ['Divya Chandraprabha Vati',       'Patanjali Ayurved Ltd.',               'Vati',     '80 tablets',  140],
  ]],
  ['Triphala', 'Triphala', 'Amalaki + Bibhitaki + Haritaki', 'Churna', [
    ['Dabur Triphala Churna',          'Dabur India Ltd.',                     'Churna',   '120 g',       140],
    ['Baidyanath Triphala Churna',     'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       120],
    ['Himalaya Triphala Tablets',      'Himalaya Wellness Company',            'Tablet',   '60 tablets',  165],
    ['Organic India Triphala',         'Organic India Pvt. Ltd.',              'Capsule',  '60 capsules', 290],
    ['Divya Triphala Churna',          'Patanjali Ayurved Ltd.',               'Churna',   '100 g',        85],
  ]],
  ['Haritaki', 'Haritaki (Abhaya)', 'Terminalia chebula', 'Churna', [
    ['Baidyanath Haritaki Churna',     'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       115],
    ['Dabur Abhayarishta',             'Dabur India Ltd.',                     'Arishta',  '450 ml',      160],
    ['Kottakkal Abhayarishtam',        'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      175],
    ['Patanjali Harad Churna',         'Patanjali Ayurved Ltd.',               'Churna',   '100 g',        80],
  ]],
  ['Bilva', 'Bilva', 'Aegle marmelos', 'Gulika', [
    ['Baidyanath Bilvadi Churna',      'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       130],
    ['Kottakkal Bilwadi Gulika',       'Arya Vaidya Sala, Kottakkal',          'Gulika',   '100 tablets', 195],
    ['Kerala Ayurveda Bilwadi Gulika', 'Kerala Ayurveda Ltd.',                 'Gulika',   '100 tablets', 225],
  ]],
  ['Trikatu', 'Trikatu', 'Pippali + Maricha + Shunthi', 'Churna', [
    ['Baidyanath Trikatu Churna',      'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       125],
    ['Himalaya Trikatu Tablets',       'Himalaya Wellness Company',            'Tablet',   '60 tablets',  170],
    ['Unjha Trikatu Churna',           'Unjha Ayurvedic Pharmacy',             'Churna',   '100 g',       110],
  ]],
  ['Kutaja', 'Kutaja', 'Holarrhena antidysenterica', 'Arishta', [
    ['Baidyanath Kutajarishta',        'Shree Baidyanath Ayurved Bhawan',      'Arishta',  '450 ml',      155],
    ['Dabur Kutajarishta',             'Dabur India Ltd.',                     'Arishta',  '450 ml',      170],
    ['Kottakkal Kutajarishtam',        'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      180],
    ['Dhootapapeshwar Kutaj Ghanvati', 'Shree Dhootapapeshwar Ltd.',           'Ghanvati', '60 tablets',  210],
  ]],
  ['Hingvastak', 'Hingvastaka Churna', 'Asafoetida polyherbal', 'Churna', [
    ['Baidyanath Hingvastak Churna',   'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       130],
    ['Dhootapapeshwar Hingvashtak Churna','Shree Dhootapapeshwar Ltd.',        'Churna',   '60 g',        165],
    ['Dabur Hajmola',                  'Dabur India Ltd.',                     'Tablet',   '120 tablets',  60],
  ]],
  ['Avipattikar', 'Avipattikara Churna', 'Polyherbal antacid formulation', 'Churna', [
    ['Baidyanath Avipattikar Churna',  'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       140],
    ['Dhootapapeshwar Avipattikar Churna','Shree Dhootapapeshwar Ltd.',        'Churna',   '60 g',        175],
    ['Divya Avipattikar Churna',       'Patanjali Ayurved Ltd.',               'Churna',   '100 g',        95],
  ]],
  ['Yashtimadhu', 'Yashtimadhu (Mulethi)', 'Glycyrrhiza glabra', 'Churna', [
    ['Himalaya Yashtimadhu Tablets',   'Himalaya Wellness Company',            'Tablet',   '60 tablets',  175],
    ['Baidyanath Yashtimadhu Churna',  'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       135],
    ['Dabur Mulethi Churna',           'Dabur India Ltd.',                     'Churna',   '100 g',       150],
  ]],
  ['Isabgol', 'Isabgol (Psyllium Husk)', 'Plantago ovata', 'Husk', [
    ['Telephone Brand Sat-Isabgol',    'Sidpur Sat-Isabgol Factory',           'Husk',     '200 g',       220],
    ['Dabur Nature Care Isabgol',      'Dabur India Ltd.',                     'Granules', '100 g',       165],
    ['Patanjali Isabgol Husk',         'Patanjali Ayurved Ltd.',               'Husk',     '200 g',       185],
  ]],
  ['Eranda Taila', 'Eranda Taila (Castor Oil)', 'Ricinus communis', 'Taila', [
    ['Baidyanath Arandi Tail',         'Shree Baidyanath Ayurved Bhawan',      'Taila',    '200 ml',      145],
    ['Dabur Castor Oil',               'Dabur India Ltd.',                     'Taila',    '200 ml',      155],
    ['Kottakkal Gandharvahastadi Kashayam','Arya Vaidya Sala, Kottakkal',      'Kashayam', '200 ml',      185],
  ]],
  ['Shankha Bhasma', 'Shankha Bhasma', 'Conch shell calx', 'Bhasma', [
    ['Dhootapapeshwar Shankh Bhasma',  'Shree Dhootapapeshwar Ltd.',           'Bhasma',   '10 g',        195],
    ['Baidyanath Shankh Bhasma',       'Shree Baidyanath Ayurved Bhawan',      'Bhasma',   '10 g',        165],
    ['Unjha Shankh Vati',              'Unjha Ayurvedic Pharmacy',             'Vati',     '60 tablets',  130],
  ]],
  ['Vasa', 'Vasa (Adulsa)', 'Adhatoda vasica', 'Avaleha', [
    ['Dabur Vasavaleha',               'Dabur India Ltd.',                     'Avaleha',  '250 g',       195],
    ['Baidyanath Vasavaleha',          'Shree Baidyanath Ayurved Bhawan',      'Avaleha',  '250 g',       175],
    ['Himalaya Koflet Syrup',          'Himalaya Wellness Company',            'Syrup',    '100 ml',      115],
    ['Kottakkal Vasarishtam',          'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      180],
  ]],
  ['Sitopaladi', 'Sitopaladi Churna', 'Vamshalochana polyherbal', 'Churna', [
    ['Baidyanath Sitopaladi Churna',   'Shree Baidyanath Ayurved Bhawan',      'Churna',   '60 g',        135],
    ['Dabur Sitopaladi Churna',        'Dabur India Ltd.',                     'Churna',   '60 g',        150],
    ['Dhootapapeshwar Sitopaladi Churna','Shree Dhootapapeshwar Ltd.',         'Churna',   '60 g',        170],
    ['Divya Sitopaladi Churna',        'Patanjali Ayurved Ltd.',               'Churna',   '100 g',       100],
  ]],
  ['Kantakari', 'Kantakari', 'Solanum xanthocarpum', 'Avaleha', [
    ['Baidyanath Kantakari Avaleha',   'Shree Baidyanath Ayurved Bhawan',      'Avaleha',  '250 g',       185],
    ['Kottakkal Kantakaryavaleham',    'Arya Vaidya Sala, Kottakkal',          'Avaleha',  '500 g',       320],
    ['Dabur Honitus Syrup',            'Dabur India Ltd.',                     'Syrup',    '100 ml',      105],
  ]],
  ['Talisadi', 'Talisadi Churna', 'Abies webbiana polyherbal', 'Churna', [
    ['Baidyanath Talisadi Churna',     'Shree Baidyanath Ayurved Bhawan',      'Churna',   '60 g',        130],
    ['Dhootapapeshwar Talisadi Churna','Shree Dhootapapeshwar Ltd.',           'Churna',   '60 g',        165],
    ['Unjha Talisadi Churna',          'Unjha Ayurvedic Pharmacy',             'Churna',   '100 g',       120],
  ]],
  ['Pushkarmool', 'Pushkaramoola', 'Inula racemosa', 'Churna', [
    ['Dhootapapeshwar Pushkarmool Churna','Shree Dhootapapeshwar Ltd.',        'Churna',   '60 g',        185],
    ['Baidyanath Pushkarmool Churna',  'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       155],
    ['Maharishi Pushkarmool',          'Maharishi Ayurveda Products Pvt. Ltd.','Tablet',   '60 tablets',  230],
  ]],
  ['Tulsi', 'Tulsi (Holy Basil)', 'Ocimum sanctum', 'Drops', [
    ['Organic India Tulsi Green Tea',  'Organic India Pvt. Ltd.',              'Tea',      '100 g',       275],
    ['Dabur Tulsi Drops',              'Dabur India Ltd.',                     'Drops',    '30 ml',       165],
    ['Himalaya Tulasi Tablets',        'Himalaya Wellness Company',            'Tablet',   '60 tablets',  170],
    ['Divya Tulsi Ghanvati',           'Patanjali Ayurved Ltd.',               'Ghanvati', '60 tablets',   90],
    ['Zandu Tulsi Ark',                'Emami Ltd. (Zandu)',                   'Drops',    '30 ml',       150],
  ]],
  ['Haridra', 'Haridra (Turmeric)', 'Curcuma longa', 'Tablet', [
    ['Himalaya Haridra Tablets',       'Himalaya Wellness Company',            'Tablet',   '60 tablets',  180],
    ['Baidyanath Haridra Khand',       'Shree Baidyanath Ayurved Bhawan',      'Granules', '100 g',       165],
    ['Dabur Haridra Khand',            'Dabur India Ltd.',                     'Granules', '100 g',       180],
    ['Divya Haridra Khand',            'Patanjali Ayurved Ltd.',               'Granules', '100 g',       125],
  ]],
  ['Manjistha', 'Manjistha', 'Rubia cordifolia', 'Tablet', [
    ['Himalaya Manjishtha Tablets',    'Himalaya Wellness Company',            'Tablet',   '60 tablets',  185],
    ['Himalaya Purim',                 'Himalaya Wellness Company',            'Tablet',   '60 tablets',  195],
    ['Baidyanath Manjishthadi Kwath',  'Shree Baidyanath Ayurved Bhawan',      'Kwath',    '100 g',       155],
    ['Kottakkal Manjishtadi Kashayam', 'Arya Vaidya Sala, Kottakkal',          'Kashayam', '200 ml',      190],
  ]],
  ['Neem', 'Nimba (Neem)', 'Azadirachta indica', 'Tablet', [
    ['Himalaya Neem Tablets',          'Himalaya Wellness Company',            'Tablet',   '60 tablets',  165],
    ['Dabur Panchnimba Churna',        'Dabur India Ltd.',                     'Churna',   '100 g',       155],
    ['Baidyanath Nimbadi Churna',      'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       140],
    ['Divya Neem Ghanvati',            'Patanjali Ayurved Ltd.',               'Ghanvati', '60 tablets',   95],
  ]],
  ['Khadira', 'Khadira', 'Acacia catechu', 'Arishta', [
    ['Baidyanath Khadirarishta',       'Shree Baidyanath Ayurved Bhawan',      'Arishta',  '450 ml',      160],
    ['Dabur Khadirarishta',            'Dabur India Ltd.',                     'Arishta',  '450 ml',      175],
    ['Kottakkal Khadirarishtam',       'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      185],
  ]],
  ['Sariva', 'Sariva (Anantmool)', 'Hemidesmus indicus', 'Asava', [
    ['Baidyanath Sarivadyasava',       'Shree Baidyanath Ayurved Bhawan',      'Asava',    '450 ml',      165],
    ['Kottakkal Sarivadyasavam',       'Arya Vaidya Sala, Kottakkal',          'Asava',    '435 ml',      180],
    ['Dabur Sarivadyasava',            'Dabur India Ltd.',                     'Asava',    '450 ml',      175],
  ]],
  ['Bakuchi', 'Bakuchi', 'Psoralea corylifolia', 'Taila', [
    ['Baidyanath Bakuchi Churna',      'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       170],
    ['Lukoskin Ointment',              'Aimil Pharmaceuticals (India) Ltd.',   'Ointment', '50 g',        640],
    ['Dhootapapeshwar Bakuchi Taila',  'Shree Dhootapapeshwar Ltd.',           'Taila',    '100 ml',      210],
  ]],
  ['Brahmi', 'Brahmi', 'Bacopa monnieri', 'Tablet', [
    ['Himalaya Brahmi Tablets',        'Himalaya Wellness Company',            'Tablet',   '60 tablets',  180],
    ['Himalaya Mentat',                'Himalaya Wellness Company',            'Tablet',   '60 tablets',  210],
    ['Baidyanath Brahmi Vati',         'Shree Baidyanath Ayurved Bhawan',      'Vati',     '40 tablets',  195],
    ['Kottakkal Brahmi Ghritam',       'Arya Vaidya Sala, Kottakkal',          'Ghrita',   '150 ml',      285],
    ['Divya Medha Vati',               'Patanjali Ayurved Ltd.',               'Vati',     '120 tablets', 235],
  ]],
  ['Jatamansi', 'Jatamansi', 'Nardostachys jatamansi', 'Churna', [
    ['Baidyanath Jatamansi Churna',    'Shree Baidyanath Ayurved Bhawan',      'Churna',   '50 g',        210],
    ['Kottakkal Manasamitra Vatakam',  'Arya Vaidya Sala, Kottakkal',          'Vatakam',  '100 tablets', 640],
    ['Dhootapapeshwar Jatamansi Churna','Shree Dhootapapeshwar Ltd.',          'Churna',   '50 g',        245],
  ]],
  ['Shankhpushpi', 'Shankhapushpi', 'Convolvulus pluricaulis', 'Syrup', [
    ['Baidyanath Shankhpushpi Syrup',  'Shree Baidyanath Ayurved Bhawan',      'Syrup',    '450 ml',      185],
    ['Sandu Shankhapushpi Syrup',      'Sandu Pharmaceuticals Ltd.',           'Syrup',    '200 ml',      165],
    ['Unjha Shankhpushpi Churna',      'Unjha Ayurvedic Pharmacy',             'Churna',   '100 g',       140],
  ]],
  ['Tagara', 'Tagara', 'Valeriana wallichii', 'Tablet', [
    ['Himalaya Tagara Tablets',        'Himalaya Wellness Company',            'Tablet',   '60 tablets',  185],
    ['Baidyanath Tagara Churna',       'Shree Baidyanath Ayurved Bhawan',      'Churna',   '50 g',        190],
    ['Dhootapapeshwar Tagaradi Kashaya','Shree Dhootapapeshwar Ltd.',          'Kashayam', '200 ml',      215],
  ]],
  ['Godanti', 'Godanti Bhasma', 'Gypsum calx', 'Bhasma', [
    ['Baidyanath Godanti Bhasma',      'Shree Baidyanath Ayurved Bhawan',      'Bhasma',   '10 g',        120],
    ['Dhootapapeshwar Godanti Bhasma', 'Shree Dhootapapeshwar Ltd.',           'Bhasma',   '10 g',        145],
    ['Unjha Godanti Bhasma',           'Unjha Ayurvedic Pharmacy',             'Bhasma',   '10 g',        105],
  ]],
  ['Pathyadi', 'Pathyadi Kwath', 'Haritaki polyherbal decoction', 'Kwath', [
    ['Baidyanath Pathyadi Kwath Churna','Shree Baidyanath Ayurved Bhawan',     'Kwath',    '100 g',       150],
    ['Kottakkal Pathyakshadhatryadi Kashayam','Arya Vaidya Sala, Kottakkal',   'Kashayam', '200 ml',      190],
    ['Kerala Ayurveda Pathyakshadhatryadi Kashayam','Kerala Ayurveda Ltd.',    'Kashayam', '200 ml',      215],
  ]],
  ['Shirashooladi', 'Shirashooladi Vajra Ras', 'Herbo-mineral formulation', 'Vati', [
    ['Baidyanath Shirashooladi Vajra Ras','Shree Baidyanath Ayurved Bhawan',   'Vati',     '40 tablets',  230],
    ['Dhootapapeshwar Shirahshooladi Vajra Ras','Shree Dhootapapeshwar Ltd.',  'Vati',     '30 tablets',  265],
    ['Unjha Shirashooladi Vajra Ras',  'Unjha Ayurvedic Pharmacy',             'Vati',     '40 tablets',  195],
  ]],
  ['Sarpagandha', 'Sarpagandha', 'Rauwolfia serpentina', 'Ghanvati', [
    ['Himalaya Serpina',               'Himalaya Wellness Company',            'Tablet',   '100 tablets', 165],
    ['Baidyanath Sarpagandha Ghanvati','Shree Baidyanath Ayurved Bhawan',      'Ghanvati', '50 tablets',  175],
    ['Dhootapapeshwar Sarpagandha Vati','Shree Dhootapapeshwar Ltd.',          'Vati',     '60 tablets',  205],
    ['Unjha Sarpagandha Churna',       'Unjha Ayurvedic Pharmacy',             'Churna',   '50 g',        160],
  ]],
  ['Arjuna', 'Arjuna', 'Terminalia arjuna', 'Arishta', [
    ['Himalaya Arjuna Tablets',        'Himalaya Wellness Company',            'Tablet',   '60 tablets',  185],
    ['Himalaya Abana',                 'Himalaya Wellness Company',            'Tablet',   '60 tablets',  205],
    ['Dabur Arjunarishta',             'Dabur India Ltd.',                     'Arishta',  '450 ml',      175],
    ['Baidyanath Arjunarishta',        'Shree Baidyanath Ayurved Bhawan',      'Arishta',  '450 ml',      160],
    ['Kottakkal Arjunarishtam',        'Arya Vaidya Sala, Kottakkal',          'Arishta',  '435 ml',      185],
    ['Charak Arjin',                   'Charak Pharma Pvt. Ltd.',              'Tablet',   '60 tablets',  245],
  ]],
  ['Meshashringi (Gymnema)', 'Meshashringi (Gurmar)', 'Gymnema sylvestre', 'Tablet', [
    ['Himalaya Diabecon',              'Himalaya Wellness Company',            'Tablet',   '60 tablets',  230],
    ['Charak Hyponidd',                'Charak Pharma Pvt. Ltd.',              'Tablet',   '30 tablets',  205],
    ['Baidyanath Madhumehari Yog',     'Shree Baidyanath Ayurved Bhawan',      'Granules', '100 g',       215],
    ['Divya Madhunashini Vati',        'Patanjali Ayurved Ltd.',               'Vati',     '120 tablets', 340],
  ]],
  ['Methi', 'Methi (Fenugreek)', 'Trigonella foenum-graecum', 'Churna', [
    ['Patanjali Methi Churna',         'Patanjali Ayurved Ltd.',               'Churna',   '100 g',        75],
    ['Baidyanath Methi Churna',        'Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       110],
    ['Organic India Fenugreek',        'Organic India Pvt. Ltd.',              'Capsule',  '60 capsules', 265],
  ]],
  ['Nisha Amalaki', 'Nishamalaki', 'Curcuma longa + Phyllanthus emblica', 'Churna', [
    ['Dhootapapeshwar Nishamalaki Churna','Shree Dhootapapeshwar Ltd.',        'Churna',   '60 g',        185],
    ['Baidyanath Nisha Amalaki Churna','Shree Baidyanath Ayurved Bhawan',      'Churna',   '100 g',       150],
    ['Kerala Ayurveda Nisakathakadi Kashayam','Kerala Ayurveda Ltd.',          'Kashayam', '200 ml',      220],
  ]],
];

async function seedMedicines() {
  console.log('→ Medicines');
  let drugs = 0, brands = 0, missing = [];
  for (const [drugName, generic, botanical, form, brandList] of MEDICINES) {
    const [rows] = await db.query('SELECT drug_id FROM Drugs WHERE name=?', [drugName]);
    if (!rows.length) { missing.push(drugName); continue; }
    const id = rows[0].drug_id;
    await db.query(
      'UPDATE Drugs SET generic_name=?, botanical_name=?, dosage_form=? WHERE drug_id=?',
      [generic, botanical, form, id]
    );
    drugs++;
    for (const [brand, mfr, bForm, pack, mrp] of brandList) {
      await db.query(
        `INSERT INTO Medicine_Brands (drug_id, brand_name, manufacturer, dosage_form, pack_size, mrp)
         VALUES (?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE drug_id=VALUES(drug_id), dosage_form=VALUES(dosage_form),
                                 pack_size=VALUES(pack_size), mrp=VALUES(mrp), is_active=1`,
        [id, brand, mfr, bForm, pack, mrp]
      );
      brands++;
    }
  }
  const [[{ m }]] = await db.query('SELECT COUNT(DISTINCT manufacturer) m FROM Medicine_Brands');
  console.log(`   ${drugs} generics, ${brands} brands, ${m} manufacturers`);
  if (missing.length) console.log(`   ⚠ not found in Drugs: ${missing.join(', ')}`);
}

(async () => {
  try {
    await migrate();
    await seedDoctors();
    await seedMedicines();
    console.log('\n✅ Public directory seeded.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
})();
