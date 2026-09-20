-- AYUSHI Fix Script — run this in MySQL to fix login issues
-- Admin:   ayushiayurveda.repo@gmail.com / (password not published — see README)
-- Doctors: Ayushi@123

USE ayushi_db;

-- Add missing columns safely
ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS qualification VARCHAR(200) AFTER role,
  ADD COLUMN IF NOT EXISTS specialization VARCHAR(200) AFTER qualification,
  ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 0 AFTER specialization;

-- Make ALL users verified and active
UPDATE Users SET is_verified = 1, is_active = 1;

-- Admin credentials
UPDATE Users SET
  email        = 'ayushiayurveda.repo@gmail.com',
  password_hash = '$2a$10$5WQ2VlrLFLTpBvdMo1d.D.dRJpr/fzxlXJelQiAaJqQTOwV7I5Gre',
  is_verified  = 1,
  is_active    = 1
WHERE user_id = 1 OR role = 'admin';

-- All doctors  (Ayushi@123)
UPDATE Users SET
  password_hash = '$2a$10$AS3ip.SN/VxGPcTGQ9MDC.Qg.UnJsm7dle4aWmcSR2n7Yxg9/8Xkq',
  is_verified   = 1,
  is_active     = 1
WHERE role = 'doctor';

SELECT user_id, name, email, role, is_verified, is_active FROM Users LIMIT 5;
