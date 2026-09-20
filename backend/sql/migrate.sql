-- AYUSHI Migration / Fix Script
-- Run this ONCE in your MySQL client if you already have the database set up
-- It safely adds any missing columns and fixes credentials

USE ayushi_db;

-- Add missing columns (safe - won't fail if columns already exist)
ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS qualification VARCHAR(200) AFTER role,
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(200) AFTER qualification,
  ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0 AFTER specialization;

-- Add drug research tables used by Drug Research and Disease Intelligence
CREATE TABLE IF NOT EXISTS Drugs (
  drug_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  category VARCHAR(100),
  description TEXT,
  traditional_use TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Drug_Administrations (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  treatment_id INT NOT NULL,
  drug_id INT NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration_days INT,
  start_date DATE,
  end_date DATE,
  route VARCHAR(50) DEFAULT 'Oral',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id) ON DELETE CASCADE,
  FOREIGN KEY (drug_id) REFERENCES Drugs(drug_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Drug_Outcomes (
  outcome_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  assessment_date DATE NOT NULL,
  efficacy_score INT CHECK (efficacy_score BETWEEN 0 AND 100),
  side_effects TEXT,
  patient_feedback TEXT,
  doctor_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES Drug_Administrations(admin_id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE AI_Reports
  ADD COLUMN IF NOT EXISTS drug_id INT AFTER disease_id,
  MODIFY report_type ENUM('clinical_insights','patient_summary','timeline_analysis','dropout_risk','doctor_performance','disease_intelligence','drug_research') NOT NULL;

-- Verify all users
UPDATE Users SET is_verified = 1, is_active = 1;

-- Set the admin account. Replace the hash below with your own bcrypt hash.
UPDATE Users SET
  email = 'ayushiayurveda.repo@gmail.com',
  password_hash = '$2a$10$5WQ2VlrLFLTpBvdMo1d.D.dRJpr/fzxlXJelQiAaJqQTOwV7I5Gre',
  is_verified = 1, is_active = 1
WHERE role = 'admin' OR user_id = 1;

-- Set all doctors password to Ayushi@123
UPDATE Users SET
  password_hash = '$2a$10$AS3ip.SN/VxGPcTGQ9MDC.Qg.UnJsm7dle4aWmcSR2n7Yxg9/8Xkq',
  is_verified = 1, is_active = 1
WHERE role = 'doctor';

SELECT user_id, name, email, role, is_verified, is_active FROM Users ORDER BY user_id LIMIT 5;
