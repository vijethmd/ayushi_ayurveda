/**
 * Public (no-login) controller — landing page + directory search.
 * Search facets:
 *   doctors   → speciality | area
 *   medicines → generic | brand | manufacturer
 */
const db = require('../config/db');
const content = require('../content/ayurveda');
const { portrait } = require('../content/portraits');

// Facet definitions shared by the search page, the suggest API and the UI.
const FACETS = {
  doctors: {
    label: 'Doctors',
    icon: 'bi-person-badge',
    by: {
      speciality: { label: 'Speciality',   icon: 'bi-clipboard2-pulse', placeholder: 'e.g. Panchakarma, Skin Disorders, Diabetic Care' },
      area:       { label: 'Area',         icon: 'bi-geo-alt',          placeholder: 'e.g. Jayanagar, Bengaluru, Kerala' },
    },
  },
  medicines: {
    label: 'Medicines',
    icon: 'bi-capsule',
    by: {
      generic:      { label: 'Generic Name', icon: 'bi-droplet-half', placeholder: 'e.g. Triphala, Ashwagandha, Yogaraja Guggulu' },
      brand:        { label: 'Brand Name',   icon: 'bi-tag',          placeholder: 'e.g. Liv.52, Chyawanprash, Cystone' },
      manufacturer: { label: 'Manufacturer', icon: 'bi-building',     placeholder: 'e.g. Dabur, Himalaya, Kottakkal' },
    },
  },
};

const normalise = (type, by) => {
  const t = FACETS[type] ? type : 'doctors';
  const b = FACETS[t].by[by] ? by : Object.keys(FACETS[t].by)[0];
  return [t, b];
};

