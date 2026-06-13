-- AYUSHI - Complete Schema (v2 - fixed)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS AI_Reports;
DROP TABLE IF EXISTS Timeline_Events;
DROP TABLE IF EXISTS Followups;
DROP TABLE IF EXISTS Drug_Outcomes;
DROP TABLE IF EXISTS Drug_Administrations;
DROP TABLE IF EXISTS Treatments;
DROP TABLE IF EXISTS Drugs;
DROP TABLE IF EXISTS Patients;
DROP TABLE IF EXISTS Diseases;
DROP TABLE IF EXISTS OTP_Verifications;
DROP TABLE IF EXISTS Doctor_Requests;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','doctor') NOT NULL DEFAULT 'doctor',
  qualification VARCHAR(200),
  specialization VARCHAR(200),
  experience_years INT DEFAULT 0,
  is_verified TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Doctor join requests (signup → admin approval flow)
CREATE TABLE Doctor_Requests (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(15),
  specialization VARCHAR(200),
  description TEXT NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(255),
  reviewed_by INT,
  reviewed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE OTP_Verifications (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expiry_time DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Diseases (
  disease_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(150) NOT NULL,
  disease_name VARCHAR(150) NOT NULL,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Drugs (
  drug_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  category VARCHAR(100),
  description TEXT,
  traditional_use TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Patients (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  age INT NOT NULL,
  gender ENUM('Male','Female','Other') NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  occupation VARCHAR(100),
  registration_date DATE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE Treatments (
  treatment_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  disease_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('Ongoing','Improved','Cured','Left Treatment') DEFAULT 'Ongoing',
  improvement_percentage INT DEFAULT 0,
  medicines_json JSON,
  lifestyle_json JSON,
  diet_json JSON,
  current_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (disease_id) REFERENCES Diseases(disease_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Drug_Administrations (
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

CREATE TABLE Drug_Outcomes (
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

CREATE TABLE Followups (
  followup_id INT AUTO_INCREMENT PRIMARY KEY,
  treatment_id INT NOT NULL,
  followup_date DATE NOT NULL,
  symptoms TEXT,
  improvement_percentage INT DEFAULT 0,
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (treatment_id) REFERENCES Treatments(treatment_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Timeline_Events (
  timeline_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_title VARCHAR(200) NOT NULL,
  event_description TEXT,
  event_date DATETIME NOT NULL,
  created_by INT,
  FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE AI_Reports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  generated_by INT,
  patient_id INT,
  disease_id INT,
  drug_id INT,
  report_type ENUM('clinical_insights','patient_summary','timeline_analysis','dropout_risk','doctor_performance','disease_intelligence','drug_research') NOT NULL,
  report_title VARCHAR(255) NOT NULL,
  report_text LONGTEXT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES Users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES Patients(patient_id) ON DELETE SET NULL,
  FOREIGN KEY (disease_id) REFERENCES Diseases(disease_id) ON DELETE SET NULL,
  FOREIGN KEY (drug_id) REFERENCES Drugs(drug_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE Notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
