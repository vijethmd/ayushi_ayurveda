/**
 * Static reference content for the public site.
 * Kept out of the views so the EJS templates stay presentational.
 */

// ── 1. The shloka featured under the hero title ──────────────────────────────
// Sushruta's definition of svastha (a healthy person) — the canonical verse of
// Ayurveda. Split into padas so the page can recite it line by line.
const SHLOKA = {
  id: 'svastha',
  title: 'Svastha Lakshana — the definition of health',
  source: 'सुश्रुत संहिता · सूत्रस्थान १५.४८',
  sourceEn: 'Sushruta Samhita, Sutrasthana 15.48',
  padas: [
    { sa: 'समदोषः समाग्निश्च',            it: 'sama-doṣaḥ samāgniś-ca' },
    { sa: 'समधातुमलक्रियः ।',              it: 'sama-dhātu-mala-kriyaḥ' },
    { sa: 'प्रसन्नात्मेन्द्रियमनाः',        it: 'prasannātmendriya-manāḥ' },
    { sa: 'स्वस्थ इत्यभिधीयते ॥',          it: 'svastha ity-abhidhīyate' },
  ],
  meaning: 'Balanced doshas, steady digestion, sound tissues, and a mind at peace — that is svastha.',
};

// ── 2. What Ayurveda is ──────────────────────────────────────────────────────
const AYURVEDA = {
  etymology: 'आयुः (āyuḥ, life) + वेदः (vedaḥ, knowledge) — “the knowledge of life”',
  lede:
    'India’s classical system of medicine, and one of the country’s official systems of ' +
    'healthcare under the Ministry of Ayush. It treats health as balance rather than the ' +
    'absence of disease.',
  aim:
    'स्वस्थस्य स्वास्थ्यरक्षणम्, आतुरस्य विकारप्रशमनम् — to protect the health of the healthy, ' +
    'and to relieve the disorders of the sick.',
  doshas: [
    { sa: 'वात', en: 'Vata',  elem: 'Space + Air',    governs: 'Movement, breath, circulation' },
    { sa: 'पित्त', en: 'Pitta', elem: 'Fire + Water',  governs: 'Digestion, metabolism, body heat' },
    { sa: 'कफ',   en: 'Kapha', elem: 'Earth + Water', governs: 'Structure, immunity, stamina' },
  ],
  branches: [
    ['Kayachikitsa',   'कायचिकित्सा',  'Internal medicine'],
    ['Shalya Tantra',  'शल्य तन्त्र',   'Surgery'],
    ['Shalakya Tantra','शालाक्य तन्त्र','Eye, ear, nose, throat & head'],
    ['Kaumarabhritya', 'कौमारभृत्य',   'Paediatrics & obstetrics'],
    ['Agada Tantra',   'अगद तन्त्र',    'Toxicology'],
    ['Bhuta Vidya',    'भूत विद्या',    'Psychiatry & mental health'],
    ['Rasayana',       'रसायन',        'Rejuvenation & longevity'],
    ['Vajikarana',     'वाजीकरण',      'Reproductive health'],
  ],
};

