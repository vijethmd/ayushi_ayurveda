-- AYUSHI Seed Data Part 2 - Treatments, Followups, Timelines, AI Reports, Notifications
-- Run after seed.sql

-- ============================================================
-- TREATMENTS (700 treatments)
-- ============================================================
INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, end_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes) VALUES
(1, 2, 1, '2023-01-16', '2023-07-16', 'Cured', 100, '[{"name":"Shallaki","dosage":"500mg","frequency":"twice daily"},{"name":"Guggulu","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Gentle yoga morning"},{"recommendation":"Avoid heavy lifting"}]', '[{"recommendation":"Anti-inflammatory foods"},{"recommendation":"Avoid nightshades"}]', 'Patient responded well. Complete recovery achieved.'),
(2, 2, 13, '2023-01-19', '2023-04-19', 'Improved', 75, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"},{"name":"Ashwagandha","dosage":"300mg","frequency":"once daily"}]', '[{"recommendation":"Meditation 20 min daily"},{"recommendation":"Regular sleep schedule"}]', '[{"recommendation":"Reduce spicy food"},{"recommendation":"Warm milk at night"}]', 'Migraine frequency reduced from 8/month to 2/month.'),
(3, 3, 7, '2023-01-23', '2023-10-23', 'Cured', 100, '[{"name":"Kutaja","dosage":"500mg","frequency":"thrice daily"},{"name":"Chitraka","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Regular meal times"},{"recommendation":"Stress management"}]', '[{"recommendation":"Avoid fried foods"},{"recommendation":"High fiber diet"}]', 'IBS symptoms completely resolved.'),
(4, 3, 8, '2023-01-26', NULL, 'Ongoing', 45, '[{"name":"Triphala","dosage":"5g","frequency":"once at night"},{"name":"Isabgol","dosage":"10g","frequency":"twice daily"}]', '[{"recommendation":"Regular bowel habits"},{"recommendation":"Morning walk"}]', '[{"recommendation":"High fiber foods"},{"recommendation":"Adequate water intake"}]', 'Moderate improvement in bowel regularity.'),
(5, 4, 31, '2023-02-02', '2023-08-02', 'Cured', 100, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"},{"name":"Arjuna","dosage":"500mg","frequency":"once daily"}]', '[{"recommendation":"Daily yoga"},{"recommendation":"Reduce stress"}]', '[{"recommendation":"Low sodium diet"},{"recommendation":"Avoid caffeine"}]', 'Blood pressure normalized. Treatment successful.'),
(6, 4, 39, '2023-02-06', NULL, 'Ongoing', 60, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"},{"name":"Bitter gourd extract","dosage":"10ml","frequency":"once daily"}]', '[{"recommendation":"Regular exercise 30 min"},{"recommendation":"Weight monitoring"}]', '[{"recommendation":"Low glycemic index foods"},{"recommendation":"Avoid sugar"}]', 'Blood sugar levels showing improvement.'),
(7, 5, 19, '2023-02-09', '2023-05-09', 'Left Treatment', 30, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"},{"name":"Turmeric","dosage":"1g","frequency":"thrice daily"}]', '[{"recommendation":"Sun exposure 15 min"},{"recommendation":"Stress management"}]', '[{"recommendation":"Anti-oxidant rich food"}]', 'Patient discontinued treatment after 3 months.'),
(8, 5, 25, '2023-02-13', '2023-11-13', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"},{"name":"Kantakari","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Pranayama daily"},{"recommendation":"Avoid cold drinks"}]', '[{"recommendation":"Warm foods and drinks"},{"recommendation":"Avoid dairy"}]', 'Asthma attacks reduced to zero.'),
(9, 6, 4, '2023-02-16', '2023-09-16', 'Cured', 100, '[{"name":"Shallaki","dosage":"500mg","frequency":"twice daily"},{"name":"Mahayogaraj Guggulu","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Swimming or gentle exercise"},{"recommendation":"Ergonomic work setup"}]', '[{"recommendation":"Calcium rich foods"},{"recommendation":"Avoid cold foods"}]', 'Complete relief from back pain.'),
(10, 6, 36, '2023-02-20', NULL, 'Ongoing', 55, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"},{"name":"Punarnava","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Neck exercises"},{"recommendation":"Avoid screen for long hours"}]', '[{"recommendation":"Reduce iodine rich foods if hyperthyroid"}]', 'Thyroid levels gradually stabilizing.'),
(11, 7, 41, '2023-02-23', NULL, 'Improved', 70, '[{"name":"Kumari Asava","dosage":"15ml","frequency":"twice daily"},{"name":"Rajapravartini Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Regular exercise"},{"recommendation":"Yoga for hormonal balance"}]', '[{"recommendation":"Reduce processed food"},{"recommendation":"Spearmint tea"}]', 'Menstrual cycle regularizing significantly.'),
(12, 7, 3, '2023-03-02', '2023-12-02', 'Cured', 100, '[{"name":"Shallaki","dosage":"500mg","frequency":"twice daily"},{"name":"Dashmoola","dosage":"10ml","frequency":"twice daily"}]', '[{"recommendation":"Warm water therapy"},{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory diet"},{"recommendation":"Avoid cold weather exposure"}]', 'Rheumatoid arthritis in remission.'),
(13, 8, 46, '2023-03-06', '2023-09-06', 'Cured', 100, '[{"name":"Rohitaka","dosage":"500mg","frequency":"thrice daily"},{"name":"Arogyavardhini Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Avoid alcohol"},{"recommendation":"Regular sleep"}]', '[{"recommendation":"Low fat diet"},{"recommendation":"Avoid processed food"}]', 'Fatty liver resolved on ultrasound follow-up.'),
(14, 8, 14, '2023-03-09', NULL, 'Ongoing', 50, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"},{"name":"Tagara","dosage":"250mg","frequency":"at night"}]', '[{"recommendation":"Mindfulness meditation"},{"recommendation":"CBT techniques"}]', '[{"recommendation":"Avoid stimulants"},{"recommendation":"Balanced diet"}]', 'Anxiety levels reduced but still requiring treatment.'),
(15, 9, 2, '2023-03-13', '2024-03-13', 'Improved', 80, '[{"name":"Shallaki","dosage":"500mg","frequency":"twice daily"},{"name":"Boswellia","dosage":"300mg","frequency":"thrice daily"}]', '[{"recommendation":"Low impact exercise"},{"recommendation":"Joint protection"}]', '[{"recommendation":"Omega 3 rich foods"},{"recommendation":"Maintain healthy weight"}]', 'Significant pain reduction and mobility improvement.'),
(16, 9, 42, '2023-03-16', '2023-09-16', 'Cured', 100, '[{"name":"Stanyajanana Kwatha","dosage":"50ml","frequency":"twice daily"},{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress free environment"},{"recommendation":"Regular sleep"}]', '[{"recommendation":"Nutritious balanced diet"},{"recommendation":"Adequate hydration"}]', 'Dysmenorrhea resolved completely.'),
(17, 10, 5, '2023-03-20', NULL, 'Improved', 65, '[{"name":"Cervical Formula","dosage":"500mg","frequency":"twice daily"},{"name":"Mahavata Vidhvansa Rasa","dosage":"125mg","frequency":"twice daily"}]', '[{"recommendation":"Neck physiotherapy"},{"recommendation":"Avoid mobile phone prolonged use"}]', '[{"recommendation":"Calcium rich diet"},{"recommendation":"Vitamin D foods"}]', 'Cervical pain manageable, patient continuing treatment.'),
(18, 10, 20, '2023-03-23', '2023-06-23', 'Left Treatment', 25, '[{"name":"Gandhak Rasayana","dosage":"250mg","frequency":"twice daily"},{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Gentle skin care routine"},{"recommendation":"Avoid harsh chemicals"}]', '[{"recommendation":"Avoid trigger foods"}]', 'Patient left treatment citing financial reasons.'),
(19, 11, 6, '2023-03-27', '2023-12-27', 'Cured', 100, '[{"name":"Yogaraja Guggulu","dosage":"250mg","frequency":"thrice daily"},{"name":"Maharasnadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Walking daily"},{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory foods"},{"recommendation":"Weight loss diet"}]', 'Sciatica cured, no recurrence in 6 months.'),
(20, 11, 40, '2023-03-30', NULL, 'Ongoing', 40, '[{"name":"Medohar Guggulu","dosage":"500mg","frequency":"thrice daily"},{"name":"Trikatu","dosage":"250mg","frequency":"before meals"}]', '[{"recommendation":"Exercise 45 min daily"},{"recommendation":"Active lifestyle"}]', '[{"recommendation":"Low calorie diet"},{"recommendation":"Avoid junk food"}]', 'Gradual weight reduction ongoing.'),
(21, 12, 16, '2023-04-03', '2023-10-03', 'Cured', 100, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"once at night"},{"name":"Brahmi Ghrita","dosage":"5ml","frequency":"at night"}]', '[{"recommendation":"Fixed sleep schedule"},{"recommendation":"Avoid screens before bed"}]', '[{"recommendation":"Light dinner"},{"recommendation":"Warm milk with nutmeg"}]', 'Sleep quality improved drastically. Insomnia resolved.'),
(22, 12, 26, '2023-04-06', '2023-10-06', 'Improved', 85, '[{"name":"Haridra Khanda","dosage":"500mg","frequency":"twice daily"},{"name":"Sitopaladi Churna","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid allergens"},{"recommendation":"Pranayama"}]', '[{"recommendation":"Avoid dairy and cold foods"},{"recommendation":"Local honey"}]', 'Rhinitis attacks significantly reduced.'),
(23, 13, 10, '2023-04-10', '2024-01-10', 'Cured', 100, '[{"name":"Avipattikar Churna","dosage":"3g","frequency":"twice daily"},{"name":"Shankha Vati","dosage":"250mg","frequency":"after meals"}]', '[{"recommendation":"Avoid lying down after meals"},{"recommendation":"Stress management"}]', '[{"recommendation":"Small frequent meals"},{"recommendation":"Avoid acidic foods"}]', 'GERD symptoms completely resolved.'),
(24, 13, 15, '2023-04-13', NULL, 'Ongoing', 55, '[{"name":"Manasamitra Vatakam","dosage":"125mg","frequency":"twice daily"},{"name":"Saraswatarishta","dosage":"15ml","frequency":"twice daily"}]', '[{"recommendation":"Stress management techniques"},{"recommendation":"Regular exercise"}]', '[{"recommendation":"Balanced diet"},{"recommendation":"Avoid stimulants"}]', 'Stress levels manageable, treatment continuing.'),
(25, 14, 49, '2023-04-17', '2023-10-17', 'Cured', 100, '[{"name":"Gokshuradi Guggulu","dosage":"500mg","frequency":"thrice daily"},{"name":"Chandraprabha Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Adequate fluid intake"},{"recommendation":"Avoid holding urine"}]', '[{"recommendation":"Cranberry juice"},{"recommendation":"Avoid spicy foods"}]', 'Recurrent UTI episodes stopped.'),
(26, 14, 22, '2023-04-20', NULL, 'Improved', 60, '[{"name":"Bakuchi","dosage":"500mg","frequency":"twice daily"},{"name":"Arka Taila topical"}]', '[{"recommendation":"Sun exposure carefully"},{"recommendation":"Avoid stress"}]', '[{"recommendation":"Pigmentation supporting foods"}]', 'Pigmentation patches showing repigmentation.'),
(27, 15, 9, '2023-04-24', '2024-04-24', 'Cured', 100, '[{"name":"Haritaki","dosage":"500mg","frequency":"at night"},{"name":"Triphala Churna","dosage":"5g","frequency":"at night"}]', '[{"recommendation":"Regular bowel habits"},{"recommendation":"Morning exercises"}]', '[{"recommendation":"High fiber diet"},{"recommendation":"Warm water in morning"}]', 'Chronic constipation resolved.'),
(28, 15, 30, '2023-05-01', '2023-08-01', 'Left Treatment', 20, '[{"name":"Vasaka Lehya","dosage":"10g","frequency":"twice daily"}]', '[{"recommendation":"Avoid smoking"},{"recommendation":"Breathing exercises"}]', '[{"recommendation":"Warm liquids"},{"recommendation":"Avoid cold"}]', 'Patient left treatment after initial 3 months.'),
(29, 16, 17, '2023-05-04', NULL, 'Ongoing', 35, '[{"name":"Manasa Mitra Vatakam","dosage":"250mg","frequency":"twice daily"},{"name":"Ashwagandha","dosage":"500mg","frequency":"once daily"}]', '[{"recommendation":"Psychotherapy alongside"},{"recommendation":"Social activities"}]', '[{"recommendation":"Omega 3 rich foods"},{"recommendation":"Reduce sugar"}]', 'Depression symptoms improving slowly.'),
(30, 16, 44, '2023-05-08', '2023-11-08', 'Cured', 100, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"},{"name":"Praval Pishti","dosage":"125mg","frequency":"twice daily"}]', '[{"recommendation":"Cool environment"},{"recommendation":"Light exercise"}]', '[{"recommendation":"Phytoestrogen rich foods"},{"recommendation":"Avoid spicy hot food"}]', 'Menopausal symptoms fully controlled.');

-- Insert treatments 31-200 with varied patterns
INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, end_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes) VALUES
(31, 17, 13, '2023-05-08', '2023-11-08', 'Cured', 100, '[{"name":"Brahmi Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Anti-migraine diet"}]', 'Migraine completely resolved.'),
(32, 17, 7, '2023-05-11', NULL, 'Ongoing', 45, '[{"name":"Kutaja Ghana Vati","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Regular meal timing"}]', '[{"recommendation":"Avoid junk food"}]', 'Gastritis improving steadily.'),
(33, 18, 1, '2023-05-15', '2024-02-15', 'Improved', 80, '[{"name":"Shallaki Guggulu","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Joint protection exercises"}]', '[{"recommendation":"Calcium rich diet"}]', 'Arthritis pain significantly reduced.'),
(34, 18, 39, '2023-05-18', '2024-05-18', 'Cured', 100, '[{"name":"Neem capsules","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Regular exercise"}]', '[{"recommendation":"Low carb diet"}]', 'Diabetes fully controlled with lifestyle change.'),
(35, 19, 5, '2023-05-22', NULL, 'Improved', 70, '[{"name":"Cervical Pack","dosage":"applied","frequency":"twice daily"}]', '[{"recommendation":"Neck exercises"}]', '[{"recommendation":"Calcium supplements naturally"}]', 'Cervical pain reduced considerably.'),
(36, 19, 25, '2023-05-25', '2023-12-25', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Breathing exercises"}]', '[{"recommendation":"Avoid cold foods"}]', 'Asthma attacks ceased.'),
(37, 20, 19, '2023-05-29', '2024-03-29', 'Improved', 75, '[{"name":"Mahamanjisthadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Avoid triggers"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'Psoriasis plaques significantly reduced.'),
(38, 20, 31, '2023-06-01', '2024-01-01', 'Cured', 100, '[{"name":"Sarpagandha Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga and meditation"}]', '[{"recommendation":"DASH diet"}]', 'Hypertension normalized without allopathy.'),
(39, 21, 6, '2023-06-05', '2024-06-05', 'Cured', 100, '[{"name":"Mahayogaraj Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory foods"}]', 'Sciatica cured after 1 year treatment.'),
(40, 21, 40, '2023-06-08', NULL, 'Ongoing', 50, '[{"name":"Medohar Vidangadi Lauha","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Daily cardio 30 min"}]', '[{"recommendation":"Low calorie balanced diet"}]', 'Obesity management in progress.'),
(41, 22, 36, '2023-06-12', NULL, 'Ongoing', 60, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Stress reduction"}]', '[{"recommendation":"Iodine balanced diet"}]', 'Thyroid levels improving.'),
(42, 22, 14, '2023-06-15', '2024-03-15', 'Cured', 100, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"},{"name":"Tagara","dosage":"250mg","frequency":"at night"}]', '[{"recommendation":"Mindfulness"}]', '[{"recommendation":"Sattvic diet"}]', 'Anxiety disorder resolved.'),
(43, 23, 2, '2023-06-19', '2024-06-19', 'Improved', 85, '[{"name":"Boswellia","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Low impact exercise"}]', '[{"recommendation":"Anti-inflammatory foods"}]', 'Osteoarthritis well managed.'),
(44, 23, 46, '2023-06-22', '2024-01-22', 'Cured', 100, '[{"name":"Arogyavardhini","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Healthy lifestyle"}]', '[{"recommendation":"Low fat diet"}]', 'Fatty liver resolved.'),
(45, 24, 8, '2023-06-26', NULL, 'Improved', 70, '[{"name":"Bilva Churna","dosage":"5g","frequency":"twice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"Fiber rich diet"}]', 'IBS symptoms manageable.'),
(46, 24, 41, '2023-06-29', '2024-04-29', 'Cured', 100, '[{"name":"Shatavari Kalpa","dosage":"10g","frequency":"twice daily"}]', '[{"recommendation":"Yoga for hormonal balance"}]', '[{"recommendation":"Balanced nutrition"}]', 'Menstrual irregularities resolved.'),
(47, 25, 4, '2023-07-03', NULL, 'Ongoing', 40, '[{"name":"Dashmoola Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Core strengthening exercises"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'Chronic back pain manageable.'),
(48, 25, 26, '2023-07-06', '2024-01-06', 'Cured', 100, '[{"name":"Haridra Khanda","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid allergens"}]', '[{"recommendation":"Avoid histamine foods"}]', 'Allergic rhinitis resolved.'),
(49, 2, 9, '2023-07-10', '2024-04-10', 'Cured', 100, '[{"name":"Triphala","dosage":"5g","frequency":"at night"}]', '[{"recommendation":"Regular routine"}]', '[{"recommendation":"High fiber diet"}]', 'Constipation resolved permanently.'),
(50, 2, 15, '2023-07-13', NULL, 'Ongoing', 55, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"twice daily"},{"name":"Manasamitra Vatakam","dosage":"125mg","frequency":"twice daily"}]', '[{"recommendation":"Relaxation techniques"}]', '[{"recommendation":"Stress reducing diet"}]', 'Stress disorder ongoing management.'),
(51, 3, 3, '2023-07-17', '2024-07-17', 'Cured', 100, '[{"name":"Shallaki","dosage":"750mg","frequency":"twice daily"}]', '[{"recommendation":"Warm water therapy"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'RA in complete remission.'),
(52, 3, 13, '2023-07-20', '2024-01-20', 'Improved', 80, '[{"name":"Brahmi Vati","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Trigger food elimination"}]', 'Migraine frequency reduced 80%.'),
(53, 4, 31, '2023-07-24', '2024-04-24', 'Cured', 100, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Daily exercise"}]', '[{"recommendation":"Low sodium diet"}]', 'BP normalized.'),
(54, 4, 7, '2023-07-27', NULL, 'Ongoing', 65, '[{"name":"Kutaja","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Regular meal schedule"}]', '[{"recommendation":"Avoid spicy food"}]', 'Gastritis symptoms reducing.'),
(55, 5, 18, '2023-07-31', '2023-10-31', 'Left Treatment', 15, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Balanced diet"}]', 'Patient discontinued - compliance issues.'),
(56, 5, 25, '2023-08-03', '2024-05-03', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Pranayama"}]', '[{"recommendation":"Avoid cold"}]', 'Asthma completely controlled.'),
(57, 6, 46, '2023-08-07', '2024-05-07', 'Cured', 100, '[{"name":"Arogyavardhini Vati","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Healthy lifestyle"}]', '[{"recommendation":"No alcohol"}]', 'Fatty liver grades reduced to 0.'),
(58, 6, 20, '2023-08-10', NULL, 'Improved', 70, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Skin care routine"}]', '[{"recommendation":"Anti-inflammatory foods"}]', 'Eczema controlled with diet changes.'),
(59, 7, 6, '2023-08-14', '2024-08-14', 'Cured', 100, '[{"name":"Maharasnadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'Sciatica fully resolved.'),
(60, 7, 41, '2023-08-17', NULL, 'Ongoing', 55, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Hormone balancing yoga"}]', '[{"recommendation":"Phytoestrogen foods"}]', 'Irregular periods improving.'),
(61, 8, 19, '2023-08-21', '2024-05-21', 'Improved', 75, '[{"name":"Neem capsules","dosage":"500mg","frequency":"twice daily"},{"name":"Panchatikta Ghrita","dosage":"5ml","frequency":"before meals"}]', '[{"recommendation":"Sun exposure moderated"}]', '[{"recommendation":"Avoid trigger foods"}]', 'Psoriasis well controlled.'),
(62, 8, 10, '2023-08-24', '2024-06-24', 'Cured', 100, '[{"name":"Avipattikar Churna","dosage":"3g","frequency":"twice daily"}]', '[{"recommendation":"Small meals"}]', '[{"recommendation":"Avoid acidic foods"}]', 'Acid reflux resolved.'),
(63, 9, 2, '2023-08-28', NULL, 'Ongoing', 60, '[{"name":"Shallaki Boswellia","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Swimming"}]', '[{"recommendation":"Calcium and vitamin D"}]', 'Osteoarthritis progressing slowly.'),
(64, 9, 49, '2023-08-31', '2024-05-31', 'Cured', 100, '[{"name":"Chandraprabha Vati","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Hydration"}]', '[{"recommendation":"Cranberry"}]', 'UTI recurrence stopped.'),
(65, 10, 4, '2023-09-04', '2024-09-04', 'Improved', 80, '[{"name":"Dashmoola Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Core strengthening"}]', '[{"recommendation":"Calcium rich foods"}]', 'Back pain significantly reduced.'),
(66, 10, 22, '2023-09-07', NULL, 'Ongoing', 45, '[{"name":"Bakuchi Oil topical","dosage":"as needed"},{"name":"Bakuchi capsules","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Sun exposure protocol"}]', '[{"recommendation":"Antioxidant foods"}]', 'Vitiligo repigmentation visible.'),
(67, 11, 36, '2023-09-11', NULL, 'Ongoing', 65, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Avoid stress"}]', '[{"recommendation":"Balanced iodine"}]', 'Thyroid function improving.'),
(68, 11, 16, '2023-09-14', '2024-04-14', 'Cured', 100, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"once at night"},{"name":"Jatamansi","dosage":"250mg","frequency":"at night"}]', '[{"recommendation":"Sleep hygiene"}]', '[{"recommendation":"No caffeine post 3pm"}]', 'Insomnia fully resolved.'),
(69, 12, 3, '2023-09-18', NULL, 'Improved', 70, '[{"name":"Shallaki","dosage":"750mg","frequency":"twice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'RA in good control.'),
(70, 12, 8, '2023-09-21', '2024-06-21', 'Cured', 100, '[{"name":"Bilva Churna","dosage":"5g","frequency":"twice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"High fiber diet"}]', 'IBS resolved with dietary management.'),
(71, 13, 7, '2023-09-25', NULL, 'Ongoing', 70, '[{"name":"Kutaja Ghana Vati","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"Avoid irritant foods"}]', 'Gastritis well controlled.'),
(72, 13, 26, '2023-09-28', '2024-07-28', 'Cured', 100, '[{"name":"Haridra Khanda","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid pollen"}]', '[{"recommendation":"Anti-histamine foods"}]', 'Rhinitis resolved after full course.'),
(73, 14, 31, '2023-10-02', '2024-07-02', 'Cured', 100, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"DASH diet"}]', 'Hypertension controlled naturally.'),
(74, 14, 40, '2023-10-05', NULL, 'Ongoing', 45, '[{"name":"Medohar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Exercise daily"}]', '[{"recommendation":"Low calorie diet"}]', 'Weight reduction ongoing.'),
(75, 15, 13, '2023-10-09', '2024-05-09', 'Cured', 100, '[{"name":"Brahmi Vati","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Avoid trigger foods"}]', 'Migraine free for 6 months.'),
(76, 15, 25, '2023-10-12', '2024-08-12', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Breathing exercises"}]', '[{"recommendation":"Warm foods"}]', 'Asthma managed to complete remission.'),
(77, 16, 5, '2023-10-16', NULL, 'Improved', 65, '[{"name":"Cervical Formula Ayush","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Neck exercises"}]', '[{"recommendation":"Calcium foods"}]', 'Cervical pain reduced significantly.'),
(78, 16, 46, '2023-10-19', '2024-06-19', 'Cured', 100, '[{"name":"Arogyavardhini Vati","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Healthy habits"}]', '[{"recommendation":"No alcohol no fatty food"}]', 'Fatty liver cleared.'),
(79, 17, 19, '2023-10-23', NULL, 'Ongoing', 55, '[{"name":"Neem Ghrita","dosage":"5ml","frequency":"before meals"}]', '[{"recommendation":"Avoid skin irritants"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'Psoriasis stable, maintaining.'),
(80, 17, 39, '2023-10-26', '2024-10-26', 'Cured', 100, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"},{"name":"Karela","dosage":"10ml","frequency":"once daily"}]', '[{"recommendation":"Regular exercise 45 min"}]', '[{"recommendation":"Diabetic diet"}]', 'Blood sugar normalized with Ayurveda.'),
(81, 18, 15, '2023-10-30', NULL, 'Ongoing', 50, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Meditation"}]', '[{"recommendation":"Stress free diet"}]', 'Stress disorder managed.'),
(82, 18, 1, '2023-11-02', '2024-11-02', 'Improved', 85, '[{"name":"Shallaki","dosage":"750mg","frequency":"twice daily"}]', '[{"recommendation":"Warm compresses"}]', '[{"recommendation":"Turmeric golden milk"}]', 'Arthritis pain 85% controlled.'),
(83, 19, 41, '2023-11-06', '2024-09-06', 'Cured', 100, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"},{"name":"Rajapravartini Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Hormonal yoga"}]', '[{"recommendation":"Balanced diet"}]', 'Menstrual irregularity resolved.'),
(84, 19, 20, '2023-11-09', NULL, 'Improved', 75, '[{"name":"Mahamanjisthadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Skin care"}]', '[{"recommendation":"Anti-inflammatory foods"}]', 'Eczema largely controlled.'),
(85, 20, 4, '2023-11-13', '2024-11-13', 'Cured', 100, '[{"name":"Dashmoola Kwatha","dosage":"50ml","frequency":"twice daily"},{"name":"Yogaraja Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Core exercises"}]', '[{"recommendation":"Calcium and magnesium"}]', 'Chronic back pain resolved.'),
(86, 20, 22, '2023-11-16', NULL, 'Ongoing', 40, '[{"name":"Bakuchi Oil","dosage":"topical","frequency":"twice daily"}]', '[{"recommendation":"Sun therapy"}]', '[{"recommendation":"Pigmentation diet"}]', 'Vitiligo treatment ongoing.'),
(87, 21, 6, '2023-11-20', '2024-11-20', 'Cured', 100, '[{"name":"Maharasnadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Walking"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Sciatica cured.'),
(88, 21, 31, '2023-11-23', '2024-08-23', 'Cured', 100, '[{"name":"Sarpagandha Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Daily yoga"}]', '[{"recommendation":"Low sodium"}]', 'Hypertension normalized.'),
(89, 22, 16, '2023-11-27', '2024-07-27', 'Cured', 100, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"at night"}]', '[{"recommendation":"Sleep hygiene"}]', '[{"recommendation":"Warm milk"}]', 'Insomnia resolved.'),
(90, 22, 36, '2023-11-30', NULL, 'Ongoing', 60, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Balanced diet"}]', 'Thyroid levels stabilizing.'),
(91, 23, 8, '2023-12-04', '2024-09-04', 'Cured', 100, '[{"name":"Bilva Churna","dosage":"5g","frequency":"twice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"FODMAP diet"}]', 'IBS completely resolved.'),
(92, 23, 14, '2023-12-07', NULL, 'Improved', 70, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Mindfulness"}]', '[{"recommendation":"Sattvic diet"}]', 'Anxiety disorder 70% improved.'),
(93, 24, 10, '2023-12-11', '2024-10-11', 'Cured', 100, '[{"name":"Avipattikar Churna","dosage":"3g","frequency":"twice daily"}]', '[{"recommendation":"Avoid lying down post meals"}]', '[{"recommendation":"Alkaline diet"}]', 'GERD resolved.'),
(94, 24, 26, '2023-12-14', '2024-09-14', 'Cured', 100, '[{"name":"Haridra Khanda","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid allergens"}]', '[{"recommendation":"Avoid cold"}]', 'Allergic rhinitis resolved.'),
(95, 25, 25, '2023-12-18', '2024-10-18', 'Cured', 100, '[{"name":"Vasaka Swaras","dosage":"10ml","frequency":"thrice daily"}]', '[{"recommendation":"Pranayama"}]', '[{"recommendation":"No cold drinks"}]', 'Asthma free.'),
(96, 25, 40, '2023-12-21', NULL, 'Ongoing', 50, '[{"name":"Medohar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Exercise 1 hour daily"}]', '[{"recommendation":"Keto inspired diet"}]', 'Obesity reduction in progress.'),
(97, 2, 1, '2024-01-04', NULL, 'Ongoing', 55, '[{"name":"Shallaki","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'Arthritis chronic management.'),
(98, 2, 39, '2024-01-07', '2025-01-07', 'Cured', 100, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"},{"name":"Gymnema","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Strict diet and exercise"}]', '[{"recommendation":"Diabetic diet"}]', 'Diabetes in remission.'),
(99, 3, 9, '2024-01-11', '2025-01-11', 'Cured', 100, '[{"name":"Triphala Churna","dosage":"5g","frequency":"at night"}]', '[{"recommendation":"Regular routine"}]', '[{"recommendation":"High fiber"}]', 'Constipation resolved permanently.'),
(100, 3, 13, '2024-01-14', '2025-01-14', 'Improved', 80, '[{"name":"Brahmi Vati","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Trigger elimination"}]', 'Migraine frequency reduced significantly.'),
(101, 4, 31, '2024-01-18', NULL, 'Ongoing', 70, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"DASH diet"}]', 'BP controlled with Ayurveda.'),
(102, 4, 7, '2024-01-21', '2025-01-21', 'Cured', 100, '[{"name":"Kutaja","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Meal timing"}]', '[{"recommendation":"Avoid irritants"}]', 'Gastritis resolved.'),
(103, 5, 5, '2024-01-25', NULL, 'Improved', 65, '[{"name":"Cervical formula","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Neck exercises"}]', '[{"recommendation":"Calcium rich"}]', 'Cervical pain manageable.'),
(104, 5, 46, '2024-01-28', '2025-01-28', 'Cured', 100, '[{"name":"Arogyavardhini","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Healthy diet"}]', '[{"recommendation":"Low fat"}]', 'Fatty liver grade 0.'),
(105, 6, 41, '2024-02-01', '2025-02-01', 'Cured', 100, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Hormonal yoga"}]', '[{"recommendation":"Balanced nutrition"}]', 'Menstrual disorders resolved.'),
(106, 6, 4, '2024-02-04', NULL, 'Ongoing', 60, '[{"name":"Dashmoola Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Core strengthening"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Back pain manageable.'),
(107, 7, 6, '2024-02-08', NULL, 'Ongoing', 50, '[{"name":"Maharasnadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Walking"}]', '[{"recommendation":"Weight management"}]', 'Sciatica improving.'),
(108, 7, 16, '2024-02-11', '2025-02-11', 'Cured', 100, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"at night"}]', '[{"recommendation":"Sleep hygiene"}]', '[{"recommendation":"Evening routine"}]', 'Insomnia cured.'),
(109, 8, 3, '2024-02-15', NULL, 'Improved', 75, '[{"name":"Shallaki","dosage":"750mg","frequency":"twice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Anti-inflammatory diet"}]', 'RA in partial remission.'),
(110, 8, 39, '2024-02-18', '2025-02-18', 'Cured', 100, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Exercise"}]', '[{"recommendation":"Diabetic diet"}]', 'Blood sugar normal.'),
(111, 9, 14, '2024-02-22', NULL, 'Ongoing', 55, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Mindfulness"}]', '[{"recommendation":"Sattvic diet"}]', 'Anxiety ongoing management.'),
(112, 9, 25, '2024-02-25', '2025-02-25', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Pranayama"}]', '[{"recommendation":"No cold"}]', 'Asthma controlled.'),
(113, 10, 26, '2024-03-01', '2025-03-01', 'Cured', 100, '[{"name":"Haridra Khanda","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid allergens"}]', '[{"recommendation":"Honey"}]', 'Rhinitis resolved.'),
(114, 10, 40, '2024-03-04', NULL, 'Ongoing', 45, '[{"name":"Medohar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Daily exercise"}]', '[{"recommendation":"Low calorie"}]', 'Obesity reduction continuing.'),
(115, 11, 19, '2024-03-08', NULL, 'Improved', 70, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Skin care"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Psoriasis stable.'),
(116, 11, 22, '2024-03-11', NULL, 'Ongoing', 40, '[{"name":"Bakuchi","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Sun therapy"}]', '[{"recommendation":"Pigmentation foods"}]', 'Vitiligo slowly improving.'),
(117, 12, 8, '2024-03-15', '2025-03-15', 'Cured', 100, '[{"name":"Bilva Churna","dosage":"5g","frequency":"twice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"FODMAP"}]', 'IBS cured.'),
(118, 12, 31, '2024-03-18', '2025-03-18', 'Cured', 100, '[{"name":"Sarpagandha Vati","dosage":"250mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"Low sodium"}]', 'Hypertension normalized.'),
(119, 13, 10, '2024-03-22', '2025-03-22', 'Cured', 100, '[{"name":"Avipattikar","dosage":"3g","frequency":"twice daily"}]', '[{"recommendation":"Small meals"}]', '[{"recommendation":"Alkaline diet"}]', 'GERD resolved.'),
(120, 13, 36, '2024-03-25', NULL, 'Ongoing', 60, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Balanced diet"}]', 'Thyroid improving.'),
(121, 14, 2, '2024-03-29', NULL, 'Ongoing', 65, '[{"name":"Shallaki Boswellia","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Swimming"}]', '[{"recommendation":"Calcium"}]', 'Osteoarthritis managed.'),
(122, 14, 13, '2024-04-01', '2025-04-01', 'Cured', 100, '[{"name":"Brahmi Vati","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Trigger elimination"}]', 'Migraine free.'),
(123, 15, 49, '2024-04-05', '2025-04-05', 'Cured', 100, '[{"name":"Chandraprabha","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Hydration"}]', '[{"recommendation":"Cranberry"}]', 'UTI stopped.'),
(124, 15, 41, '2024-04-08', '2025-04-08', 'Cured', 100, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Hormonal balance"}]', '[{"recommendation":"Balanced diet"}]', 'Menstrual disorders resolved.'),
(125, 16, 15, '2024-04-12', NULL, 'Ongoing', 50, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Meditation"}]', '[{"recommendation":"Stress free"}]', 'Stress disorder being managed.'),
(126, 16, 5, '2024-04-15', NULL, 'Improved', 70, '[{"name":"Cervical formula","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Calcium"}]', 'Cervical spondylosis improving.'),
(127, 17, 39, '2024-04-19', '2025-04-19', 'Cured', 100, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Exercise"}]', '[{"recommendation":"Diabetic diet"}]', 'Diabetes controlled.'),
(128, 17, 7, '2024-04-22', NULL, 'Ongoing', 60, '[{"name":"Kutaja","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"Avoid irritants"}]', 'Gastritis improving.'),
(129, 18, 20, '2024-04-26', NULL, 'Improved', 65, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Skin care"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Eczema 65% improved.'),
(130, 18, 4, '2024-04-29', '2025-04-29', 'Cured', 100, '[{"name":"Dashmoola Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Core exercises"}]', '[{"recommendation":"Calcium foods"}]', 'Back pain cured.'),
(131, 19, 46, '2024-05-03', '2025-05-03', 'Cured', 100, '[{"name":"Arogyavardhini","dosage":"250mg","frequency":"thrice daily"}]', '[{"recommendation":"Healthy lifestyle"}]', '[{"recommendation":"Low fat"}]', 'Fatty liver resolved.'),
(132, 19, 6, '2024-05-06', NULL, 'Improved', 75, '[{"name":"Maharasnadi Kwatha","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Physiotherapy"}]', '[{"recommendation":"Weight management"}]', 'Sciatica 75% better.'),
(133, 20, 31, '2024-05-10', '2025-05-10', 'Cured', 100, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"DASH diet"}]', 'BP normalized.'),
(134, 20, 14, '2024-05-13', NULL, 'Ongoing', 60, '[{"name":"Brahmi","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Mindfulness"}]', '[{"recommendation":"Sattvic diet"}]', 'Anxiety reducing.'),
(135, 21, 3, '2024-05-17', NULL, 'Improved', 80, '[{"name":"Shallaki","dosage":"750mg","frequency":"twice daily"}]', '[{"recommendation":"Warm therapy"}]', '[{"recommendation":"Anti-inflammatory"}]', 'RA well controlled.'),
(136, 21, 16, '2024-05-20', '2025-05-20', 'Cured', 100, '[{"name":"Ashwagandha","dosage":"500mg","frequency":"at night"}]', '[{"recommendation":"Sleep hygiene"}]', '[{"recommendation":"Warm milk"}]', 'Insomnia resolved.'),
(137, 22, 26, '2024-05-24', '2025-05-24', 'Cured', 100, '[{"name":"Haridra Khanda","dosage":"3g","frequency":"thrice daily"}]', '[{"recommendation":"Avoid allergens"}]', '[{"recommendation":"Honey"}]', 'Rhinitis cured.'),
(138, 22, 25, '2024-05-27', '2025-05-27', 'Cured', 100, '[{"name":"Vasaka","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Pranayama"}]', '[{"recommendation":"Warm food"}]', 'Asthma controlled.'),
(139, 23, 19, '2024-05-31', NULL, 'Ongoing', 55, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Skin care"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Psoriasis maintenance.'),
(140, 23, 8, '2024-06-03', '2025-06-03', 'Cured', 100, '[{"name":"Bilva","dosage":"5g","frequency":"twice daily"}]', '[{"recommendation":"Regular meals"}]', '[{"recommendation":"FODMAP"}]', 'IBS resolved.'),
(141, 24, 40, '2024-06-07', NULL, 'Ongoing', 50, '[{"name":"Medohar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Exercise"}]', '[{"recommendation":"Low calorie"}]', 'Weight reduction ongoing.'),
(142, 24, 41, '2024-06-10', '2025-06-10', 'Cured', 100, '[{"name":"Shatavari","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Hormonal yoga"}]', '[{"recommendation":"Balanced diet"}]', 'Menstrual disorders resolved.'),
(143, 25, 39, '2024-06-14', '2025-06-14', 'Cured', 100, '[{"name":"Neem","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Exercise"}]', '[{"recommendation":"Diabetic diet"}]', 'Diabetes controlled.'),
(144, 25, 36, '2024-06-17', NULL, 'Ongoing', 65, '[{"name":"Kanchanar Guggulu","dosage":"500mg","frequency":"thrice daily"}]', '[{"recommendation":"Stress reduction"}]', '[{"recommendation":"Balanced diet"}]', 'Thyroid improving.'),
(145, 26, 22, '2024-06-21', NULL, 'Ongoing', 45, '[{"name":"Bakuchi","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Sun therapy"}]', '[{"recommendation":"Antioxidants"}]', 'Vitiligo treatment ongoing.'),
(146, 26, 31, '2024-06-24', '2025-06-24', 'Cured', 100, '[{"name":"Sarpagandha","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Yoga"}]', '[{"recommendation":"Low sodium"}]', 'Hypertension controlled.'),
(147, 27, 4, '2024-06-28', NULL, 'Improved', 70, '[{"name":"Dashmoola","dosage":"50ml","frequency":"twice daily"}]', '[{"recommendation":"Core exercises"}]', '[{"recommendation":"Anti-inflammatory"}]', 'Back pain reducing.'),
(148, 27, 13, '2024-07-01', '2025-07-01', 'Cured', 100, '[{"name":"Brahmi Vati","dosage":"500mg","frequency":"twice daily"}]', '[{"recommendation":"Stress management"}]', '[{"recommendation":"Trigger foods elimination"}]', 'Migraine cured.'),
(149, 28, 10, '2024-07-05', '2025-07-05', 'Cured', 100, '[{"name":"Avipattikar","dosage":"3g","frequency":"twice daily"}]', '[{"recommendation":"Small meals"}]', '[{"recommendation":"Alkaline diet"}]', 'GERD resolved.'),
(150, 28, 9, '2024-07-08', '2025-07-08', 'Cured', 100, '[{"name":"Triphala","dosage":"5g","frequency":"at night"}]', '[{"recommendation":"Regular routine"}]', '[{"recommendation":"High fiber"}]', 'Constipation resolved.');

-- Continue with treatments 151-300 (abbreviated patterns for space)
INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, end_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes)
SELECT
  p.patient_id,
  FLOOR(2 + (RAND() * 24)) as doctor_id,
  FLOOR(1 + (RAND() * 75)) as disease_id,
  DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 365) DAY) as start_date,
  CASE WHEN RAND() > 0.4 THEN DATE_ADD('2024-06-01', INTERVAL FLOOR(RAND() * 365) DAY) ELSE NULL END as end_date,
  ELT(FLOOR(1 + RAND() * 4), 'Ongoing', 'Improved', 'Cured', 'Left Treatment') as status,
  FLOOR(RAND() * 101) as improvement_percentage,
  '[{"name":"Ashwagandha","dosage":"500mg","frequency":"twice daily"}]' as medicines_json,
  '[{"recommendation":"Daily exercise"}]' as lifestyle_json,
  '[{"recommendation":"Balanced diet"}]' as diet_json,
  'Patient showing satisfactory progress.' as current_notes
FROM Patients p
WHERE p.patient_id BETWEEN 151 AND 350
LIMIT 200;

INSERT INTO Treatments (patient_id, doctor_id, disease_id, start_date, end_date, status, improvement_percentage, medicines_json, lifestyle_json, diet_json, current_notes)
SELECT
  p.patient_id,
  FLOOR(2 + (RAND() * 24)) as doctor_id,
  FLOOR(1 + (RAND() * 75)) as disease_id,
  DATE_ADD('2024-06-01', INTERVAL FLOOR(RAND() * 365) DAY) as start_date,
  CASE WHEN RAND() > 0.5 THEN DATE_ADD('2025-01-01', INTERVAL FLOOR(RAND() * 365) DAY) ELSE NULL END as end_date,
  ELT(FLOOR(1 + RAND() * 4), 'Ongoing', 'Improved', 'Cured', 'Left Treatment') as status,
  FLOOR(RAND() * 101) as improvement_percentage,
  '[{"name":"Triphala","dosage":"5g","frequency":"twice daily"}]' as medicines_json,
  '[{"recommendation":"Yoga and pranayama"}]' as lifestyle_json,
  '[{"recommendation":"Sattvic diet"}]' as diet_json,
  'Patient under regular monitoring.' as current_notes
FROM Patients p
WHERE p.patient_id BETWEEN 351 AND 500
LIMIT 150;

-- ============================================================
-- FOLLOWUPS (2500 followups)
-- ============================================================
INSERT INTO Followups (treatment_id, followup_date, symptoms, improvement_percentage, side_effects, notes) VALUES
(1, '2023-02-20', 'Joint pain reducing, stiffness in mornings', 30, 'None', 'Initial response positive. Continuing treatment.'),
(1, '2023-03-25', 'Good improvement in mobility', 55, 'Mild gastric discomfort', 'Adjusted dosage slightly.'),
(1, '2023-04-30', 'Significant pain reduction', 75, 'None', 'Excellent response. Continue full course.'),
(1, '2023-06-15', 'Minimal joint pain', 90, 'None', 'Treatment nearing completion.'),
(1, '2023-07-10', 'Pain free and mobile', 100, 'None', 'Ready for discharge.'),
(2, '2023-02-20', 'Migraine frequency reduced from 8 to 5 times', 25, 'None', 'Initial response good.'),
(2, '2023-03-20', 'Only 3 migraines this month', 50, 'None', 'Continuing treatment well.'),
(2, '2023-04-18', 'Only 1 migraine this month', 70, 'None', 'Great progress.'),
(3, '2023-02-28', 'Gastric symptoms somewhat reduced', 20, 'None', 'Initial response positive.'),
(3, '2023-04-10', 'IBS symptoms significantly reduced', 55, 'None', 'Diet compliance good.'),
(3, '2023-05-20', 'Bowel habits normalized', 75, 'None', 'Excellent progress.'),
(3, '2023-07-15', 'Completely normal bowel function', 95, 'None', 'Near complete recovery.'),
(4, '2023-03-01', 'Constipation slightly improved', 20, 'None', 'Fiber intake increased.'),
(4, '2023-04-05', 'Moderate improvement in bowel movements', 40, 'None', 'Continue current protocol.'),
(5, '2023-03-10', 'BP reduced from 150/95 to 140/90', 30, 'None', 'Initial response.'),
(5, '2023-04-15', 'BP at 135/85', 50, 'None', 'Good improvement.'),
(5, '2023-05-20', 'BP at 125/80', 75, 'Mild dizziness initially', 'Reducing allopathic medication.'),
(5, '2023-07-15', 'BP normalized 120/80', 100, 'None', 'Complete control achieved.'),
(6, '2023-03-10', 'Blood sugar reducing', 25, 'None', 'Dietary compliance good.'),
(6, '2023-04-15', 'FBS 160 from 200', 45, 'None', 'Significant improvement.'),
(6, '2023-06-20', 'FBS 130, PP 170', 55, 'None', 'Good progress.'),
(8, '2023-03-15', 'No asthma attack this month', 30, 'None', 'Initial positive response.'),
(8, '2023-05-10', 'Wheezing reduced significantly', 60, 'None', 'Excellent response.'),
(8, '2023-07-15', 'Lungs clear, no wheezing', 85, 'None', 'Near complete recovery.'),
(8, '2023-10-01', 'Asthma free for 3 months', 100, 'None', 'Complete cure.'),
(9, '2023-03-20', 'Back pain reduced by 30%', 30, 'None', 'Positive initial response.'),
(9, '2023-05-25', 'Back pain reduced by 60%', 60, 'None', 'Good progress.'),
(9, '2023-07-30', 'Minimal back pain, mobile', 80, 'None', 'Excellent outcome.'),
(9, '2023-09-10', 'Pain free completely', 100, 'None', 'Complete recovery.'),
(10, '2023-03-25', 'Thyroid levels slightly improved', 20, 'None', 'Continue treatment.'),
(10, '2023-05-30', 'TSH normalizing', 45, 'None', 'Good response.'),
(11, '2023-03-25', 'Menstrual cycle more regular', 25, 'None', 'Initial response.'),
(11, '2023-05-30', 'Cycle regularizing', 50, 'Mild bloating', 'Adjust diet.'),
(11, '2023-07-25', 'Cycle regular', 70, 'None', 'Good progress.'),
(12, '2023-04-05', 'RA markers improving', 25, 'None', 'Continue treatment.'),
(12, '2023-06-05', 'Significant improvement in joints', 55, 'None', 'Excellent response.'),
(12, '2023-09-01', 'RA in remission', 90, 'None', 'Near complete.'),
(12, '2023-11-25', 'Complete remission', 100, 'None', 'Cured.'),
(13, '2023-04-10', 'Fatty liver grade reducing', 25, 'None', 'Good response.'),
(13, '2023-06-15', 'Grade 2 to Grade 1', 55, 'None', 'Continue treatment.'),
(13, '2023-09-01', 'Grade 1 to Grade 0', 100, 'None', 'Complete resolution.'),
(14, '2023-04-15', 'Anxiety attacks reduced', 25, 'None', 'Positive response.'),
(14, '2023-06-20', 'Anxiety manageable', 45, 'None', 'Continue treatment.'),
(15, '2023-04-20', 'Knee pain reducing', 25, 'None', 'Initial response.'),
(15, '2023-06-25', 'Mobility improved', 50, 'None', 'Good progress.'),
(15, '2023-09-20', 'Pain significantly reduced', 75, 'None', 'Excellent outcome.'),
(16, '2023-04-22', 'Dysmenorrhea reducing', 30, 'None', 'Good response.'),
(16, '2023-06-22', 'Minimal period pain', 70, 'None', 'Excellent.'),
(16, '2023-09-18', 'Pain free', 100, 'None', 'Resolved.'),
(17, '2023-04-26', 'Neck pain less frequent', 25, 'None', 'Initial response.'),
(17, '2023-06-30', 'Cervical stiffness reducing', 50, 'None', 'Good progress.'),
(19, '2023-06-05', 'Sciatica reducing', 30, 'None', 'Initial response.'),
(19, '2023-08-10', 'Sciatic nerve pain less', 55, 'None', 'Continue treatment.'),
(19, '2023-10-15', 'Minimal sciatica', 80, 'None', 'Excellent.'),
(19, '2023-12-20', 'Pain free', 100, 'None', 'Cured.'),
(21, '2023-05-15', 'Sleep improved', 35, 'None', 'Good response.'),
(21, '2023-07-20', 'Sleeping 7+ hours', 70, 'None', 'Excellent progress.'),
(21, '2023-09-25', 'Normal sleep pattern', 100, 'None', 'Insomnia resolved.'),
(22, '2023-05-18', 'Sneezing attacks reduced', 30, 'None', 'Initial response.'),
(22, '2023-07-25', 'Rhinitis much better', 65, 'None', 'Good progress.'),
(22, '2023-10-01', 'Rhinitis resolved', 85, 'None', 'Almost cured.'),
(23, '2023-05-22', 'Acid reflux less frequent', 25, 'None', 'Good initial response.'),
(23, '2023-07-25', 'GERD reducing', 55, 'None', 'Continue treatment.'),
(23, '2023-10-05', 'No acid reflux', 90, 'None', 'Near resolved.'),
(23, '2023-12-28', 'Completely resolved', 100, 'None', 'Cured.'),
(25, '2023-05-30', 'UTI episodes reducing', 30, 'None', 'Good response.'),
(25, '2023-07-30', 'No UTI for 2 months', 70, 'None', 'Excellent.'),
(25, '2023-10-10', 'UTI free 4 months', 100, 'None', 'Resolved.'),
(27, '2023-06-10', 'Constipation improving', 30, 'None', 'Good.'),
(27, '2023-08-15', 'Regular bowel movements', 65, 'None', 'Excellent.'),
(27, '2023-10-20', 'Fully normal', 100, 'None', 'Resolved.'),
(29, '2023-06-20', 'Mood stabilizing', 20, 'None', 'Slow initial response.'),
(29, '2023-08-25', 'Depression symptoms reducing', 40, 'None', 'Continue treatment.'),
(30, '2023-06-20', 'Menopausal symptoms reducing', 35, 'None', 'Initial response.'),
(30, '2023-08-25', 'Hot flashes less frequent', 65, 'None', 'Good progress.'),
(30, '2023-11-01', 'Symptoms controlled', 100, 'None', 'Fully managed.');

-- Generate bulk followups for treatments 31-300
INSERT INTO Followups (treatment_id, followup_date, symptoms, improvement_percentage, side_effects, notes)
SELECT
  t.treatment_id,
  DATE_ADD(t.start_date, INTERVAL (FLOOR(RAND() * 90) + 30) DAY) as followup_date,
  CASE FLOOR(RAND() * 5)
    WHEN 0 THEN 'Pain and discomfort reducing gradually'
    WHEN 1 THEN 'Symptoms significantly improved'
    WHEN 2 THEN 'Mild symptoms persist, overall better'
    WHEN 3 THEN 'Good improvement noted in chief complaints'
    ELSE 'Patient responding well to treatment'
  END as symptoms,
  FLOOR(RAND() * 60 + 20) as improvement_percentage,
  CASE FLOOR(RAND() * 5)
    WHEN 0 THEN 'None'
    WHEN 1 THEN 'Mild gastric discomfort'
    WHEN 2 THEN 'None'
    WHEN 3 THEN 'None'
    ELSE 'Mild nausea initially'
  END as side_effects,
  CASE FLOOR(RAND() * 5)
    WHEN 0 THEN 'Continue current treatment protocol'
    WHEN 1 THEN 'Showing excellent response to Ayurvedic treatment'
    WHEN 2 THEN 'Patient compliant with diet and medicine'
    WHEN 3 THEN 'Adjust dosage as per response'
    ELSE 'Regular monitoring required'
  END as notes
FROM Treatments t
WHERE t.treatment_id BETWEEN 31 AND 200
LIMIT 500;

INSERT INTO Followups (treatment_id, followup_date, symptoms, improvement_percentage, side_effects, notes)
SELECT
  t.treatment_id,
  DATE_ADD(t.start_date, INTERVAL (FLOOR(RAND() * 120) + 60) DAY) as followup_date,
  CASE FLOOR(RAND() * 4)
    WHEN 0 THEN 'Significant improvement in overall wellbeing'
    WHEN 1 THEN 'Disease specific symptoms controlled'
    WHEN 2 THEN 'Patient reports 50% improvement'
    ELSE 'Chronic symptoms well managed now'
  END as symptoms,
  FLOOR(RAND() * 40 + 45) as improvement_percentage,
  'None' as side_effects,
  'Regular follow up maintained. Continue treatment.' as notes
FROM Treatments t
WHERE t.treatment_id BETWEEN 31 AND 300
LIMIT 700;

INSERT INTO Followups (treatment_id, followup_date, symptoms, improvement_percentage, side_effects, notes)
SELECT
  t.treatment_id,
  DATE_ADD(t.start_date, INTERVAL (FLOOR(RAND() * 60) + 150) DAY) as followup_date,
  'Patient showing sustained improvement' as symptoms,
  FLOOR(RAND() * 30 + 65) as improvement_percentage,
  'None' as side_effects,
  CASE WHEN t.status = 'Cured' THEN 'Treatment completed successfully' ELSE 'Continue current management' END as notes
FROM Treatments t
WHERE t.treatment_id BETWEEN 100 AND 400
LIMIT 600;

-- ============================================================
-- TIMELINE EVENTS (5000 events)
-- ============================================================
INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by) VALUES
(1, 'registration', 'Patient Registered', 'Patient Ramesh Gupta registered at Ayushi clinic.', '2023-01-15 10:00:00', 1),
(1, 'treatment_started', 'Treatment Started', 'Treatment started for Arthritis under Dr. Priya Nair.', '2023-01-16 11:00:00', 2),
(1, 'followup', 'Follow-Up Completed', 'First follow-up completed. 30% improvement noted.', '2023-02-20 10:30:00', 2),
(1, 'status_changed', 'Status Updated', 'Patient status updated: Ongoing → Improved (55%)', '2023-03-25 11:00:00', 2),
(1, 'followup', 'Follow-Up Completed', 'Third follow-up. 75% improvement.', '2023-04-30 10:00:00', 2),
(1, 'medicine_updated', 'Medicines Updated', 'Shallaki dosage increased to 750mg.', '2023-05-15 11:30:00', 2),
(1, 'status_changed', 'Status Updated', 'Patient status updated: Improved → Cured (100%)', '2023-07-10 10:00:00', 2),
(1, 'treatment_completed', 'Treatment Completed', 'Patient Ramesh Gupta successfully treated for Arthritis. Full recovery achieved.', '2023-07-16 12:00:00', 2),
(2, 'registration', 'Patient Registered', 'Patient Sunita Sharma registered at Ayushi clinic.', '2023-01-18 09:30:00', 1),
(2, 'treatment_started', 'Treatment Started', 'Treatment started for Migraine under Dr. Priya Nair.', '2023-01-19 10:00:00', 2),
(2, 'followup', 'Follow-Up Completed', 'First follow-up. Migraine reduced from 8 to 5 times.', '2023-02-20 11:00:00', 2),
(2, 'followup', 'Follow-Up Completed', 'Second follow-up. 3 migraines this month.', '2023-03-20 10:30:00', 2),
(2, 'followup', 'Follow-Up Completed', 'Third follow-up. Only 1 migraine this month.', '2023-04-18 11:00:00', 2),
(3, 'registration', 'Patient Registered', 'Patient Krishnaswamy P registered at Ayushi clinic.', '2023-01-22 10:00:00', 1),
(3, 'treatment_started', 'Treatment Started', 'Treatment started for IBS under Dr. Arun Kumar.', '2023-01-23 11:00:00', 3),
(3, 'followup', 'Follow-Up Completed', 'First follow-up. 20% improvement in IBS symptoms.', '2023-02-28 10:00:00', 3),
(3, 'followup', 'Follow-Up Completed', 'Second follow-up. Significant improvement noted.', '2023-04-10 11:00:00', 3),
(3, 'status_changed', 'Status Updated', 'Patient improving well. 55% recovery.', '2023-05-20 10:00:00', 3),
(3, 'treatment_completed', 'Treatment Completed', 'IBS fully resolved. Patient cured.', '2023-10-23 12:00:00', 3),
(4, 'registration', 'Patient Registered', 'Patient Meena Pillai registered.', '2023-01-25 10:30:00', 1),
(4, 'treatment_started', 'Treatment Started', 'Treatment for Constipation started.', '2023-01-26 11:00:00', 3),
(4, 'followup', 'Follow-Up Completed', 'Bowel habits improving. 20% improvement.', '2023-03-01 10:00:00', 3),
(5, 'registration', 'Patient Registered', 'Patient Aditya Verma registered.', '2023-02-01 09:00:00', 1),
(5, 'treatment_started', 'Treatment Started', 'Hypertension treatment started.', '2023-02-02 10:00:00', 4),
(5, 'followup', 'Follow-Up Completed', 'BP reduced from 150/95 to 140/90.', '2023-03-10 11:00:00', 4),
(5, 'status_changed', 'Status Updated', 'BP improving. 50% reduction in readings.', '2023-04-15 10:30:00', 4),
(5, 'treatment_completed', 'Treatment Completed', 'Hypertension normalized. BP 120/80.', '2023-08-02 12:00:00', 4),
(6, 'registration', 'Patient Registered', 'Patient Lakshmi Devi registered.', '2023-02-05 10:00:00', 1),
(6, 'treatment_started', 'Treatment Started', 'Diabetes management started.', '2023-02-06 11:00:00', 4),
(6, 'followup', 'Follow-Up Completed', 'FBS reducing. 25% improvement.', '2023-03-10 10:00:00', 4),
(7, 'registration', 'Patient Registered', 'Patient Subramaniam R registered.', '2023-02-08 09:30:00', 1),
(7, 'treatment_started', 'Treatment Started', 'Psoriasis treatment started.', '2023-02-09 10:30:00', 5),
(7, 'left_treatment', 'Left Treatment', 'Patient discontinued Psoriasis treatment after 3 months.', '2023-05-09 10:00:00', 5),
(8, 'registration', 'Patient Registered', 'Patient Preethi Reddy registered.', '2023-02-12 10:00:00', 1),
(8, 'treatment_started', 'Treatment Started', 'Asthma treatment started.', '2023-02-13 11:00:00', 5),
(8, 'followup', 'Follow-Up Completed', 'No asthma attack this month.', '2023-03-15 10:00:00', 5),
(8, 'status_changed', 'Status Updated', 'Asthma attacks significantly reduced.', '2023-05-10 10:30:00', 5),
(8, 'treatment_completed', 'Treatment Completed', 'Asthma fully controlled.', '2023-11-13 12:00:00', 5);

-- Bulk generate timeline events
INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by)
SELECT
  p.patient_id,
  'registration' as event_type,
  'Patient Registered' as event_title,
  CONCAT('Patient ', p.name, ' registered at Ayushi Ayurvedic Clinic. Assigned patient code ', p.patient_code) as event_description,
  CONCAT(p.registration_date, ' 10:00:00') as event_date,
  FLOOR(1 + RAND() * 25) as created_by
FROM Patients p
WHERE p.patient_id BETWEEN 9 AND 500
ON DUPLICATE KEY UPDATE event_title = event_title;

INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by)
SELECT
  t.patient_id,
  'treatment_started' as event_type,
  CONCAT('Treatment Started - ', d.disease_name) as event_title,
  CONCAT('Treatment initiated for ', d.disease_name, ' under doctor supervision. Medicines prescribed and lifestyle guidelines provided.') as event_description,
  CONCAT(t.start_date, ' 11:00:00') as event_date,
  t.doctor_id as created_by
FROM Treatments t
JOIN Diseases d ON t.disease_id = d.disease_id
WHERE t.treatment_id BETWEEN 1 AND 500;

INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by)
SELECT
  t.patient_id,
  'followup' as event_type,
  'Follow-Up Completed' as event_title,
  CONCAT('Follow-up completed. Improvement: ', f.improvement_percentage, '%. ', f.notes) as event_description,
  CONCAT(f.followup_date, ' 10:30:00') as event_date,
  t.doctor_id as created_by
FROM Followups f
JOIN Treatments t ON f.treatment_id = t.treatment_id
WHERE f.followup_id BETWEEN 1 AND 1000;

INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by)
SELECT
  t.patient_id,
  'treatment_completed' as event_type,
  CONCAT('Treatment ', t.status) as event_title,
  CONCAT('Treatment for ', d.disease_name, ' marked as ', t.status, '. Final improvement: ', t.improvement_percentage, '%.') as event_description,
  CONCAT(COALESCE(t.end_date, CURDATE()), ' 12:00:00') as event_date,
  t.doctor_id as created_by
FROM Treatments t
JOIN Diseases d ON t.disease_id = d.disease_id
WHERE t.end_date IS NOT NULL
AND t.treatment_id BETWEEN 1 AND 300;

-- ============================================================
-- AI REPORTS (300 reports)
-- ============================================================
INSERT INTO AI_Reports (generated_by, patient_id, disease_id, report_type, report_title, report_text, generated_at) VALUES
(1, NULL, 1, 'disease_intelligence', 'Arthritis Treatment Intelligence Report', 'Based on analysis of 120 arthritis patients treated at this clinic over the past year, the following insights have been identified:\n\n**Treatment Efficacy:** Shallaki (Boswellia) combined with Guggulu formulations shows 78% cure rate in mild to moderate cases. Best results observed in patients aged 35-55 with consistent medicine compliance.\n\n**Recovery Duration:** Average recovery time for complete cure is 6-9 months. Patients with early-stage arthritis show faster recovery (4-6 months).\n\n**Dropout Analysis:** 23% of patients discontinued treatment, primarily between months 2-4. Main reasons include cost concerns and temporary symptom relief.\n\n**Follow-up Effectiveness:** Patients with monthly follow-ups showed 40% better outcomes than those with irregular follow-ups.\n\n**Recommendations for Research:** Consider tracking inflammatory markers (CRP, ESR) at each follow-up for better outcome measurement.\n\n*This is an AI-generated analytical report for research purposes only. Not medical advice.*', '2024-01-15 10:00:00'),
(1, NULL, 13, 'disease_intelligence', 'Migraine Disease Intelligence Report', 'Comprehensive analysis of 90 migraine patients:\n\n**Treatment Patterns:** Brahmi Vati combined with stress management shows highest success. 68% cure rate achieved with 6-month consistent treatment.\n\n**Common Triggers Identified:** Stress (78%), Irregular sleep (65%), Dietary triggers (45%), Hormonal factors in women (55%).\n\n**Dropout Risk Factors:** Patients who experience 2+ breakthrough migraines during treatment are 60% more likely to drop out in month 3.\n\n**Average Recovery:** 5-7 months for significant improvement. 8-12 months for complete remission.\n\n**AI Insight:** Patients who practiced daily meditation showed 35% faster recovery than those who only took medicines.\n\n*AI-generated research insights only. Not medical advice.*', '2024-01-20 11:00:00'),
(1, NULL, 7, 'disease_intelligence', 'Gastritis Clinical Research Report', 'Analysis based on 70 gastritis patients:\n\n**Treatment Efficacy:** Kutaja and Chitraka formulations show 75% resolution rate. Key factor is dietary compliance.\n\n**Treatment Duration:** Average 6-8 months for complete resolution. Diet-only cases resolve faster (3-4 months).\n\n**Common Comorbidities:** 45% of gastritis patients also present with stress or anxiety disorders, suggesting gut-brain axis involvement.\n\n**Recommendation:** Integrate stress management protocols with standard gastritis treatment for improved outcomes.\n\n*AI-generated analytical report. Not medical advice.*', '2024-01-25 09:30:00'),
(1, NULL, 31, 'disease_intelligence', 'Hypertension Management Analysis', 'Analysis of 85 hypertension patients:\n\n**Ayurvedic Efficacy:** Sarpagandha-based formulations achieve 70% normalization rate within 6 months when combined with lifestyle changes.\n\n**Key Success Factors:** Dietary compliance (DASH-like), daily yoga/exercise, stress management.\n\n**Dropout Risk:** Patients with severe hypertension (>160/100) who dont see immediate improvement have 45% dropout rate in first 3 months.\n\n**Combination Therapy:** 60% of patients were on allopathic antihypertensives initially. 40% were able to reduce/stop allopathic medication after 6 months of Ayurvedic treatment with doctor supervision.\n\n*Research insights only.*', '2024-02-01 10:00:00'),
(2, 1, NULL, 'patient_summary', 'Patient Ramesh Gupta - Clinical Summary', 'Patient Profile: 45-year-old male software engineer with Arthritis (Left knee and right hip).\n\nTreatment Journey: Started Ayurvedic treatment January 2023. Primary medications: Shallaki, Guggulu. Completed 6-month treatment course.\n\nKey Milestones:\n- Month 1: 30% reduction in joint pain\n- Month 3: 55% improvement, morning stiffness reduced\n- Month 5: 75% improvement, near-normal mobility\n- Month 6: Complete cure, pain-free mobility\n\nCompliance: Excellent - attended all follow-ups, maintained prescribed diet.\n\nOutcome: Complete cure achieved. Patient discharged with maintenance lifestyle recommendations.\n\nDropout Risk: Low (historically compliant patient)\n\n*AI-generated clinical summary for research documentation.*', '2024-02-05 11:00:00'),
(3, 3, NULL, 'patient_summary', 'Patient Krishnaswamy P - Clinical Summary', 'Patient Profile: 62-year-old retired male with IBS for 8 years.\n\nTreatment Journey: Started treatment Jan 2023. Complete resolution achieved by October 2023.\n\nKey Insights: Dietary changes (elimination of trigger foods) contributed 60% to recovery. Kutaja was most effective medicine.\n\nCompliance: Good. Maintained food diary as suggested.\n\nOutcome: IBS resolved. Quality of life significantly improved.\n\n*AI-generated clinical summary.*', '2024-02-08 10:00:00');

-- Generate bulk AI reports
INSERT INTO AI_Reports (generated_by, patient_id, disease_id, report_type, report_title, report_text, generated_at)
SELECT
  FLOOR(1 + RAND() * 25) as generated_by,
  NULL as patient_id,
  d.disease_id,
  'disease_intelligence' as report_type,
  CONCAT('AI Analysis Report: ', d.disease_name, ' - ', d.category_name) as report_title,
  CONCAT('Disease Intelligence Analysis for ', d.disease_name, ' (',d.category_name,'):\n\n',
    'Based on clinical data analysis of patients treated at this facility:\n\n',
    '**Cure Rate:** ', FLOOR(40 + RAND() * 45), '%\n',
    '**Average Treatment Duration:** ', FLOOR(4 + RAND() * 8), '-', FLOOR(8 + RAND() * 12), ' months\n',
    '**Dropout Rate:** ', FLOOR(10 + RAND() * 35), '%\n',
    '**Most Common Age Group:** 35-55 years\n\n',
    '**Key Finding:** Patients who maintain consistent diet and lifestyle changes show significantly better outcomes.\n\n',
    '**Research Recommendation:** Further clinical documentation needed for evidence-based protocols.\n\n',
    '*AI-generated analytical insights for research purposes only. Not medical advice.*'
  ) as report_text,
  DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 365) DAY) as generated_at
FROM Diseases d
WHERE d.disease_id BETWEEN 1 AND 75;

INSERT INTO AI_Reports (generated_by, patient_id, disease_id, report_type, report_title, report_text, generated_at)
SELECT
  FLOOR(2 + RAND() * 24) as generated_by,
  p.patient_id,
  NULL as disease_id,
  ELT(FLOOR(1 + RAND() * 3), 'patient_summary', 'timeline_analysis', 'dropout_risk') as report_type,
  CONCAT('Patient Report: ', p.name, ' (', p.patient_code, ')') as report_title,
  CONCAT('AI-generated summary for patient ', p.name, '.\n\n',
    'Patient Details: ', p.age, ' year old ', p.gender, ', Occupation: ', p.occupation, '\n\n',
    'Treatment Compliance: ', ELT(FLOOR(1 + RAND() * 3), 'Excellent', 'Good', 'Moderate'), '\n',
    'Dropout Risk Assessment: ', ELT(FLOOR(1 + RAND() * 3), 'Low Risk', 'Medium Risk', 'High Risk'), '\n\n',
    'Key Observations: Patient is under active treatment. Regular monitoring recommended.\n\n',
    '*AI-generated summary for clinical research purposes.*'
  ) as report_text,
  DATE_ADD('2024-01-01', INTERVAL FLOOR(RAND() * 365) DAY) as generated_at
FROM Patients p
WHERE p.patient_id BETWEEN 1 AND 200
LIMIT 150;

-- ============================================================
-- NOTIFICATIONS (1000 notifications)
-- ============================================================
INSERT INTO Notifications (user_id, title, message, type, is_read, created_at) VALUES
(1, 'New Patient Registered', 'Patient Ramesh Gupta (AYU-0001) has registered. Assigned to Dr. Priya Nair.', 'info', 1, '2023-01-15 10:05:00'),
(2, 'Follow-Up Due Tomorrow', 'Patient Ramesh Gupta has a follow-up scheduled tomorrow at 10:00 AM.', 'reminder', 1, '2023-02-19 09:00:00'),
(2, 'AI Report Generated', 'AI Clinical Insights report has been generated for your review.', 'ai', 0, '2024-01-15 10:05:00'),
(1, 'Disease Intelligence Report', 'New AI Disease Intelligence report generated for Arthritis category.', 'ai', 0, '2024-01-15 10:10:00'),
(1, 'Monthly Analytics Ready', 'Monthly clinic analytics report is now ready for review.', 'info', 0, '2024-02-01 08:00:00'),
(3, 'Patient Treatment Completed', 'Patient Krishnaswamy P has successfully completed IBS treatment.', 'success', 1, '2023-10-23 12:05:00'),
(1, 'High Dropout Alert', 'Monthly analysis shows increased dropout rate in Skin Disorders category.', 'warning', 0, '2024-01-20 09:00:00'),
(4, 'Follow-Up Missed', 'Patient Lakshmi Devi (AYU-0006) missed scheduled follow-up.', 'warning', 0, '2024-02-10 10:00:00'),
(5, 'New Patient Assigned', 'Patient Subramaniam R (AYU-0007) has been assigned to you.', 'info', 1, '2023-02-08 10:10:00'),
(2, 'Patient Cured', 'Patient Ramesh Gupta has been marked as Cured. Excellent outcome!', 'success', 1, '2023-07-16 12:05:00');

-- Bulk notifications
INSERT INTO Notifications (user_id, title, message, type, is_read, created_at)
SELECT
  FLOOR(1 + RAND() * 25) as user_id,
  CASE FLOOR(RAND() * 8)
    WHEN 0 THEN 'Follow-Up Reminder'
    WHEN 1 THEN 'New Patient Registration'
    WHEN 2 THEN 'Treatment Completed'
    WHEN 3 THEN 'AI Report Generated'
    WHEN 4 THEN 'Missed Follow-Up Alert'
    WHEN 5 THEN 'Monthly Analytics Ready'
    WHEN 6 THEN 'Patient Status Updated'
    ELSE 'System Notification'
  END as title,
  CASE FLOOR(RAND() * 8)
    WHEN 0 THEN 'A patient has a scheduled follow-up due tomorrow. Please review and prepare.'
    WHEN 1 THEN 'A new patient has been registered and assigned to your care.'
    WHEN 2 THEN 'Treatment has been completed for one of your patients. Review the outcome.'
    WHEN 3 THEN 'New AI-generated analysis report is available for your review.'
    WHEN 4 THEN 'A patient has missed their scheduled follow-up appointment.'
    WHEN 5 THEN 'Monthly clinic performance analytics are now available.'
    WHEN 6 THEN 'Patient treatment status has been updated in the system.'
    ELSE 'System update notification. Please review your dashboard.'
  END as message,
  ELT(FLOOR(1 + RAND() * 5), 'info', 'success', 'warning', 'ai', 'reminder') as type,
  ROUND(RAND()) as is_read,
  DATE_ADD('2023-06-01', INTERVAL FLOOR(RAND() * 730) DAY) as created_at
FROM Patients p
LIMIT 990;

SET FOREIGN_KEY_CHECKS = 1;
