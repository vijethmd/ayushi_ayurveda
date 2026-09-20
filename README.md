# 🌿 AYUSHI — Ayurvedic Patient Data Management System

Full-stack EJS + Express + MySQL platform for managing Ayurvedic patients, treatments,
drug-efficacy research, disease intelligence, and AI-powered clinical insights.

## Project structure

The **backend is self-contained** (its own `package.json`, `node_modules`, and `.env`).
The **frontend** is static assets (CSS/JS) served by the backend via `express.static` — it
has no Node runtime, so it has no `package.json`/`node_modules`.

```
ayushii/
├── backend/                  # the deployable Node app
│   ├── package.json          # scripts run server.js
│   ├── node_modules/
│   ├── .env                  # environment config (DB, JWT, email, Gemini)
│   ├── server.js             # Express app + all web/API routes
│   ├── config/db.js          # MySQL pool
│   ├── content/              # ayurveda.js (shloka, Maharshis, manufacturers,
│   │                         #   education, reference links), portraits.js (SVG)
│   ├── controllers/          # dashboard, patients, doctors, AI, publicController,
│   │                         #   consultationController, etc.
│   ├── routes/               # JSON API routes (/api/*)
│   ├── middleware/           # auth, upload (multer — PDF/DOC/DOCX/JPEG/PNG)
│   ├── uploads/              # uploaded reports & discharge summaries (gitignored)
│   ├── utils/                # mailer, efficacyEngine, drugResearch, gemini
│   ├── views/                # EJS pages + partials (landing, search-results, public-header)
│   └── sql/                  # schema.sql, seed.sql, seed_timeline_responses.js,
│                             # seed_public_directory.js, seed_materia_medica.js,
│                             # migrate_consultations.js
└── frontend/                 # static assets served by the backend
    ├── css/main.css          # served as /css/main.css
    └── js/main.js            # served as /js/main.js
```

## Setup

```bash
cd backend
npm install
# 1. Create the database + tables
mysql -u root -p < sql/schema.sql
# 2. Seed demo data (admin, doctors, patients, diseases, drugs)
mysql -u root -p < sql/seed.sql
# 3. Add the public directory columns + India-specific sample data
node sql/seed_public_directory.js
# 4. Add the Materia Medica axes (derivation, rasapanchaka) for every drug
node sql/seed_materia_medica.js
# 5. Add the clinical intake tables (Consultations, Attachments, discharge cols)
node sql/migrate_consultations.js
# 6. Configure .env (copy from .env.example), then:
npm start        # or: npm run dev
```

> `.env` lives in `backend/`. The app loads it via an absolute path, so it works whether you
> run `npm start` from `backend/` or `node backend/server.js` from the repo root.

App runs at **http://localhost:5000** → the public landing page. Clinicians sign in at `/login`.

## Public directory (no login required)

`/` is a public landing page — no sign-in form on it; the header's **Sign In** button goes to
`/login`. The header's **Search** dropdown searches the directory:

| Search | Facets |
|---|---|
| **Doctors**   | by Speciality · by Area |
| **Medicines** | by Generic Name · by Brand Name · by Manufacturer |

Picking a facet opens a query box with live suggestions from
`GET /api/public/suggest?type=&by=&q=`; results render at
`GET /search?type=&by=&q=` (an empty `q` lists everything).

`node sql/seed_public_directory.js` populates this layer — it adds
`Users.clinic_name/area/city/state/consultation_fee/languages`,
`Drugs.generic_name/botanical_name/dosage_form` and a `Medicine_Brands` table, then fills them
with 26 doctors across 15 Indian cities and 183 brands from 16 real Indian Ayurvedic
manufacturers (Dabur, Himalaya, Baidyanath, Dhootapapeshwar, Kottakkal, Patanjali, Kerala
Ayurveda, Charak, Unjha, Organic India, Zandu/Emami, Aimil, Sandu, Maharishi, Sidpur).
The script is idempotent. Pack sizes and MRPs are indicative sample values, not a live price list.

## Hosting the database

The app reads its database from either a single connection string or discrete variables, so it
runs against localhost or a hosted server with no code change:

```
DATABASE_URL=mysql://user:password@host.provider.com:3306/ayushi_db   # wins if set
# — or —
DB_HOST=  DB_PORT=  DB_USER=  DB_PASSWORD=  DB_NAME=
```

TLS is off for localhost and on for hosted providers — set `DB_SSL=true`, or point `DB_SSL_CA`
at a CA bundle if the provider supplies one. Pool size and connect timeout adapt automatically
when the host is remote (`DB_POOL_SIZE`, `DB_CONNECT_TIMEOUT` to override).

### Moving to a hosted MySQL