// ── 3. The Maharshis ─────────────────────────────────────────────────────────
// Portraits are stylised medallions drawn in SVG for this project — no authentic
// likeness of these figures survives, so nothing here is presented as a portrait
// from life.
const MAHARSHIS = [
  {
    id: 'dhanvantari',
    photo: { file: 'dhanvantari.jpg', author: 'Rajasekhar1961', licence: 'CC BY-SA 4.0',
             source: 'https://commons.wikimedia.org/wiki/File:Dhanvantari_sculpture.jpg' }, name: 'Dhanvantari', sa: 'धन्वन्तरि',
    title: 'Adi-deva of Ayurveda',
    era: 'Puranic tradition',
    known: 'Divine origin of Ayurveda',
    text: 'Physician of the gods, who rose from the churning of the ocean bearing the pot of amrita.',
    palette: ['#1d5c46', '#2e8b6a'], attr: 'kalasha', crown: true, beard: 'short',
  },
  {
    id: 'atreya', name: 'Atreya Punarvasu', sa: 'आत्रेय पुनर्वसु',
    title: 'Founder of the school of medicine',
    era: 'c. 6th century BCE',
    known: 'Kayachikitsa lineage',
    text: 'His discourses at Takshashila founded the tradition of internal medicine.',
    palette: ['#7a5418', '#b8862f'], attr: 'scroll', beard: 'long',
  },
  {
    id: 'agnivesha', name: 'Agnivesha', sa: 'अग्निवेश',
    title: 'Author of the Agnivesha Tantra',
    era: 'c. 6th century BCE',
    known: 'Root text of the Charaka Samhita',
    text: 'Foremost of Atreya’s disciples; his Agnivesha Tantra is the ancestor of the Charaka Samhita.',
    palette: ['#8a3a1e', '#c25f33'], attr: 'flame', beard: 'long',
  },
  {
    id: 'charaka',
    photo: { file: 'charaka.jpg', author: 'Alokprasad', licence: 'CC BY-SA 3.0',
             source: 'https://commons.wikimedia.org/wiki/File:Charak_statue.jpg' }, name: 'Charaka', sa: 'चरक',
    title: 'Redactor of the Charaka Samhita',
    era: 'c. 1st–2nd century CE',
    known: 'Internal medicine, ethics, Rasayana',
    text: 'Redacted the Agnivesha Tantra into the Charaka Samhita — still core BAMS curriculum.',
    palette: ['#2d5c3e', '#4a7c59'], attr: 'book', beard: 'long',
  },
  {
    id: 'sushruta',
    photo: { file: 'sushruta.jpg', author: 'Dr.jayan.d', licence: 'CC BY-SA 3.0',
             source: 'https://commons.wikimedia.org/wiki/File:Sushruta_Statue_Banaras.JPG' }, name: 'Sushruta', sa: 'सुश्रुत',
    title: 'Father of surgery',
    era: 'c. 6th century BCE (text c. 1st millennium)',
    known: 'Shalya Tantra — surgery',
    text: 'Described some three hundred procedures, including rhinoplasty and cataract couching.',
    palette: ['#1f4e79', '#3a7ca8'], attr: 'scalpel', beard: 'medium',
  },
  {
    id: 'vagbhata', name: 'Vagbhata', sa: 'वाग्भट',
    title: 'Author of the Ashtanga Hridaya',
    era: 'c. 7th century CE',
    known: 'Synthesis of Charaka & Sushruta',
    text: 'Distilled Charaka and Sushruta into the Ashtanga Hridaya, the text students learn first.',
    palette: ['#5b3a7a', '#8760ab'], attr: 'lotus', beard: 'medium',
  },
  {
    id: 'kashyapa',
    photo: { file: 'kashyapa.jpg', author: 'Srikar Kashyap', licence: 'CC BY-SA 4.0',
             source: 'https://commons.wikimedia.org/wiki/File:Kashyapa_muni_statue_in_Andhra_Pradesh.JPG' }, name: 'Kashyapa', sa: 'कश्यप',
    title: 'Author of the Kashyapa Samhita',
    era: 'c. 6th century BCE',
    known: 'Kaumarabhritya — paediatrics',
    text: 'The founding authority on the care of children and mothers.',
    palette: ['#166b63', '#2a9d8f'], attr: 'lotus', beard: 'long',
  },
  {
    id: 'nagarjuna', name: 'Nagarjuna', sa: 'नागार्जुन',
    title: 'Father of Rasashastra',
    era: 'c. 7th–8th century CE',
    known: 'Iatrochemistry — mineral medicine',
    text: 'Brought metals and minerals into the pharmacopoeia through the discipline of Rasashastra.',
    palette: ['#6b4423', '#9c6b3f'], attr: 'crucible', beard: 'short',
  },
  {
    id: 'madhava', name: 'Madhavakara', sa: 'माधवकर',
    title: 'Author of the Madhava Nidana',
    era: 'c. 7th century CE',
    known: 'Nidana — diagnostics',
    text: 'Wrote the Madhava Nidana, which gave Ayurveda its systematic diagnostic method.',
    palette: ['#7a1f3d', '#b03a5e'], attr: 'scroll', beard: 'medium',
  },
  {
    id: 'sharangadhara', name: 'Sharangadhara', sa: 'शार्ङ्गधर',
    title: 'Author of the Sharangadhara Samhita',
    era: 'c. 13th–14th century CE',
    known: 'Pharmaceutics & dosage',
    text: 'Standardised how Ayurvedic medicines are prepared and dosed.',
    palette: ['#2b5f8a', '#4a8cc2'], attr: 'mortar', beard: 'medium',
  },
  {
    id: 'bhavamishra', name: 'Bhavamishra', sa: 'भावमिश्र',
    title: 'Author of the Bhavaprakasha',
    era: 'c. 16th century CE',
    known: 'Nighantu — materia medica',
    text: 'Compiled the Bhavaprakasha, the most consulted Ayurvedic materia medica.',
    palette: ['#4a6b1f', '#7aa33a'], attr: 'leaf', beard: 'long',
  },
  {
    id: 'jivaka',
    photo: { file: 'jivaka.jpg', author: 'Photo Dharma, Sadao', licence: 'CC BY 2.0',
             source: 'https://commons.wikimedia.org/wiki/File:076_Jivaka_Komarabhacca_(detail)_(9166352010).jpg' }, name: 'Jivaka Komarabhacca', sa: 'जीवक कौमारभृत्य',
    title: 'Physician to the Buddha',
    era: 'c. 5th century BCE',
    known: 'Clinical surgery & paediatrics',
    text: 'Physician to Bimbisara of Magadha and to the Buddha’s sangha.',
    palette: ['#8a6a12', '#c49a2c'], attr: 'bowl', beard: 'short',
  },
];

