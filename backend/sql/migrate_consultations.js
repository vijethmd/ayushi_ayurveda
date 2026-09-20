/**
 * Clinical intake migration — initial query (chief complaint) + discharge.
 * ------------------------------------------------------------------------
 * Adds:
 *   Consultations  — the intake record a patient gets on arrival:
 *                    chief complaint, diagnosis, duration, drugs, outcome.
 *   Attachments    — uploaded reports (PDF/DOCX/JPEG) and discharge summaries,
 *                    hung off a patient / consultation / treatment.
 *   Treatments     — final_status, discharge_date, discharge_summary columns.
 *
 * Nothing existing is dropped or rewritten; every current table keeps its shape.
 * Idempotent.  Run:  node backend/sql/migrate_consultations.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

const addColumn = async (table, column, ddl) => {
  const [r] = await db.query(
    `SELECT COUNT(*) c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, [table, column]);
  if (r[0].c === 0) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    console.log(`   + ${table}.${column}`);
  }
};

(async () => {
  try {
    console.log('→ Consultations (initial query / chief complaint)');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Consultations (
        consultation_id   INT AUTO_INCREMENT PRIMARY KEY,
        patient_id        INT NOT NULL,
        treatment_id      INT NULL,
        doctor_id         INT NULL,
        disease_id        INT NULL,
        consultation_date DATE NOT NULL,
        visit_type        ENUM('Initial','Follow-up','Review') DEFAULT 'Initial',
        -- a. chief complaint
        chief_complaint   TEXT NOT NULL,
        -- b. diagnoses
        diagnosis         TEXT NULL,
        -- d. duration of the complaint before presenting
        duration_value    INT NULL,
        duration_unit     ENUM('days','weeks','months','years') DEFAULT 'days',
        -- e. drugs advised at this consultation (same shape as Treatments.medicines_json)
        drugs_json        JSON NULL,
        -- f. outcome of this consultation
        outcome           ENUM('Pending','Improved','No Change','Worsened','Cured','Referred')
                            DEFAULT 'Pending',
        outcome_notes     TEXT NULL,
        examination_notes TEXT NULL,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_cons_patient (patient_id),
        KEY idx_cons_treatment (treatment_id),
        KEY idx_cons_date (consultation_date),
        CONSTRAINT fk_cons_patient   FOREIGN KEY (patient_id)   REFERENCES Patients(patient_id)   ON DELETE CASCADE,
        CONSTRAINT fk_cons_treatment FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id) ON DELETE SET NULL,
        CONSTRAINT fk_cons_doctor    FOREIGN KEY (doctor_id)    REFERENCES Users(user_id)         ON DELETE SET NULL,
        CONSTRAINT fk_cons_disease   FOREIGN KEY (disease_id)   REFERENCES Diseases(disease_id)   ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('   + Consultations');

    console.log('→ Attachments (reports + discharge summaries)');
    await db.query(`
      CREATE TABLE IF NOT EXISTS Attachments (
        attachment_id   INT AUTO_INCREMENT PRIMARY KEY,
        patient_id      INT NOT NULL,
        consultation_id INT NULL,
        treatment_id    INT NULL,
        kind            ENUM('report','discharge_summary','other') DEFAULT 'report',
        label           VARCHAR(200) NULL,
        original_name   VARCHAR(255) NOT NULL,
        stored_name     VARCHAR(255) NOT NULL,
        mime_type       VARCHAR(120) NOT NULL,
        size_bytes      INT NOT NULL,
        uploaded_by     INT NULL,
        uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_stored (stored_name),
        KEY idx_att_patient (patient_id),
        KEY idx_att_consultation (consultation_id),
        CONSTRAINT fk_att_patient      FOREIGN KEY (patient_id)      REFERENCES Patients(patient_id)          ON DELETE CASCADE,
        CONSTRAINT fk_att_consultation FOREIGN KEY (consultation_id) REFERENCES Consultations(consultation_id) ON DELETE CASCADE,
        CONSTRAINT fk_att_treatment    FOREIGN KEY (treatment_id)    REFERENCES Treatments(treatment_id)      ON DELETE SET NULL,
        CONSTRAINT fk_att_user         FOREIGN KEY (uploaded_by)     REFERENCES Users(user_id)                ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    console.log('   + Attachments');

    console.log('→ Treatments: final status & discharge');
    await addColumn('Treatments', 'final_status',
      "ENUM('Active','Discharged','Referred','Lost to Follow-up','Deceased') DEFAULT 'Active'");
    await addColumn('Treatments', 'discharge_date',    'DATE NULL');
    await addColumn('Treatments', 'discharge_summary', 'TEXT NULL');

    console.log('\n✅ Clinical intake schema ready.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
