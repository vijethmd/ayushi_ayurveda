/**
 * Expand the directory to something closer to the real Indian market.
 *
 * Manufacturers are real, licensed Indian Ayurvedic houses with their actual
 * headquarters. Formulations are classical preparations from the Ayurvedic
 * Formulary of India — public-domain recipes that the large manufacturers all
 * produce, which is why a given classical medicine legitimately appears under
 * several brands. A handful of well-known proprietary products are included
 * under the company that actually makes them.
 *
 * Practitioners are synthetic: plausible Indian names placed in real localities
 * so the "search by area" facet behaves like the real thing. They are sample
 * data and are not real people.
 *
 * Idempotent.  Run:  node backend/sql/seed_india_expanded.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ── Manufacturers: real companies, real headquarters ────────────────────────
const MAKERS = {
  dabur:        ['Dabur India Ltd.',                     'Ghaziabad, Uttar Pradesh'],
  himalaya:     ['Himalaya Wellness Company',            'Bengaluru, Karnataka'],
  baidyanath:   ['Shree Baidyanath Ayurved Bhawan',      'Kolkata & Nagpur'],
  sdl:          ['Shree Dhootapapeshwar Ltd.',           'Mumbai, Maharashtra'],
  kottakkal:    ['Arya Vaidya Sala, Kottakkal',          'Kottakkal, Malappuram, Kerala'],
  patanjali:    ['Patanjali Ayurved Ltd.',               'Haridwar, Uttarakhand'],
  keralaayu:    ['Kerala Ayurveda Ltd.',                 'Aluva, Ernakulam, Kerala'],
  avp:          ['The Arya Vaidya Pharmacy, Coimbatore', 'Coimbatore, Tamil Nadu'],
  charak:       ['Charak Pharma Pvt. Ltd.',              'Mumbai, Maharashtra'],
  zandu:        ['Emami Ltd. (Zandu)',                   'Kolkata & Mumbai'],
  unjha:        ['Unjha Ayurvedic Pharmacy',             'Unjha, Mehsana, Gujarat'],
  sandu:        ['Sandu Pharmaceuticals Ltd.',           'Mumbai, Maharashtra'],
  organicindia: ['Organic India Pvt. Ltd.',              'Lucknow, Uttar Pradesh'],
  aimil:        ['Aimil Pharmaceuticals (India) Ltd.',   'New Delhi'],
  maharishi:    ['Maharishi Ayurveda Products Pvt. Ltd.','Noida, Uttar Pradesh'],
  sidpur:       ['Sidpur Sat-Isabgol Factory',           'Sidhpur, Patan, Gujarat'],
  // ── added in this pass ──
  vaidyaratnam: ['Vaidyaratnam Oushadhasala',            'Ollur, Thrissur, Kerala'],
  oushadhi:     ['Oushadhi (Pharmaceutical Corporation IM Kerala)', 'Thrissur, Kerala'],
  sitaram:      ['Sitaram Ayurveda Pvt. Ltd.',           'Thrissur, Kerala'],
  nagarjuna:    ['Nagarjuna Herbal Concentrates Ltd.',   'Thodupuzha, Idukki, Kerala'],
  pankaja:      ['Pankajakasthuri Herbals India',        'Thiruvananthapuram, Kerala'],
  bipha:        ['Bipha Drug Laboratories',              'Kottayam, Kerala'],
  avn:          ['AVN Ayurveda Formulations Pvt. Ltd.',  'Madurai, Tamil Nadu'],
  skm:          ['SKM Siddha and Ayurveda',              'Erode, Tamil Nadu'],
  amrutanjan:   ['Amrutanjan Health Care Ltd.',          'Chennai, Tamil Nadu'],
  vasu:         ['Vasu Healthcare Pvt. Ltd.',            'Vadodara, Gujarat'],
  banlabs:      ['Ban Labs Pvt. Ltd.',                   'Rajkot, Gujarat'],
  alarsin:      ['Alarsin Pharmaceuticals',              'Mumbai, Maharashtra'],
  gufic:        ['Gufic Biosciences Ltd.',               'Mumbai, Maharashtra'],
  solumiks:     ['Solumiks Herbaceuticals Ltd.',         'Mumbai, Maharashtra'],
  multani:      ['Multani Pharmaceuticals Ltd.',         'New Delhi'],
  shriganga:    ['Shri Ganga Pharmacy',                  'Haridwar, Uttarakhand'],
  dindayal:     ['Dindayal Aushadhi Pvt. Ltd.',          'Gwalior, Madhya Pradesh'],
  jiva:         ['Jiva Ayurveda',                        'Faridabad, Haryana'],
  srisri:       ['Sri Sri Tattva',                       'Bengaluru, Karnataka'],
  kapiva:       ['Kapiva Ayurveda',                      'Bengaluru, Karnataka'],
  deys:         ['Dey’s Medical Stores (Mfg.) Ltd.','Kolkata, West Bengal'],
};



// Short forms, as the products are actually branded on the pack.
const SHORT = {
  dabur:'Dabur', himalaya:'Himalaya', baidyanath:'Baidyanath', sdl:'Dhootapapeshwar',
  kottakkal:'Kottakkal', patanjali:'Divya', keralaayu:'Kerala Ayurveda', avp:'AVP',
  charak:'Charak', zandu:'Zandu', unjha:'Unjha', sandu:'Sandu', organicindia:'Organic India',
  aimil:'Aimil', maharishi:'Maharishi', sidpur:'Sidpur', vaidyaratnam:'Vaidyaratnam',
  oushadhi:'Oushadhi', sitaram:'Sitaram', nagarjuna:'Nagarjuna', pankaja:'Pankajakasthuri',
  bipha:'Bipha', avn:'AVN', skm:'SKM', amrutanjan:'Amrutanjan', vasu:'Vasu',
  banlabs:'Ban Labs', alarsin:'Alarsin', gufic:'Gufic', solumiks:'Solumiks',
  multani:'Multani', shriganga:'Shri Ganga', dindayal:'Dindayal', jiva:'Jiva',
  srisri:'Sri Sri Tattva', kapiva:'Kapiva', deys:'Dey’s',
};

// Shared defaults per preparation type, overridden per formulation where it matters.
const TYPE = {
  Arishta:  { src:'Audbhida (Plant origin)', sub:'Sandhana Kalpana (Fermented)',  prep:'Compound formulation (Yoga)', form:'Arishta',  dose:'15–30 ml twice daily', anupana:'Equal warm water', ref:'Sharangadhara Samhita' },
  Asava:    { src:'Audbhida (Plant origin)', sub:'Sandhana Kalpana (Fermented)',  prep:'Compound formulation (Yoga)', form:'Asava',    dose:'15–30 ml twice daily', anupana:'Equal warm water', ref:'Sharangadhara Samhita' },
  Churna:   { src:'Audbhida (Plant origin)', sub:'Oshadhi Kalpa (Herb formulation)', prep:'Compound formulation (Yoga)', form:'Churna', dose:'3–6 g twice daily', anupana:'Warm water', ref:'Sharangadhara Samhita' },
  Vati:     { src:'Audbhida (Plant origin)', sub:'Oshadhi Kalpa (Herb formulation)', prep:'Compound formulation (Yoga)', form:'Vati',   dose:'1–2 tablets twice daily', anupana:'Warm water', ref:'Bhaishajya Ratnavali' },
  Guggulu:  { src:'Audbhida (Plant origin)', sub:'Niryasa Kalpa (Resin formulation)', prep:'Compound formulation (Yoga)', form:'Tablet', dose:'1–2 tablets twice daily', anupana:'Warm water', ref:'Sharangadhara Samhita' },
  Rasa:     { src:'Parthiva (Mineral origin)', sub:'Rasa Dravya (Herbo-mineral)', prep:'Compound formulation (Yoga)', form:'Vati',      dose:'125–250 mg', anupana:'Honey', ref:'Rasaratna Samuchchaya', ci:'Strictly on a practitioner’s prescription' },
  Bhasma:   { src:'Parthiva (Mineral origin)', sub:'Dhatu-Upadhatu (Mineral)',   prep:'Single drug (Ekala dravya)', form:'Bhasma',     dose:'125–250 mg', anupana:'Honey / ghee', ref:'Rasatarangini', ci:'Only classically prepared bhasma, under supervision' },
  Taila:    { src:'Audbhida (Plant origin)', sub:'Sneha Kalpana (Oil)',          prep:'Compound formulation (Yoga)', form:'Taila',     dose:'For external application', anupana:'—', ref:'Sahasrayogam' },
  Ghrita:   { src:'Jangama (Animal origin)', sub:'Sneha Kalpana (Ghee)',         prep:'Compound formulation (Yoga)', form:'Ghrita',    dose:'5–10 g on an empty stomach', anupana:'Warm water / milk', ref:'Ashtanga Hridaya' },
  Kashayam: { src:'Audbhida (Plant origin)', sub:'Kwatha Kalpana (Decoction)',   prep:'Compound formulation (Yoga)', form:'Kashayam',  dose:'15–30 ml twice daily', anupana:'Equal warm water', ref:'Sahasrayogam' },
  Lehya:    { src:'Audbhida (Plant origin)', sub:'Avaleha Kalpana (Confection)', prep:'Compound formulation (Yoga)', form:'Lehyam',    dose:'5–10 g once or twice daily', anupana:'Warm milk', ref:'Ashtanga Hridaya' },
};

// name | type | therapeutic category | rasa | virya | vipaka | dosha | makers
const NEW_FORMULATIONS = [
  // ── Arishtas & Asavas ─────────────────────────────────────────────────────
  ['Ashwagandharishta','Arishta','Nervine','Tikta, Kashaya','Ushna','Madhura','Vata-Kapha hara; Balya',            ['dabur','baidyanath','kottakkal','sdl','patanjali','oushadhi']],
  ['Saraswatarishta','Arishta','Nervine','Madhura, Tikta','Ushna','Madhura','Vata-Pitta hara; Medhya',              ['dabur','baidyanath','kottakkal','sdl','unjha','oushadhi']],
  ['Ashokarishta','Arishta','Womens Health','Kashaya, Tikta','Shita','Katu','Pitta-Kapha hara; Stri-roga hara',     ['dabur','baidyanath','kottakkal','sdl','patanjali','vaidyaratnam']],
  ['Balarishta','Arishta','Musculoskeletal','Madhura','Ushna','Madhura','Vata hara; Balya',                         ['kottakkal','baidyanath','oushadhi','vaidyaratnam','avp']],
  ['Jeerakarishta','Arishta','Digestive','Katu','Ushna','Katu','Vata-Kapha hara; Dipana',                           ['kottakkal','baidyanath','oushadhi','sitaram']],
  ['Lohasava','Asava','Haematinic','Kashaya, Tikta','Ushna','Katu','Kapha-Pitta hara; Pandu hara',                  ['dabur','baidyanath','sdl','unjha','deys']],
  ['Punarnavasava','Asava','Diuretic / Renal','Madhura, Tikta','Ushna','Katu','Kapha-Vata hara; Shothahara',        ['baidyanath','kottakkal','sdl','oushadhi']],
  ['Pippalyasava','Asava','Respiratory','Katu','Ushna','Katu','Kapha-Vata hara; Dipana',                            ['baidyanath','kottakkal','oushadhi','sitaram']],
  ['Chandanasava','Asava','Urological','Madhura, Tikta','Shita','Madhura','Pitta hara; Mutrala',                    ['dabur','baidyanath','sdl','kottakkal']],
  ['Drakshasava','Asava','Cardio-respiratory','Madhura','Ushna','Madhura','Vata-Pitta hara; Hridya',                ['dabur','baidyanath','sdl','zandu','unjha']],
  ['Kumaryasava','Asava','Liver Disorders','Tikta, Kashaya','Ushna','Katu','Kapha-Vata hara; Yakrit-uttejaka',      ['dabur','baidyanath','sdl','patanjali']],
  ['Amritarishta','Arishta','Immunomodulator','Tikta','Ushna','Katu','Tridoshahara; Jvarahara',                     ['baidyanath','kottakkal','oushadhi','sitaram','vaidyaratnam']],
  ['Mustakarishta','Arishta','Antidiarrheal','Tikta, Kashaya','Ushna','Katu','Kapha-Pitta hara; Grahi',             ['baidyanath','kottakkal','oushadhi']],
  ['Usheerasava','Asava','Blood Purifier','Tikta, Kashaya','Shita','Katu','Pitta-Kapha hara; Raktastambhaka',       ['baidyanath','sdl','kottakkal']],
  ['Vidangasava','Asava','Antimicrobial','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Krimighna',                 ['baidyanath','sdl','unjha']],

  // ── Churnas ───────────────────────────────────────────────────────────────
  ['Lavan Bhaskar Churna','Churna','Digestive Stimulant','Katu, Lavana','Ushna','Katu','Vata-Kapha hara; Dipana',   ['baidyanath','sdl','dabur','patanjali','unjha','dindayal']],
  ['Panchasakar Churna','Churna','Purgative','Katu, Madhura','Ushna','Katu','Vata-Kapha hara; Anulomana',           ['baidyanath','sdl','unjha','shriganga']],
  ['Ajmodadi Churna','Churna','Musculoskeletal','Katu, Tikta','Ushna','Katu','Vata-Kapha hara; Amahara',            ['baidyanath','sdl','unjha','dindayal']],
  ['Dadimashtak Churna','Churna','Antidiarrheal','Amla, Kashaya','Ushna','Amla','Vata-Kapha hara; Grahi',           ['baidyanath','sdl','kottakkal']],
  ['Shatavari Churna','Churna','Womens Health','Madhura, Tikta','Shita','Madhura','Vata-Pitta hara; Stanyajanana',  ['baidyanath','dabur','patanjali','kapiva','organicindia']],
  ['Karpuradi Churna','Churna','Respiratory','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Kasahara',              ['baidyanath','sdl','unjha']],
  ['Vaishwanar Churna','Churna','Musculoskeletal','Katu, Lavana','Ushna','Katu','Vata hara; Dipana-Pachana',        ['baidyanath','sdl','shriganga']],

  // ── Vatis & Rasa preparations ─────────────────────────────────────────────
  ['Arogyavardhini Vati','Rasa','Liver Disorders','Tikta, Kashaya','Ushna','Katu','Tridoshahara; Yakrit-uttejaka',  ['baidyanath','sdl','patanjali','unjha','dindayal','shriganga']],
  ['Sanjivani Vati','Rasa','Digestive','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Amapachana',                  ['baidyanath','sdl','unjha','shriganga']],
  ['Sootshekhar Ras','Rasa','Antacid','Katu, Tikta','Ushna','Katu','Pitta-Vata hara; Amlapittahara',                ['baidyanath','sdl','unjha','dindayal']],
  ['Agnitundi Vati','Rasa','Digestive Stimulant','Katu','Ushna','Katu','Kapha-Vata hara; Dipana',                   ['baidyanath','sdl','unjha']],
  ['Lakshmivilas Ras','Rasa','Respiratory','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Shvasahara',              ['baidyanath','sdl','unjha','dindayal']],
  ['Tribhuvankirti Ras','Rasa','Respiratory','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Jvarahara',             ['baidyanath','sdl','unjha','shriganga']],
  ['Vyoshadi Vati','Vati','Respiratory','Katu','Ushna','Katu','Kapha-Vata hara; Kasahara',                          ['baidyanath','kottakkal','sdl','oushadhi']],
  ['Khadiradi Vati','Vati','ENT Disorders','Tikta, Kashaya','Shita','Katu','Kapha-Pitta hara; Mukharoga hara',      ['baidyanath','sdl','unjha','dabur']],

  // ── Guggulu formulations ──────────────────────────────────────────────────
  ['Triphala Guggulu','Guggulu','Anti-inflammatory','Kashaya, Tikta','Ushna','Katu','Tridoshahara; Lekhana',        ['baidyanath','sdl','patanjali','kottakkal','unjha']],
  ['Simhanad Guggulu','Guggulu','Musculoskeletal','Tikta, Katu','Ushna','Katu','Vata-Kapha hara; Amavatahara',      ['baidyanath','sdl','unjha','dindayal']],
  ['Punarnavadi Guggulu','Guggulu','Diuretic / Renal','Tikta, Kashaya','Ushna','Katu','Kapha-Vata hara; Shothahara',['baidyanath','sdl','kottakkal','oushadhi']],
  ['Trayodashang Guggulu','Guggulu','Musculoskeletal','Tikta, Madhura','Ushna','Madhura','Vata hara; Balya',        ['baidyanath','sdl','kottakkal','unjha']],
  ['Rasnadi Guggulu','Guggulu','Musculoskeletal','Tikta, Katu','Ushna','Katu','Vata-Kapha hara; Shoolahara',        ['baidyanath','sdl','kottakkal','oushadhi']],

  // ── Tailas (external) ─────────────────────────────────────────────────────
  ['Mahanarayan Taila','Taila','Musculoskeletal','Madhura, Tikta','Ushna','Madhura','Vata hara; Shoolahara',        ['baidyanath','kottakkal','sdl','oushadhi','vaidyaratnam','patanjali','avp']],
  ['Ksheerabala Taila','Taila','Neurological','Madhura','Shita','Madhura','Vata-Pitta hara; Balya',                 ['kottakkal','keralaayu','oushadhi','nagarjuna','vaidyaratnam','avp','sitaram']],
  ['Dhanwantharam Taila','Taila','Post-natal Care','Madhura, Tikta','Ushna','Madhura','Vata hara; Sutika-paricharya',['kottakkal','keralaayu','oushadhi','vaidyaratnam','nagarjuna','avp']],
  ['Neelibhringadi Taila','Taila','Hair & Scalp','Tikta, Kashaya','Shita','Katu','Pitta-Kapha hara; Keshya',        ['kottakkal','keralaayu','oushadhi','sitaram','nagarjuna','vasu']],
  ['Kottamchukkadi Taila','Taila','Musculoskeletal','Katu, Tikta','Ushna','Katu','Vata-Kapha hara; Shoolahara',     ['kottakkal','keralaayu','oushadhi','vaidyaratnam','sitaram']],
  ['Murivenna','Taila','Sports Injuries','Tikta, Kashaya','Ushna','Katu','Vata-Kapha hara; Vranaropana',           ['kottakkal','keralaayu','oushadhi','vaidyaratnam','sitaram','nagarjuna']],
  ['Pinda Taila','Taila','Skin','Madhura, Tikta','Shita','Madhura','Pitta-Vata hara; Dahahara',                     ['kottakkal','oushadhi','keralaayu','vaidyaratnam']],
  ['Jatyadi Taila','Taila','Anti-inflammatory / Skin','Tikta, Kashaya','Shita','Katu','Kapha-Pitta hara; Vranaropana',['baidyanath','kottakkal','sdl','oushadhi','keralaayu']],
  ['Anu Taila','Taila','ENT Disorders','Madhura, Tikta','Ushna','Madhura','Tridoshahara; Nasya dravya',             ['kottakkal','keralaayu','oushadhi','sdl','vaidyaratnam','avp']],
  ['Shadbindu Taila','Taila','ENT Disorders','Katu, Tikta','Ushna','Katu','Kapha-Vata hara; Nasya dravya',          ['baidyanath','sdl','unjha','patanjali','dindayal']],
  ['Bhringraj Taila','Taila','Hair & Scalp','Tikta, Kashaya','Ushna','Katu','Kapha-Vata hara; Keshya',              ['baidyanath','dabur','patanjali','vasu','kapiva','banlabs']],
  ['Nalpamaradi Taila','Taila','Skin','Kashaya, Tikta','Shita','Katu','Pitta-Kapha hara; Varnya',                   ['kottakkal','keralaayu','oushadhi','sitaram','nagarjuna']],

  // ── Ghritas ───────────────────────────────────────────────────────────────
  ['Brahmi Ghrita','Ghrita','Nervine','Tikta, Madhura','Shita','Madhura','Vata-Pitta hara; Medhya',                 ['kottakkal','oushadhi','keralaayu','baidyanath','vaidyaratnam']],
  ['Phala Ghrita','Ghrita','Womens Health','Madhura, Tikta','Shita','Madhura','Vata-Pitta hara; Garbhaprada',       ['kottakkal','oushadhi','keralaayu','vaidyaratnam','avp']],
  ['Triphala Ghrita','Ghrita','Eye Disorders','Kashaya, Madhura','Shita','Madhura','Tridoshahara; Chakshushya',     ['kottakkal','oushadhi','keralaayu','baidyanath','sitaram']],
  ['Panchatikta Ghrita Guggulu','Ghrita','Skin','Tikta','Ushna','Katu','Kapha-Pitta hara; Kushthaghna',             ['kottakkal','sdl','oushadhi','baidyanath','keralaayu']],
  ['Kalyanaka Ghrita','Ghrita','Mental Health','Tikta, Madhura','Shita','Madhura','Tridoshahara; Medhya',           ['kottakkal','oushadhi','vaidyaratnam','keralaayu']],
  ['Indukanta Ghrita','Ghrita','Digestive','Madhura, Tikta','Ushna','Madhura','Vata-Kapha hara; Dipana',            ['kottakkal','oushadhi','keralaayu','avp','sitaram']],

  // ── Kashayams (Kerala tradition) ──────────────────────────────────────────
  ['Maharasnadi Kashayam','Kashayam','Musculoskeletal','Tikta, Katu','Ushna','Katu','Vata-Kapha hara; Shoolahara',  ['kottakkal','keralaayu','oushadhi','avp','vaidyaratnam','nagarjuna','sitaram']],
  ['Guluchyadi Kashayam','Kashayam','Immunomodulator','Tikta','Shita','Katu','Pitta-Kapha hara; Jvarahara',         ['kottakkal','keralaayu','oushadhi','avp','sitaram']],
  ['Amritottaram Kashayam','Kashayam','Immunomodulator','Tikta','Ushna','Katu','Kapha-Vata hara; Jvarahara',        ['kottakkal','keralaayu','oushadhi','vaidyaratnam','avn']],
  ['Dashamoola Katutraya Kashayam','Kashayam','Respiratory','Tikta, Katu','Ushna','Katu','Kapha-Vata hara; Shvasahara',['kottakkal','keralaayu','oushadhi','avp','nagarjuna']],
  ['Drakshadi Kashayam','Kashayam','Headache','Madhura, Tikta','Shita','Madhura','Pitta-Vata hara; Dahahara',       ['kottakkal','keralaayu','oushadhi','sitaram']],
  ['Indukantham Kashayam','Kashayam','Digestive','Madhura, Tikta','Ushna','Madhura','Vata-Kapha hara; Balya',       ['kottakkal','keralaayu','oushadhi','avp','avn']],
  ['Sahacharadi Kashayam','Kashayam','Neurological','Tikta, Katu','Ushna','Katu','Vata hara; Shoolahara',           ['kottakkal','keralaayu','oushadhi','nagarjuna','vaidyaratnam']],
  ['Balaguluchyadi Kashayam','Kashayam','Musculoskeletal','Madhura, Tikta','Shita','Madhura','Vata-Pitta hara',     ['kottakkal','keralaayu','oushadhi','avp']],
  ['Vidaryadi Kashayam','Kashayam','Cardio-respiratory','Madhura','Shita','Madhura','Vata-Pitta hara; Brimhana',    ['kottakkal','keralaayu','oushadhi','sitaram','avn']],
  ['Patolakaturohinyadi Kashayam','Kashayam','Liver Disorders','Tikta','Shita','Katu','Pitta-Kapha hara',           ['kottakkal','keralaayu','oushadhi','avp']],

  // ── Bhasmas & Pishtis ─────────────────────────────────────────────────────
  ['Praval Pishti','Bhasma','Antacid','Madhura, Kashaya','Shita','Madhura','Pitta hara; Dahahara',                  ['baidyanath','sdl','unjha','dindayal','shriganga']],
  ['Mukta Pishti','Bhasma','Antacid','Madhura','Shita','Madhura','Pitta hara; Hridya',                              ['baidyanath','sdl','unjha']],
  ['Abhrak Bhasma','Bhasma','Adaptogen / Rasayana','Madhura, Kashaya','Shita','Madhura','Tridoshahara; Rasayana',   ['baidyanath','sdl','unjha','dindayal']],
  ['Loha Bhasma','Bhasma','Haematinic','Tikta, Kashaya','Shita','Madhura','Kapha-Pitta hara; Pandu hara',           ['baidyanath','sdl','unjha']],
  ['Yashad Bhasma','Bhasma','Antidiabetic','Kashaya, Tikta','Shita','Katu','Kapha-Pitta hara; Madhumehahara',       ['baidyanath','sdl','unjha','dindayal']],
  ['Trivanga Bhasma','Bhasma','Urological','Kashaya, Tikta','Ushna','Katu','Kapha-Vata hara; Mutrala',              ['baidyanath','sdl','unjha']],
  ['Kapardika Bhasma','Bhasma','Antacid','Katu, Kashaya','Ushna','Katu','Kapha-Vata hara; Amlapittahara',           ['baidyanath','sdl','unjha']],

  // ── Lehyas ────────────────────────────────────────────────────────────────
  ['Chyawanprash','Lehya','Adaptogen / Rasayana','Madhura, Amla','Ushna','Madhura','Tridoshahara; Rasayana',        ['dabur','baidyanath','zandu','patanjali','kottakkal','oushadhi','himalaya','organicindia','srisri','kapiva']],
  ['Brahma Rasayana','Lehya','Adaptogen / Rasayana','Madhura, Tikta','Ushna','Madhura','Tridoshahara; Medhya-Rasayana',['kottakkal','oushadhi','keralaayu','avp','vaidyaratnam']],
  ['Agastya Rasayana','Lehya','Respiratory','Madhura, Katu','Ushna','Madhura','Kapha-Vata hara; Kasahara',          ['kottakkal','oushadhi','keralaayu','avp','sitaram']],
  ['Dashamoola Haritaki Lehyam','Lehya','Post-natal Care','Tikta, Kashaya','Ushna','Katu','Vata-Kapha hara',        ['kottakkal','oushadhi','keralaayu','vaidyaratnam']],
  ['Shatavari Gulam','Lehya','Womens Health','Madhura','Shita','Madhura','Vata-Pitta hara; Stanyajanana',           ['kottakkal','oushadhi','keralaayu','avp','sitaram']],
  ['Drakshadi Lehyam','Lehya','Respiratory','Madhura','Shita','Madhura','Pitta-Vata hara; Kasahara',                ['kottakkal','oushadhi','sitaram','avn']],
];

// Well-known proprietary products, under the company that actually makes them.
// [brand, maker, formulation it belongs to, form, pack, mrp]
const PROPRIETARY = [
  ['Himalaya Liv.52',        'himalaya',  'Kumaryasava',        'Tablet', '100 tablets', 190],
  ['Himalaya Liv.52 DS',     'himalaya',  'Kumaryasava',        'Tablet', '60 tablets',  215],
  ['Himalaya Septilin',      'himalaya',  'Guduchi',            'Tablet', '60 tablets',  195],
  ['Himalaya Bonnisan',      'himalaya',  'Jeerakarishta',      'Syrup',  '120 ml',      130],
  ['Himalaya Speman',        'himalaya',  'Gokshura',           'Tablet', '60 tablets',  215],
  ['Himalaya Menosan',       'himalaya',  'Ashokarishta',       'Tablet', '60 tablets',  225],
  ['Himalaya Geriforte',     'himalaya',  'Chyawanprash',       'Tablet', '100 tablets', 210],
  ['Himalaya Gasex',         'himalaya',  'Hingvastak',         'Tablet', '100 tablets', 165],
  ['Zandu Balm',             'zandu',     'Mahanarayan Taila',  'Balm',   '25 ml',        95],
  ['Zandu Nityam Churna',    'zandu',     'Panchasakar Churna', 'Churna', '100 g',       150],
  ['Dabur Pudin Hara',       'dabur',     'Hingvastak',         'Capsule','30 capsules',  75],
  ['Dabur Lal Tail',         'dabur',     'Ksheerabala Taila',  'Taila',  '100 ml',      145],
  ['Dabur Shilajit Gold',    'dabur',     'Abhrak Bhasma',      'Capsule','20 capsules', 310],
  ['Charak M2-Tone',         'charak',    'Ashokarishta',       'Syrup',  '200 ml',      210],
  ['Charak Evanova',         'charak',    'Ashokarishta',       'Capsule','30 capsules', 265],
  ['Charak Livomyn',         'charak',    'Arogyavardhini Vati','Tablet', '60 tablets',  215],
  ['Alarsin Myron',          'alarsin',   'Ashokarishta',       'Tablet', '40 tablets',  180],
  ['Alarsin Addyzoa',        'alarsin',   'Gokshura',           'Capsule','20 capsules', 240],
  ['Vasu Trichup Oil',       'vasu',      'Neelibhringadi Taila','Taila', '200 ml',      235],
  ['Vasu UT Capsules',       'vasu',      'Chandraprabha',      'Capsule','60 capsules', 265],
  ['Pankajakasthuri Breathe Eazy','pankaja','Agastya Rasayana', 'Granules','200 g',      420],
  ['Amrutanjan Pain Balm',   'amrutanjan','Mahanarayan Taila',  'Balm',   '18 ml',        70],
  ['Aimil BGR-34',           'aimil',     'Nisha Amalaki',      'Tablet', '100 tablets', 545],
  ['Aimil Amlycure DS',      'aimil',     'Arogyavardhini Vati','Syrup',  '200 ml',      235],
  ['Maharishi Amrit Kalash', 'maharishi', 'Brahma Rasayana',    'Lehyam', '600 g',       960],
  ['Multani Kabjex',         'multani',   'Panchasakar Churna', 'Churna', '100 g',       105],
  ['Jiva Livtone Syrup',     'jiva',      'Kumaryasava',        'Syrup',  '200 ml',      190],
  ['Sri Sri Tattva Ashwagandha','srisri', 'Ashwagandha',        'Tablet', '60 tablets',  180],
  ['Kapiva Ashwagandha Juice','kapiva',   'Ashwagandha',        'Juice',  '1 litre',     385],
  ['Dey’s Keo Karpin Hair Oil','deys','Bhringraj Taila',   'Taila',  '200 ml',      165],
  ['Ban Labs Rumatone Gold', 'banlabs',   'Mahanarayan Taila',  'Taila',  '60 ml',       215],
  ['Gufic Sallaki',          'gufic',     'Shallaki',           'Tablet', '30 tablets',  325],
  ['Solumiks Nirocil',       'solumiks',  'Khadira',            'Tablet', '60 tablets',  245],
  ['SKM Amukkara Choornam',  'skm',       'Ashwagandha',        'Churna', '100 g',       125],
  ['AVN Manasamitra Vatakam','avn',       'Jatamansi',          'Vatakam','100 tablets', 690],
  ['Bipha Dashamoolarishtam','bipha',     'Dashamool',          'Arishta','450 ml',      195],
];

// ── Practitioners ───────────────────────────────────────────────────────────
// Synthetic: plausible names placed in real localities so "search by area"
// behaves like the real directory. These are not real people.
// name | speciality | qualification | yrs | clinic | area | city | state | fee | languages
const NEW_DOCTORS = [
  ['Dr. Anjali Deshpande','Panchakarma','BAMS, MD (Panchakarma)',13,'Atreya Panchakarma Kendra','Kothrud','Pune','Maharashtra',700,'Marathi, Hindi, English'],
  ['Dr. Rohan Kulkarni','Musculoskeletal Disorders','BAMS',9,'Asthi Ayurveda Clinic','Shivaji Nagar','Pune','Maharashtra',500,'Marathi, Hindi, English'],
  ['Dr. Sneha Patil','Womens Health','BAMS, MD (Prasuti Tantra)',11,'Stree Swasthya Ayurveda','Aundh','Pune','Maharashtra',600,'Marathi, Hindi, English'],
  ['Dr. Aditya Kher','Digestive Disorders','BAMS',7,'Agni Ayurveda Centre','Dadar East','Mumbai','Maharashtra',650,'Marathi, Hindi, English'],
  ['Dr. Nikhil Sawant','Skin Disorders','BAMS, MD (Kayachikitsa)',14,'Twacha Ayurveda Clinic','Andheri West','Mumbai','Maharashtra',800,'Marathi, Hindi, English'],
  ['Dr. Priyanka Joshi','Mental Health','BAMS, MD (Manas Roga)',10,'Sattva Mind Care','Vashi','Navi Mumbai','Maharashtra',750,'Marathi, Hindi, English'],
  ['Dr. Sameer Gokhale','Liver Disorders','BAMS, MD',16,'Yakrit Care Ayurveda','Thane West','Thane','Maharashtra',700,'Marathi, Hindi, English'],
  ['Dr. Vaishali More','Pediatric Ayurveda','BAMS',8,'Bala Arogya Ayurveda','Nashik Road','Nashik','Maharashtra',450,'Marathi, Hindi'],
  ['Dr. Ashwin Kumar','Neurological Disorders','BAMS, MD (Kayachikitsa)',15,'Vata Neuro Ayurveda','Jayanagar 4th Block','Bengaluru','Karnataka',800,'Kannada, Tamil, English'],
  ['Dr. Divya Shetty','Hair & Scalp','BAMS',6,'Kesha Care Ayurveda','Rajajinagar','Bengaluru','Karnataka',450,'Kannada, Tulu, English'],
  ['Dr. Manjunath Gowda','Diabetic Care','BAMS, MD',12,'Madhu Ayurveda Centre','Yelahanka','Bengaluru','Karnataka',550,'Kannada, English'],
  ['Dr. Rekha Hegde','Womens Health','BAMS, MD (Stri Roga)',10,'Shakti Ayurveda for Women','Malleshwaram','Bengaluru','Karnataka',650,'Kannada, Konkani, English'],
  ['Dr. Srinivas Bhat','Panchakarma','BAMS, MD (Panchakarma)',18,'Shuddhi Panchakarma Kendra','Vijayanagar','Mysuru','Karnataka',600,'Kannada, English'],
  ['Dr. Sushma Rao','Eye Disorders','BAMS, MD (Shalakya)',11,'Netra Ayurveda Clinic','Kadri','Mangaluru','Karnataka',550,'Kannada, Tulu, English'],
  ['Dr. Basavaraj Patil','Musculoskeletal Disorders','BAMS',9,'Sandhi Ayurveda Centre','Vidyanagar','Hubballi','Karnataka',400,'Kannada, Marathi, Hindi'],
  ['Dr. Lakshmi Narayanan','Cardiovascular Disorders','BAMS, MD',17,'Hridaya Ayurveda Chennai','Anna Nagar West','Chennai','Tamil Nadu',800,'Tamil, English'],
  ['Dr. Karthik Subramanian','Respiratory Disorders','BAMS',8,'Shvasa Ayurveda Clinic','Velachery','Chennai','Tamil Nadu',500,'Tamil, English'],
  ['Dr. Revathi Balakrishnan','Pediatric Ayurveda','BAMS, MD (Kaumarabhritya)',12,'Bala Ayurveda Madurai','K. K. Nagar','Madurai','Tamil Nadu',450,'Tamil, English'],
  ['Dr. Muthu Vel','Panchakarma','BAMS',10,'Kayakalpa Panchakarma','Thillai Nagar','Tiruchirappalli','Tamil Nadu',500,'Tamil, English'],
  ['Dr. Priya Venkatesh','Skin Disorders','BAMS, MD',9,'Varna Skin Ayurveda','R. S. Puram','Coimbatore','Tamil Nadu',550,'Tamil, Malayalam, English'],
  ['Dr. Hari Menon','Panchakarma','BAMS, MD (Panchakarma)',20,'Vaidyaratnam Panchakarma','Ollur','Thrissur','Kerala',900,'Malayalam, English'],
  ['Dr. Anitha Krishnan','Womens Health','BAMS, MD (Prasuti)',13,'Sreedhanya Ayurveda','Kaloor','Kochi','Kerala',650,'Malayalam, English, Hindi'],
  ['Dr. Rajeev Nair','Neurological Disorders','BAMS, MD',15,'Marma Neuro Ayurveda','Medical College','Kozhikode','Kerala',700,'Malayalam, English'],
  ['Dr. Sindhu Raveendran','Geriatric Ayurveda','BAMS',8,'Jara Ayurveda Kannur','Thavakkara','Kannur','Kerala',450,'Malayalam, English'],
  ['Dr. Gopakumar P','Musculoskeletal Disorders','BAMS, MD (Kayachikitsa)',14,'Asthi Marma Ayurveda','Kollam Beach Road','Kollam','Kerala',600,'Malayalam, Tamil, English'],
  ['Dr. Deepa Thomas','Detox Programs','BAMS',9,'Shodhana Ayurveda Retreat','Alappuzha Beach','Alappuzha','Kerala',700,'Malayalam, English'],
  ['Dr. Arvind Sharma','Chronic Disease Management','BAMS, MD',16,'Charaka Ayurveda Delhi','Karol Bagh','New Delhi','Delhi',700,'Hindi, Punjabi, English'],
  ['Dr. Neha Bhardwaj','Womens Health','BAMS, MD (Stri Roga)',10,'Stree Ayurveda Dwarka','Dwarka Sector 12','New Delhi','Delhi',650,'Hindi, English'],
  ['Dr. Vikas Malhotra','Obesity Management','BAMS',7,'Medohara Wellness','Rohini Sector 9','New Delhi','Delhi',550,'Hindi, Punjabi, English'],
  ['Dr. Ritu Chawla','Skin Disorders','BAMS, MD',11,'Twak Ayurveda Gurugram','Sector 56','Gurugram','Haryana',750,'Hindi, English'],
  ['Dr. Sandeep Yadav','Musculoskeletal Disorders','BAMS',8,'Sandhi Ayurveda Noida','Sector 62','Noida','Uttar Pradesh',600,'Hindi, English'],
  ['Dr. Alok Mishra','Liver Disorders','BAMS, MD',13,'Yakrit Ayurveda Lucknow','Gomti Nagar','Lucknow','Uttar Pradesh',600,'Hindi, English'],
  ['Dr. Shalini Dwivedi','Mental Health','BAMS, MD (Manas Roga)',12,'Manas Ayurveda Varanasi','Lanka','Varanasi','Uttar Pradesh',550,'Hindi, Bhojpuri, English'],
  ['Dr. Ramakant Tiwari','Panchakarma','BAMS, MD (Panchakarma)',19,'Kashi Panchakarma Kendra','Bhelupur','Varanasi','Uttar Pradesh',650,'Hindi, Sanskrit, English'],
  ['Dr. Pooja Agarwal','Pediatric Ayurveda','BAMS',6,'Bal Ayurveda Kanpur','Swaroop Nagar','Kanpur','Uttar Pradesh',400,'Hindi, English'],
  ['Dr. Yogesh Rawat','Detox Programs','BAMS, MD',14,'Ganga Shuddhi Ayurveda','Jwalapur','Haridwar','Uttarakhand',700,'Hindi, Garhwali, English'],
  ['Dr. Meera Negi','Adaptogen & Rasayana','BAMS',9,'Rasayana Ayurveda Dehradun','Rajpur Road','Dehradun','Uttarakhand',550,'Hindi, Garhwali, English'],
  ['Dr. Harpreet Singh','Musculoskeletal Disorders','BAMS',10,'Sandhi Ayurveda Amritsar','Ranjit Avenue','Amritsar','Punjab',500,'Punjabi, Hindi, English'],
  ['Dr. Gurpreet Kaur','Womens Health','BAMS, MD',11,'Stree Ayurveda Ludhiana','Sarabha Nagar','Ludhiana','Punjab',550,'Punjabi, Hindi, English'],
  ['Dr. Rakesh Jain','Digestive Disorders','BAMS, MD',15,'Agni Ayurveda Jaipur','Malviya Nagar','Jaipur','Rajasthan',600,'Hindi, Rajasthani, English'],
  ['Dr. Sunita Rathore','Skin Disorders','BAMS',8,'Twacha Ayurveda Jodhpur','Shastri Nagar','Jodhpur','Rajasthan',450,'Hindi, Rajasthani'],
  ['Dr. Mahendra Solanki','Chronic Disease Management','BAMS, MD',13,'Arogya Ayurveda Udaipur','Hiran Magri','Udaipur','Rajasthan',500,'Hindi, Rajasthani, English'],
  ['Dr. Jignesh Patel','Endocrine Disorders','BAMS, MD',12,'Hormone Ayurveda Ahmedabad','Satellite','Ahmedabad','Gujarat',650,'Gujarati, Hindi, English'],
  ['Dr. Falguni Mehta','Womens Health','BAMS',9,'Stree Ayurveda Surat','Adajan','Surat','Gujarat',550,'Gujarati, Hindi, English'],
  ['Dr. Bhavesh Trivedi','Urinary Disorders','BAMS, MD',14,'Mutra Ayurveda Vadodara','Alkapuri','Vadodara','Gujarat',600,'Gujarati, Hindi, English'],
  ['Dr. Sanjay Verma','Respiratory Disorders','BAMS',10,'Shvasa Ayurveda Bhopal','Arera Colony','Bhopal','Madhya Pradesh',500,'Hindi, English'],
  ['Dr. Kavita Nagar','Allergy Treatment','BAMS, MD',11,'Prana Allergy Care','Vijay Nagar','Indore','Madhya Pradesh',550,'Hindi, English'],
  ['Dr. Prashant Deshmukh','Musculoskeletal Disorders','BAMS',9,'Asthi Ayurveda Nagpur','Dharampeth','Nagpur','Maharashtra',500,'Marathi, Hindi, English'],
  ['Dr. Sunil Sahu','Chronic Disease Management','BAMS',8,'Arogya Ayurveda Raipur','Shankar Nagar','Raipur','Chhattisgarh',450,'Hindi, Chhattisgarhi'],
  ['Dr. Amit Kujur','Immune Disorders','BAMS, MD',12,'Ojas Ayurveda Ranchi','Lalpur','Ranchi','Jharkhand',500,'Hindi, English'],
  ['Dr. Ranjan Das','Digestive Disorders','BAMS',10,'Agni Ayurveda Patna','Boring Road','Patna','Bihar',450,'Hindi, Bhojpuri, English'],
  ['Dr. Sudeshna Ghosh','Mental Health','BAMS, MD (Manas Roga)',13,'Manas Ayurveda Kolkata','Ballygunge','Kolkata','West Bengal',650,'Bengali, Hindi, English'],
  ['Dr. Abhijit Sen','Cardiovascular Disorders','BAMS, MD',16,'Hridaya Ayurveda Kolkata','Salt Lake Sector 2','Kolkata','West Bengal',700,'Bengali, Hindi, English'],
  ['Dr. Pratima Mohanty','Womens Health','BAMS',9,'Stree Ayurveda Bhubaneswar','Saheed Nagar','Bhubaneswar','Odisha',500,'Odia, Hindi, English'],
  ['Dr. Bhaskar Barua','Respiratory Disorders','BAMS, MD',11,'Shvasa Ayurveda Guwahati','Zoo Road','Guwahati','Assam',500,'Assamese, Hindi, English'],
  ['Dr. Nitin Bansal','Geriatric Ayurveda','BAMS',10,'Jara Ayurveda Chandigarh','Sector 35','Chandigarh','Chandigarh',600,'Hindi, Punjabi, English'],
  ['Dr. Padmaja Rao','Endocrine Disorders','BAMS, MD',14,'Hormone Ayurveda Hyderabad','Jubilee Hills','Hyderabad','Telangana',750,'Telugu, Hindi, English'],
  ['Dr. Srikanth Reddy','Liver Disorders','BAMS',9,'Yakrit Ayurveda Secunderabad','Begumpet','Hyderabad','Telangana',600,'Telugu, Hindi, English'],
  ['Dr. Lavanya Chowdary','Skin Disorders','BAMS, MD',11,'Varna Ayurveda Vijayawada','Benz Circle','Vijayawada','Andhra Pradesh',550,'Telugu, English'],
  ['Dr. Suresh Varma','Panchakarma','BAMS, MD (Panchakarma)',17,'Kayakalpa Panchakarma Vizag','MVP Colony','Visakhapatnam','Andhra Pradesh',650,'Telugu, Hindi, English'],
];

// ── Runner ──────────────────────────────────────────────────────────────────
const pick = (seed, lo, hi) => lo + (seed * 37 % (hi - lo + 1));   // deterministic
const packFor = (form, seed) => ({
  Arishta:['450 ml','435 ml'], Asava:['450 ml','435 ml'], Churna:['100 g','60 g','200 g'],
  Vati:['60 tablets','80 tablets','40 tablets'], Tablet:['60 tablets','100 tablets'],
  Taila:['200 ml','100 ml','450 ml'], Ghrita:['150 ml','200 ml'],
  Kashayam:['200 ml','450 ml'], Bhasma:['5 g','10 g'], Lehyam:['500 g','250 g','1 kg'],
}[form] || ['1 unit'])[seed % (({Arishta:2,Asava:2,Churna:3,Vati:3,Tablet:2,Taila:3,Ghrita:2,Kashayam:2,Bhasma:2,Lehyam:3}[form]) || 1)];

(async () => {
  try {
    let addedDrugs = 0, addedBrands = 0, addedDocs = 0;

    // ── Formulations ────────────────────────────────────────────────────────
    console.log('→ Formulations');
    for (const [name, type, category, rasa, virya, vipaka, dosha, makers] of NEW_FORMULATIONS) {
      const t = TYPE[type];
      const [ex] = await db.query('SELECT drug_id FROM Drugs WHERE name=?', [name]);
      let drugId;
      if (ex.length) {
        drugId = ex[0].drug_id;
      } else {
        const [r] = await db.query(
          `INSERT INTO Drugs (name, category, description, traditional_use, is_active,
                              generic_name, botanical_name, dosage_form, source_type,
                              source_subtype, preparation_class, part_used, rasa, guna,
                              virya, vipaka, dosha_effect, classical_reference, dosage,
                              anupana, contraindications)
           VALUES (?,?,?,?,1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [name, category, `Classical ${type.toLowerCase()} preparation.`,
           `Traditionally used in ${category.toLowerCase()} conditions.`,
           name, 'Classical polyherbal formulation', t.form, t.src, t.sub, t.prep,
           'Compound preparation', rasa, 'Per classical text', virya, vipaka, dosha,
           t.ref, t.dose, t.anupana, t.ci || 'Use on a registered practitioner’s advice']);
        drugId = r.insertId; addedDrugs++;
      }
      // Brands: the classical medicine as each house actually sells it.
      for (let i = 0; i < makers.length; i++) {
        const mk = makers[i];
        if (!MAKERS[mk]) continue;
        const brand = `${SHORT[mk]} ${name}`;
        const mrp = pick(name.length + i, 95, 480);
        const [r] = await db.query(
          `INSERT INTO Medicine_Brands (drug_id, brand_name, manufacturer, dosage_form, pack_size, mrp)
           VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE drug_id=VALUES(drug_id)`,
          [drugId, brand, MAKERS[mk][0], t.form, packFor(t.form, i), mrp]);
        if (r.affectedRows === 1) addedBrands++;
      }
    }
    console.log(`   +${addedDrugs} formulations, +${addedBrands} brands`);

    // ── Proprietary products ────────────────────────────────────────────────
    console.log('→ Proprietary products');
    let prop = 0, skipped = [];
    for (const [brand, mk, formulation, form, pack, mrp] of PROPRIETARY) {
      const [d] = await db.query('SELECT drug_id FROM Drugs WHERE name=?', [formulation]);
      if (!d.length) { skipped.push(`${brand} (no ${formulation})`); continue; }
      const [r] = await db.query(
        `INSERT INTO Medicine_Brands (drug_id, brand_name, manufacturer, dosage_form, pack_size, mrp)
         VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE drug_id=VALUES(drug_id), mrp=VALUES(mrp)`,
        [d[0].drug_id, brand, MAKERS[mk][0], form, pack, mrp]);
      if (r.affectedRows === 1) prop++;
    }
    console.log(`   +${prop} proprietary brands${skipped.length ? ` (${skipped.length} skipped)` : ''}`);
    if (skipped.length) skipped.forEach(s => console.log(`     ⚠ ${s}`));

    // ── Practitioners ───────────────────────────────────────────────────────
    console.log('→ Practitioners');
    // One shared placeholder hash; these accounts are directory entries, not
    // sign-ins. A real doctor gets credentials through the approval flow.
    const hash = await bcrypt.hash(require('crypto').randomBytes(24).toString('hex'), 10);
    for (const [name, spec, qual, yrs, clinic, area, city, state, fee, langs] of NEW_DOCTORS) {
      const email = name.toLowerCase().replace(/^dr\.?\s*/, '').replace(/[^a-z]+/g, '.')
                    .replace(/^\.|\.$/g, '') + '@ayushi-directory.in';
      const [ex] = await db.query('SELECT user_id FROM Users WHERE email=?', [email]);
      if (ex.length) continue;
      await db.query(
        `INSERT INTO Users (name,email,phone,password_hash,role,qualification,specialization,
                            experience_years,is_verified,is_active,clinic_name,area,city,state,
                            consultation_fee,languages)
         VALUES (?,?,?,?,'doctor',?,?,?,1,1,?,?,?,?,?,?)`,
        [name, email, '9' + String(800000000 + (name.length * 7654321) % 199999999).slice(0, 9),
         hash, qual, spec, yrs, clinic, area, city, state, fee, langs]);
      addedDocs++;
    }
    console.log(`   +${addedDocs} practitioners`);

    const [[t]] = await db.query(`SELECT
      (SELECT COUNT(*) FROM Users WHERE role='doctor' AND is_active=1) doctors,
      (SELECT COUNT(DISTINCT city)  FROM Users WHERE role='doctor') cities,
      (SELECT COUNT(DISTINCT state) FROM Users WHERE role='doctor') states,
      (SELECT COUNT(*) FROM Drugs WHERE is_active=1) formulations,
      (SELECT COUNT(*) FROM Medicine_Brands WHERE is_active=1) brands,
      (SELECT COUNT(DISTINCT manufacturer) FROM Medicine_Brands) makers`);
    console.log(`\n✅ Directory now: ${t.doctors} doctors · ${t.cities} cities · ${t.states} states · ` +
                `${t.formulations} formulations · ${t.brands} brands · ${t.makers} manufacturers\n`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
  }
})();