// ── 4a. AYUSH manufacturers ──────────────────────────────────────────────────
// `key` matches Medicine_Brands.manufacturer so the page can join live brand counts.
const MANUFACTURERS = [
  { key: 'Dabur India Ltd.', short: 'Dabur', founded: 1884, founder: 'Dr. S. K. Burman',
    hq: 'Ghaziabad, Uttar Pradesh', focus: 'Classical formulations, Chyawanprash, digestives, oils' },
  { key: 'Himalaya Wellness Company', short: 'Himalaya', founded: 1930, founder: 'M. Manal',
    hq: 'Bengaluru, Karnataka', focus: 'Research-led proprietary herbal medicine' },
  { key: 'Shree Baidyanath Ayurved Bhawan', short: 'Baidyanath', founded: 1917, founder: 'Pt. Ram Dayal Joshi',
    hq: 'Kolkata & Nagpur', focus: 'Classical Ayurvedic texts’ formulations' },
  { key: 'Shree Dhootapapeshwar Ltd.', short: 'Dhootapapeshwar', founded: 1872, founder: 'Vaidya Shri Vishnu Sitaram Gogte',
    hq: 'Mumbai, Maharashtra', focus: 'Rasashastra & classical guggulu formulations' },
  { key: 'Arya Vaidya Sala, Kottakkal', short: 'Kottakkal AVS', founded: 1902, founder: 'Vaidyaratnam P. S. Varier',
    hq: 'Kottakkal, Malappuram, Kerala', focus: 'Kerala classical tradition & Panchakarma' },
  { key: 'Patanjali Ayurved Ltd.', short: 'Patanjali', founded: 2006, founder: 'Acharya Balkrishna & Swami Ramdev',
    hq: 'Haridwar, Uttarakhand', focus: 'Mass-market classical & proprietary medicine' },
  { key: 'Kerala Ayurveda Ltd.', short: 'Kerala Ayurveda', founded: 1945, founder: 'Vaidyaratnam K. G. Warrier',
    hq: 'Aluva, Ernakulam, Kerala', focus: 'Kashayams, thailams, classical Kerala preparations' },
  { key: 'The Arya Vaidya Pharmacy, Coimbatore', short: 'AVP Coimbatore', founded: 1943, founder: 'Vaidyaratnam Arya Vaidyan P. V. Rama Varier',
    hq: 'Coimbatore, Tamil Nadu', focus: 'Kashayams & Ashtavaidya tradition' },
  { key: 'Charak Pharma Pvt. Ltd.', short: 'Charak Pharma', founded: 1947, founder: 'Shri Ram Chandra Shroff',
    hq: 'Mumbai, Maharashtra', focus: 'Evidence-backed proprietary Ayurvedic medicine' },
  { key: 'Emami Ltd. (Zandu)', short: 'Zandu', founded: 1910, founder: 'Zandu Bhattji / Jugatram Vaidya',
    hq: 'Kolkata & Mumbai', focus: 'Classical formulations and pain balms' },
  { key: 'Unjha Ayurvedic Pharmacy', short: 'Unjha', founded: 1894, founder: 'Shri Bhogilal Shah',
    hq: 'Unjha, Mehsana, Gujarat', focus: 'Classical churnas, vatis & bhasmas' },
  { key: 'Sandu Pharmaceuticals Ltd.', short: 'Sandu', founded: 1925, founder: 'Vaidya D. K. Sandu',
    hq: 'Mumbai, Maharashtra', focus: 'Classical Ayurvedic medicine' },
  { key: 'Organic India Pvt. Ltd.', short: 'Organic India', founded: 1997, founder: 'Bharat Mitra & Bhavani Lev',
    hq: 'Lucknow, Uttar Pradesh', focus: 'Certified-organic herbal supplements' },
  { key: 'Aimil Pharmaceuticals (India) Ltd.', short: 'Aimil', founded: 1984, founder: 'Shri K. K. Sharma',
    hq: 'New Delhi', focus: 'Research-based proprietary herbal medicine' },
  { key: 'Maharishi Ayurveda Products Pvt. Ltd.', short: 'Maharishi Ayurveda', founded: 1985, founder: 'Maharishi Mahesh Yogi',
    hq: 'Noida, Uttar Pradesh', focus: 'Maharishi Ayurveda tradition & Rasayana' },
  { key: 'Sidpur Sat-Isabgol Factory', short: 'Sidpur Isabgol', founded: null, founder: null,
    hq: 'Sidhpur, Patan, Gujarat', focus: 'Psyllium husk (Isabgol)' },
];