// ── Landing page ─────────────────────────────────────────────────────────────
exports.landing = async (req, res) => {
  const stats = { doctors: 0, generics: 0, brands: 0, manufacturers: 0, cities: 0, diseases: 0 };
  try {
    const [[s]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM Users WHERE role='doctor' AND is_active=1)          AS doctors,
        (SELECT COUNT(*) FROM Drugs WHERE is_active=1)                            AS generics,
        (SELECT COUNT(*) FROM Medicine_Brands WHERE is_active=1)                  AS brands,
        (SELECT COUNT(DISTINCT manufacturer) FROM Medicine_Brands)                AS manufacturers,
        (SELECT COUNT(DISTINCT city) FROM Users WHERE role='doctor' AND city IS NOT NULL) AS cities,
        (SELECT COUNT(*) FROM Diseases)                                           AS diseases`);
    Object.assign(stats, s);

  } catch (err) {
    console.error('Landing stats error:', err.message);
  }
  res.render('pages/landing', {
    title: 'Ayushman Bhava',
    facets: FACETS, stats,
    shloka: content.SHLOKA, ayurveda: content.AYURVEDA,
    maharshis: content.MAHARSHIS, references: content.REFERENCES, portrait,
    loggedIn: Boolean(req.cookies?.ayushi_token),
  });
};

// ── Search results ───────────────────────────────────────────────────────────
exports.search = async (req, res) => {
  const [type, by] = normalise(req.query.type, req.query.by);
  const q = (req.query.q || '').trim();
  const like = `%${q}%`;
  let results = [];

  try {
    if (type === 'doctors') {
      const cols = `user_id, name, specialization, qualification, experience_years,
                    clinic_name, area, city, state, consultation_fee, languages`;
      if (by === 'area') {
        [results] = await db.query(
          `SELECT ${cols} FROM Users
            WHERE role='doctor' AND is_active=1
              AND (area LIKE ? OR city LIKE ? OR state LIKE ? OR clinic_name LIKE ?)
            ORDER BY city, area, experience_years DESC`,
          [like, like, like, like]);
      } else {
        [results] = await db.query(
          `SELECT ${cols} FROM Users
            WHERE role='doctor' AND is_active=1 AND specialization LIKE ?
            ORDER BY experience_years DESC, name`,
          [like]);
      }
    } else if (by === 'generic') {
      [results] = await db.query(
        `SELECT d.drug_id, d.name, d.generic_name, d.botanical_name, d.category,
                d.dosage_form, d.traditional_use,
                COUNT(b.brand_id) AS brand_count,
                GROUP_CONCAT(DISTINCT b.manufacturer ORDER BY b.manufacturer SEPARATOR ' · ') AS makers
           FROM Drugs d
           LEFT JOIN Medicine_Brands b ON b.drug_id = d.drug_id AND b.is_active = 1
          WHERE d.is_active = 1
            AND (d.generic_name LIKE ? OR d.name LIKE ? OR d.botanical_name LIKE ? OR d.category LIKE ?)
          GROUP BY d.drug_id
          ORDER BY d.generic_name, d.name`,
        [like, like, like, like]);
    } else {
      const where = by === 'brand' ? 'b.brand_name LIKE ?' : 'b.manufacturer LIKE ?';
      [results] = await db.query(
        `SELECT b.brand_id, b.brand_name, b.manufacturer, b.dosage_form, b.pack_size, b.mrp,
                d.drug_id, d.name AS drug_name, d.generic_name, d.category
           FROM Medicine_Brands b
           JOIN Drugs d ON d.drug_id = b.drug_id
          WHERE b.is_active = 1 AND ${where}
          ORDER BY b.manufacturer, b.brand_name`,
        [like]);
    }
  } catch (err) {
    console.error('Search error:', err.message);
  }

  res.render('pages/search-results', {
    title: `${FACETS[type].by[by].label} search`,
    facets: FACETS, type, by, q, results, references: content.REFERENCES,
    loggedIn: Boolean(req.cookies?.ayushi_token),
  });
};

// ── Suggestions (typeahead + "popular" chips in the dropdown) ────────────────
exports.suggest = async (req, res) => {
  const [type, by] = normalise(req.query.type, req.query.by);
  const q = (req.query.q || '').trim();
  const like = `%${q}%`;
  const SQL = {
    'doctors.speciality': [
      `SELECT specialization v, COUNT(*) n FROM Users
        WHERE role='doctor' AND is_active=1 AND specialization LIKE ?
        GROUP BY specialization ORDER BY n DESC, v LIMIT 10`, 1],
    'doctors.area': [
      `SELECT v, SUM(n) n FROM (
          SELECT area v, COUNT(*) n FROM Users WHERE role='doctor' AND is_active=1 AND area LIKE ? GROUP BY area
          UNION ALL
          SELECT city v, COUNT(*) n FROM Users WHERE role='doctor' AND is_active=1 AND city LIKE ? GROUP BY city
       ) t WHERE v IS NOT NULL GROUP BY v ORDER BY n DESC, v LIMIT 10`, 2],
    'medicines.generic': [
      `SELECT generic_name v, 1 n FROM Drugs
        WHERE is_active=1 AND generic_name IS NOT NULL AND (generic_name LIKE ? OR name LIKE ?)
        ORDER BY generic_name LIMIT 10`, 2],
    'medicines.brand': [
      `SELECT brand_name v, 1 n FROM Medicine_Brands
        WHERE is_active=1 AND brand_name LIKE ? ORDER BY brand_name LIMIT 10`, 1],
    'medicines.manufacturer': [
      `SELECT manufacturer v, COUNT(*) n FROM Medicine_Brands
        WHERE is_active=1 AND manufacturer LIKE ?
        GROUP BY manufacturer ORDER BY n DESC, manufacturer LIMIT 10`, 1],
  };
  const [sql, argc] = SQL[`${type}.${by}`];
  try {
    const [rows] = await db.query(sql, Array(argc).fill(like));
    res.json({ success: true, items: rows.map(r => ({ value: r.v, count: Number(r.n) || 0 })) });
  } catch (err) {
    console.error('Suggest error:', err.message);
    res.json({ success: false, items: [] });
  }
};

// ── AYUSH manufacturers ──────────────────────────────────────────────────────
exports.manufacturers = async (req, res) => {
  let rows = [];
  try {
    [rows] = await db.query(
      `SELECT b.manufacturer,
              COUNT(*)                       AS brand_count,
              COUNT(DISTINCT b.drug_id)      AS formulation_count,
              GROUP_CONCAT(DISTINCT b.dosage_form ORDER BY b.dosage_form SEPARATOR ', ') AS forms
         FROM Medicine_Brands b
        WHERE b.is_active = 1
        GROUP BY b.manufacturer`);
  } catch (err) { console.error('Manufacturers error:', err.message); }

  const live = new Map(rows.map(r => [r.manufacturer, r]));
  // Profile list drives the order; live brand counts come from the catalogue.
  const makers = content.MANUFACTURERS.map(m => ({ ...m, ...(live.get(m.key) || {
    brand_count: 0, formulation_count: 0, forms: '' }) }))
    .sort((a, b) => b.brand_count - a.brand_count);
  // Anything in the catalogue without a written profile still gets listed.
  for (const [name, r] of live) {
    if (!content.MANUFACTURERS.some(m => m.key === name)) {
      makers.push({ key: name, short: name, hq: null, founded: null, focus: null, note: null, ...r });
    }
  }

  res.render('pages/manufacturers', {
    title: 'AYUSH Manufacturers',
    facets: FACETS, makers, references: content.REFERENCES,
    totals: {
      makers: makers.length,
      brands: makers.reduce((n, m) => n + Number(m.brand_count || 0), 0),
      states: new Set(makers.map(m => (m.hq || '').split(',').pop().trim()).filter(Boolean)).size,
    },
    loggedIn: Boolean(req.cookies?.ayushi_token),
  });
};

// ── AYUSH education ──────────────────────────────────────────────────────────
exports.education = (req, res) => {
  res.render('pages/education', {
    title: 'AYUSH Education in India',
    facets: FACETS, edu: content.EDUCATION, references: content.REFERENCES,
    loggedIn: Boolean(req.cookies?.ayushi_token),
  });
};

// ── Materia Medica: derivation → category → drug ─────────────────────────────
const UNCLASSIFIED = 'Unclassified';

exports.materiaMedica = async (req, res) => {
  const q = (req.query.q || '').trim();
  const groupBy = req.query.group === 'category' ? 'category' : 'source';
  let drugs = [];
  try {
    const like = `%${q}%`;
    [drugs] = await db.query(
      `SELECT d.drug_id, d.name, d.generic_name, d.botanical_name, d.category,
              d.source_type, d.source_subtype, d.preparation_class, d.dosage_form,
              d.part_used, d.virya, d.traditional_use,
              COUNT(b.brand_id) AS brand_count
         FROM Drugs d
         LEFT JOIN Medicine_Brands b ON b.drug_id = d.drug_id AND b.is_active = 1
        WHERE d.is_active = 1
          ${q ? `AND (d.name LIKE ? OR d.generic_name LIKE ? OR d.botanical_name LIKE ?
                      OR d.category LIKE ? OR d.source_type LIKE ? OR d.source_subtype LIKE ?)` : ''}
        GROUP BY d.drug_id
        ORDER BY d.source_type, d.category, d.name`,
      q ? Array(6).fill(like) : []);
  } catch (err) { console.error('Materia Medica error:', err.message); }

  // Two-level tree: outer axis (derivation or category) → inner axis → drugs.
  const [outerKey, innerKey] = groupBy === 'category'
    ? ['category', 'source_type']
    : ['source_type', 'category'];
  const tree = new Map();
  for (const d of drugs) {
    const outer = d[outerKey] || UNCLASSIFIED;
    const inner = d[innerKey] || UNCLASSIFIED;
    if (!tree.has(outer)) tree.set(outer, { name: outer, count: 0, groups: new Map() });
    const o = tree.get(outer);
    o.count++;
    if (!o.groups.has(inner)) o.groups.set(inner, { name: inner, drugs: [] });
    o.groups.get(inner).drugs.push(d);
  }
  const branches = [...tree.values()]
    .map(o => ({ ...o, groups: [...o.groups.values()].sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.count - a.count);

  res.render('pages/materia-medica', {
    title: 'Materia Medica',
    facets: FACETS, branches, q, groupBy, total: drugs.length,
    references: content.REFERENCES,
    loggedIn: Boolean(req.cookies?.ayushi_token),
  });
};

exports.materiaMedicaDetail = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Drugs WHERE drug_id=? AND is_active=1', [req.params.id]);
    if (!rows.length) return res.redirect('/materia-medica');
    const drug = rows[0];
    const [brands] = await db.query(
      `SELECT * FROM Medicine_Brands WHERE drug_id=? AND is_active=1
        ORDER BY manufacturer, brand_name`, [req.params.id]);
    // Siblings under the same category, for lateral navigation.
    const [siblings] = await db.query(
      `SELECT drug_id, name, generic_name FROM Drugs
        WHERE is_active=1 AND category=? AND drug_id<>? ORDER BY name LIMIT 12`,
      [drug.category, drug.drug_id]);
    res.render('pages/materia-medica-detail', {
      title: drug.generic_name || drug.name,
      facets: FACETS, drug, brands, siblings, references: content.REFERENCES,
      loggedIn: Boolean(req.cookies?.ayushi_token),
    });
  } catch (err) {
    console.error('Drug detail error:', err.message);
    res.redirect('/materia-medica');
  }
};

exports.FACETS = FACETS;
