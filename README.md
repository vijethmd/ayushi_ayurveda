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
│   ├── controllers/          # dashboard, patients, doctors, AI, etc.
│   ├── routes/               # JSON API routes (/api/*)
│   ├── middleware/           # auth
│   ├── utils/                # mailer, efficacyEngine, drugResearch, gemini
│   ├── views/                # EJS pages + partials
│   └── sql/                  # schema.sql, seed.sql, seed_timeline_responses.js
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
# 3. Configure .env (copy from .env.example), then:
npm start        # or: npm run dev
```

> `.env` lives in `backend/`. The app loads it via an absolute path, so it works whether you
> run `npm start` from `backend/` or `node backend/server.js` from the repo root.

App runs at **http://localhost:5000** → `/login`.

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