// ── 4b. AYUSH education in India ─────────────────────────────────────────────
const EDUCATION = {
  regulator: {
    name: 'National Commission for Indian System of Medicine (NCISM)',
    url: 'https://ncismindia.org/',
    note: 'Sets curricula and standards, conducts the National Exit Test, and maintains the ' +
          'National Register of practitioners. Replaced the CCIM in 2021.',
  },
  ministry: { name: 'Ministry of Ayush, Government of India', url: 'https://ayush.gov.in/' },
  degrees: [
    { code: 'BAMS', full: 'Bachelor of Ayurvedic Medicine and Surgery',
      duration: '5½ years (4½ academic + 1 year rotatory internship)',
      entry: 'Class 12 with Physics, Chemistry, Biology · NEET-UG' },
    { code: 'MD / MS (Ayurveda)', full: 'Doctor of Medicine / Master of Surgery in Ayurveda',
      duration: '3 years',
      entry: 'BAMS + internship · AIAPGET' },
    { code: 'PhD (Ayurveda)', full: 'Doctor of Philosophy',
      duration: '3+ years', entry: 'MD/MS (Ayurveda) · institutional entrance' },
    { code: 'Paramedical & allied', full: 'Panchakarma Technician, Ayurveda Pharmacy (D.Pharm Ayu), Nursing',
      duration: '1–3 years', entry: 'Class 10 / 12 depending on course' },
  ],
  exams: [
    ['NEET-UG',  'National Eligibility cum Entrance Test — the single entry route to BAMS and every other AYUSH UG degree.', 'https://neet.nta.nic.in/'],
    ['AIAPGET',  'All India AYUSH Post Graduate Entrance Test — for MD/MS across Ayurveda, Unani, Siddha and Homoeopathy.', 'https://aiapget.nta.nic.in/'],
    ['AYUSH NEET counselling', 'Central and state counselling for the 15% all-India quota and state quotas.', 'https://aaccc.gov.in/'],
  ],
  institutions: [
    { name: 'Institute of Teaching and Research in Ayurveda (ITRA)', city: 'Jamnagar, Gujarat' },
    { name: 'All India Institute of Ayurveda (AIIA)', city: 'New Delhi' },
    { name: 'National Institute of Ayurveda (NIA)', city: 'Jaipur, Rajasthan' },
    { name: 'Faculty of Ayurveda, IMS, Banaras Hindu University', city: 'Varanasi, Uttar Pradesh' },
    { name: 'Gujarat Ayurved University', city: 'Jamnagar, Gujarat' },
    { name: 'Government Ayurveda College', city: 'Thiruvananthapuram, Kerala' },
    { name: 'Vaidyaratnam P. S. Varier Ayurveda College', city: 'Kottakkal, Kerala' },
    { name: 'Shri Dhanwantry Ayurvedic College', city: 'Chandigarh' },
    { name: 'Tilak Ayurved Mahavidyalaya', city: 'Pune, Maharashtra' },
    { name: 'Government Ayurveda Medical College', city: 'Mysuru, Karnataka' },
  ],
  streams: [
    ['A', 'Ayurveda',     'BAMS'],
    ['Y', 'Yoga & Naturopathy', 'BNYS'],
    ['U', 'Unani',        'BUMS'],
    ['S', 'Siddha',       'BSMS'],
    ['H', 'Homoeopathy',  'BHMS'],
  ],
};

