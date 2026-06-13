-- AYUSHI - Indexes for performance optimization

-- Users
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_users_active ON Users(is_active);

-- Patients
CREATE INDEX idx_patients_code ON Patients(patient_code);
CREATE INDEX idx_patients_name ON Patients(name);
CREATE INDEX idx_patients_registration ON Patients(registration_date);
CREATE INDEX idx_patients_active ON Patients(is_active);

-- Treatments
CREATE INDEX idx_treatments_patient ON Treatments(patient_id);
CREATE INDEX idx_treatments_doctor ON Treatments(doctor_id);
CREATE INDEX idx_treatments_disease ON Treatments(disease_id);
CREATE INDEX idx_treatments_status ON Treatments(status);
CREATE INDEX idx_treatments_start_date ON Treatments(start_date);

-- Followups
CREATE INDEX idx_followups_treatment ON Followups(treatment_id);
CREATE INDEX idx_followups_date ON Followups(followup_date);

-- Drug Research
CREATE INDEX idx_drugs_name ON Drugs(name);
CREATE INDEX idx_drugs_category ON Drugs(category);
CREATE INDEX idx_drug_admin_treatment ON Drug_Administrations(treatment_id);
CREATE INDEX idx_drug_admin_drug ON Drug_Administrations(drug_id);
CREATE INDEX idx_drug_outcomes_admin ON Drug_Outcomes(admin_id);
CREATE INDEX idx_drug_outcomes_date ON Drug_Outcomes(assessment_date);
CREATE INDEX idx_drug_outcomes_efficacy ON Drug_Outcomes(efficacy_score);

-- Timeline Events
CREATE INDEX idx_timeline_patient ON Timeline_Events(patient_id);
CREATE INDEX idx_timeline_type ON Timeline_Events(event_type);
CREATE INDEX idx_timeline_date ON Timeline_Events(event_date);

-- AI Reports
CREATE INDEX idx_ai_reports_patient ON AI_Reports(patient_id);
CREATE INDEX idx_ai_reports_disease ON AI_Reports(disease_id);
CREATE INDEX idx_ai_reports_drug ON AI_Reports(drug_id);
CREATE INDEX idx_ai_reports_type ON AI_Reports(report_type);

-- Notifications
CREATE INDEX idx_notifications_user ON Notifications(user_id);
CREATE INDEX idx_notifications_read ON Notifications(is_read);