1. Create a free MySQL instance. [Aiven](https://aiven.io/pricing/mysql) has a free plan
   (1 GB storage, no card) — ample for this database, which is 7.34 MB across 16 tables.
2. Copy the connection string ("Service URI") from the provider's console.
3. Import everything in one command:

   ```bash
   ./backend/sql/import_to_host.sh 'mysql://user:pass@host:3306/dbname'
   ```

   That imports the dump, re-runs the three migration scripts and verifies the result.
4. Put the same string into `backend/.env` as `DATABASE_URL`, and restart.

### Host compatibility

Hosted MySQL is often configured differently from a local install. Two differences this project
hit on Aiven, both handled:

- **ANSI mode.** Aiven runs with `ANSI_QUOTES` and `PIPES_AS_CONCAT`, where `"doctor"` is an
  *identifier* rather than a string — so `WHERE role="doctor"` fails with *Unknown column*.
  The queries now use single-quoted literals, and `config/db.js` drops just those two flags per
  session while leaving every strictness flag the host sets (`STRICT_ALL_TABLES`, `NO_ZERO_DATE`
  …) untouched.
- **`sql_require_primary_key=ON`.** Every table here already has one, so the import was clean;
  worth knowing if you add a table later.

### Regenerating the dump

```bash
mysqldump --protocol=TCP -h127.0.0.1 -uroot -p \
  --single-transaction --routines --triggers --events \
  --set-gtid-purged=OFF --no-tablespaces --default-character-set=utf8mb4 \
  ayushi_db > backend/sql/dump/ayushi_db.sql
```

The dump carries no `CREATE DATABASE`, `USE` or `DEFINER` statements, so it imports into a
database the provider created for you, under a user without `SUPER`. `ayushi_db.mariadb.sql` is
the same data with `utf8mb4_general_ci` collation, for MariaDB-based hosts. Dumps are gitignored.

### Checking a connection

```bash
node backend/sql/check_db.js
```

Reports the server version, every table with its row count, whether the migration columns are
present, and whether the credentials can write.

## Public pages

| Page | What it is |
|---|---|
| `/` | Landing — alternating आयुष्मान् भव ⇄ AYUSHMAN BHAVA title, the Sushruta *svastha* shloka (click to hear it recited), an introduction to Ayurveda, and the twelve Maharshis |
| `/materia-medica` | Every drug as a two-level tree — **derivation** (Audbhida / Parthiva / Jangama) → **category** → drug. Toggle to group by category instead |
| `/materia-medica/:id` | One drug in full: rasapanchaka (rasa, guna, virya, vipaka, doshaghnata), part used, dose, anupana, classical source, cautions, and every brand that supplies it |
| `/manufacturers` | The AYUSH manufacturers behind the catalogue, with live brand counts |
| `/education` | How to qualify in Ayurveda — NCISM, BAMS/MD/PhD, NEET-UG and AIAPGET, and the leading institutions |

### The shloka

The verse under the title is Sushruta's definition of health (Sutrasthana 15.48). Clicking it
recites the four padas in turn, highlighting each, using the **browser's own speech synthesis** —
there is no audio file to ship or license. A Devanagari-capable voice (`hi-IN`/`sa-IN`) reads the
Sanskrit; on a device without one it falls back to the IAST transliteration and says so. It is an
approximate cadence, not a trained chant.

### Maharshi portraits

No photograph of these figures exists — they predate photography by 1500–2500 years. Five have a
surviving depiction (statue or temple art); the other seven have none.

| | Source | Credit |
|---|---|---|
| Dhanvantari | Statue | Rajasekhar1961, CC BY-SA 4.0 |
| Sushruta | Bust, Banaras | Dr.jayan.d, CC BY-SA 3.0 |
| Charaka | Statue | Alokprasad, CC BY-SA 3.0 |
| Kashyapa | Statue, Andhra Pradesh | Srikar Kashyap, CC BY-SA 4.0 |
| Jivaka | Temple mural, Thailand | Photo Dharma (Sadao), CC BY 2.0 |

All five are from Wikimedia Commons, cropped to the figure and stored in
`frontend/img/maharshis/` (~168 KB total). Attribution is rendered under the section, as CC BY-SA
requires. The remaining seven — Atreya, Agnivesha, Vagbhata, Nagarjuna, Madhavakara,
Sharangadhara and Bhavamishra — carry a drawn SVG emblem from `backend/content/portraits.js`
showing the attribute each is remembered for. Photos and emblems share one circular frame and a
sepia-green treatment so they read as a single set.

## Clinical intake — the initial query

When a patient arrives, the **Consultations** tab on their record takes the initial query. One
consultation carries all six parts:

| | Field | Stored as |
|---|---|---|
| a | Chief complaint | `Consultations.chief_complaint` |
| b | Diagnosis | `Consultations.diagnosis` (+ optional `disease_id`) |
| c | Report | `Attachments` — PDF, DOC/DOCX, JPEG or PNG, up to 4 files × 10 MB |
| d | Duration | `Consultations.duration_value` + `duration_unit` |
| e | Drugs advised | `Consultations.drugs_json` — name, dosage, frequency |
| f | Outcome | `Consultations.outcome` (Pending / Improved / No Change / Worsened / Cured / Referred) |

Every consultation writes a `Timeline_Events` row, so the existing patient timeline and the AI
reports that read it keep working unchanged.

### Final status & discharge

Each treatment has a **final status** — Active, Discharged, Referred, Lost to Follow-up or
Deceased — with a discharge date, a typed discharge summary, and the signed summary uploaded as a
file. Set it from the discharge button on any treatment row.

Uploads live in `backend/uploads/`, are gitignored, and are served only through
`GET /attachments/:id` behind `requireLogin` — never from the static directory.

## Login

- **Admin:** `ayushiayurveda.repo@gmail.com` / `password123`
- **Doctors:** join via **Sign Up → admin approval** (see below)

## Doctor onboarding (request → approval flow)

1. A prospective doctor opens the login page, clicks **Sign Up**, and submits their
   **name, email, phone, specialization, and a description**.
2. The request appears in the admin's **Join Requests** page (sidebar shows a red count badge).
3. The admin clicks **Approve & Email**: a random temporary password is generated, a doctor
   account is created, and the credentials are emailed to the applicant.
   - Approval is **blocked unless email is configured** (so credentials always reach the doctor).
4. The doctor logs in with the emailed password and can change it under **Profile → Change Password**.

## Email configuration (required for approvals)

In `.env`, set a Gmail **App Password** (not your normal password):

```
EMAIL_USER=ayushiayurveda.repo@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
EMAIL_FROM=AYUSHI Clinic <ayushiayurveda.repo@gmail.com>
```

Create one at https://myaccount.google.com/apppasswords (enable 2FA first).
Until this is set, the Join Requests page shows a warning and the Approve button is disabled.