// ── 5. External reference links (footer) ─────────────────────────────────────
const REFERENCES = [
  { group: 'Standards & formularies', links: [
    { label: 'Ayurvedic Pharmacopoeia of India',    url: 'https://pcimh.gov.in/' },
    { label: 'Ayurvedic Formulary of India',        url: 'https://ayush.gov.in/' },
    { label: 'Materia Medica — e-Nighantu',         url: 'https://niimh.nic.in/ebooks/e-Nighantu/index.php' },
    { label: 'Indian Medicinal Plants Database',    url: 'http://www.medicinalplants.in/' },
  ]},
  { group: 'Classical texts', links: [
    { label: 'Charaka Samhita — e-Caraka',          url: 'https://niimh.nic.in/ebooks/ecaraka/index.php' },
    { label: 'Sushruta Samhita — e-Sushruta',       url: 'https://niimh.nic.in/ebooks/esushruta/index.php' },
    { label: 'Ashtanga Hridaya',                    url: 'https://archive.org/details/ashtanga-hridaya-with-nirmala-hindi-vyakhya-brahmanand-tripathi-chowkambha-1' },
    { label: 'Madhava Nidana',                      url: 'https://niimh.nic.in/ebooks/madhavanidana/index.php' },
    { label: 'Charaka Samhita New Edition',         url: 'https://www.carakasamhitaonline.com/index.php?title=Main_Page' },
  ]},
  { group: 'Regulation & statistics', links: [
    { label: 'Practitioner statistics & National Register', url: 'https://ncismindia.org/' },
    { label: 'Ministry of Ayush',                    url: 'https://ayush.gov.in/' },
    { label: 'CCRAS',                                url: 'https://ccras.nic.in/' },
    { label: 'NAMASTE portal',                       url: 'https://namaste.ayush.gov.in/' },
    { label: 'Ayush Research Portal',                url: 'https://ayushportal.nic.in/' },
  ]},
];

module.exports = { SHLOKA, AYURVEDA, MAHARSHIS, MANUFACTURERS, EDUCATION, REFERENCES };
