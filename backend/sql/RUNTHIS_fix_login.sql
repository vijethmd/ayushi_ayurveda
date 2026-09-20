-- ============================================================
-- AYUSHI LOGIN FIX — Run this in MySQL to fix login issues
-- ============================================================
USE ayushi_db;

-- Step 1: Add missing columns (safe, won't fail if they exist)
ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS qualification    VARCHAR(200) AFTER role,
  ADD COLUMN IF NOT EXISTS specialization   VARCHAR(200) AFTER qualification,
  ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0 AFTER specialization;

-- Step 2: Activate and verify ALL users
UPDATE Users SET is_verified = 1, is_active = 1;

-- Step 3: Set ADMIN credentials
--   Email:    ayushiayurveda.repo@gmail.com
--   Password: (set your own — see README)
UPDATE Users
SET email         = 'ayushiayurveda.repo@gmail.com',
    password_hash = '$2a$10$AvQavycQdA6FKOjRBxdPmOqMzc0CKTO6XDRH7a98ll53SUkqDY376',
    is_verified   = 1,
    is_active     = 1
WHERE role = 'admin';

-- Step 4: Set ALL DOCTOR passwords
--   Password: Ayushi@123
UPDATE Users
SET password_hash = '$2a$10$WfG/qCw9wF.3D8tbg68AoeLLpkiPvg94jDzixPo2eWcCEHv6tHoU.',
    is_verified   = 1,
    is_active     = 1
WHERE role = 'doctor';

-- Step 5: Create Drug tables if not exist
CREATE TABLE IF NOT EXISTS Drugs (
  drug_id        INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(150) NOT NULL UNIQUE,
  category       VARCHAR(100),
  description    TEXT,
  traditional_use TEXT,
  is_active      TINYINT(1) DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Drug_Administrations (
  admin_id     INT AUTO_INCREMENT PRIMARY KEY,
  treatment_id INT NOT NULL,
  drug_id      INT NOT NULL,
  dosage       VARCHAR(100),
  frequency    VARCHAR(100),
  duration_days INT,
  start_date   DATE,
  end_date     DATE,
  route        VARCHAR(50) DEFAULT 'Oral',
  notes        TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id) ON DELETE CASCADE,
  FOREIGN KEY (drug_id)      REFERENCES Drugs(drug_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Drug_Outcomes (
  outcome_id       INT AUTO_INCREMENT PRIMARY KEY,
  admin_id         INT NOT NULL,
  assessment_date  DATE NOT NULL,
  efficacy_score   INT CHECK (efficacy_score BETWEEN 0 AND 100),
  side_effects     TEXT,
  patient_feedback TEXT,
  doctor_notes     TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES Drug_Administrations(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE AI_Reports
  ADD COLUMN IF NOT EXISTS drug_id INT AFTER disease_id,
  MODIFY report_type ENUM('clinical_insights','patient_summary','timeline_analysis','dropout_risk','doctor_performance','disease_intelligence','drug_research') NOT NULL;

-- Step 6: Seed drugs
INSERT IGNORE INTO Drugs (name, category, description, traditional_use) VALUES
('Ashwagandha','Adaptogen','Withania somnifera','Stress, fatigue, immunity, nerve tonic'),
('Shallaki','Anti-inflammatory','Boswellia serrata','Arthritis, joint pain, inflammation'),
('Brahmi','Nervine','Bacopa monnieri','Memory, anxiety, neurological disorders'),
('Triphala','Digestive','Three-fruit formula','Constipation, digestion, detox'),
('Guggulu','Lipid-lowering','Commiphora mukul resin','Cholesterol, obesity, arthritis'),
('Shatavari','Adaptogen','Asparagus racemosus','Womens health, lactation, immunity'),
('Neem','Antimicrobial','Azadirachta indica','Skin disorders, diabetes, infections'),
('Turmeric (Haridra)','Anti-inflammatory','Curcuma longa','Inflammation, liver, skin, diabetes'),
('Vasaka','Bronchodilator','Adhatoda vasica','Asthma, bronchitis, cough'),
('Punarnava','Diuretic','Boerhavia diffusa','Kidney, urinary, edema, liver'),
('Trikatu','Digestive','Ginger + Black pepper + Long pepper','Digestion, metabolism, respiratory'),
('Kutaja','Antidiarrheal','Holarrhena antidysenterica','IBS, diarrhea, dysentery'),
('Sarpagandha','Antihypertensive','Rauvolfia serpentina','Hypertension, insomnia, anxiety'),
('Kanchanar Guggulu','Thyroid','Bauhinia variegata + Guggulu','Thyroid, lymph nodes, PCOS'),
('Chandraprabha Vati','Urinary','Compound formulation','UTI, kidney, diabetes, urinary'),
('Avipattikar Churna','Antacid','Compound formulation','Acidity, GERD, constipation, ulcers'),
('Dashmoola','Anti-inflammatory','Ten root formulation','Back pain, arthritis, respiratory'),
('Mahamanjisthadi Kwatha','Blood purifier','Compound formulation','Skin disorders, psoriasis, eczema'),
('Arogyavardhini Vati','Hepatoprotective','Compound formulation','Liver, skin, metabolism, fever'),
('Medohar Guggulu','Lipid-lowering','Compound formulation','Obesity, cholesterol, metabolism'),
('Yogaraja Guggulu','Musculoskeletal','Compound formulation','Joint pain, arthritis, sciatica'),
('Maharasnadi Kwatha','Neurological','Compound formulation','Sciatica, nerve pain, arthritis'),
('Haridra Khanda','Antiallergic','Turmeric-based compound','Allergy, rhinitis, urticaria, eczema'),
('Bilva Churna','Digestive','Aegle marmelos powder','IBS, constipation, diarrhea'),
('Brahmi Vati','Nervine','Brahmi-based tablet','Migraine, anxiety, stress, memory'),
('Jatamansi','Sedative','Nardostachys jatamansi','Insomnia, anxiety, hypertension'),
('Bakuchi','Skin','Psoralea corylifolia','Vitiligo, psoriasis, leucoderma'),
('Gokshuradi Guggulu','Urogenital','Compound formulation','UTI, kidney stones, BPH'),
('Kumari Asava','Tonic','Aloe vera fermentation','Digestion, liver, menstrual disorders'),
('Saraswatarishta','Nervine tonic','Compound fermented preparation','Memory, anxiety, epilepsy, stress');

-- Verify
SELECT '=== USERS ===' as info;
SELECT user_id, name, email, role, is_verified, is_active FROM Users ORDER BY user_id LIMIT 5;
SELECT '=== DRUGS ===' as info;
SELECT COUNT(*) as drug_count FROM Drugs;
