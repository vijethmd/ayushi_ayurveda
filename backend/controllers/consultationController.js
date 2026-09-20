/**
 * Consultations — the initial query a patient gets on arrival, and the
 * discharge record that closes a treatment out.
 *
 * A consultation carries the six things the intake form asks for:
 *   a. chief complaint   b. diagnosis       c. report (uploaded file)
 *   d. duration          e. drugs advised   f. outcome
 */
const path = require('path');
const fs   = require('fs');
const db   = require('../config/db');
const { removeFile, UPLOAD_DIR } = require('../middleware/upload');

const OUTCOMES = ['Pending', 'Improved', 'No Change', 'Worsened', 'Cured', 'Referred'];
const DURATION_UNITS = ['days', 'weeks', 'months', 'years'];
const FINAL_STATUSES = ['Active', 'Discharged', 'Referred', 'Lost to Follow-up', 'Deceased'];

const back = (res, patientId, msg, type = 'ok') =>
  res.redirect(`/patients/${patientId}?${type}=${encodeURIComponent(msg)}#consultations`);

/** Drugs come in as parallel arrays from the repeating rows in the form. */
const readDrugs = (body) => {
  const names = [].concat(body.drug_name || []);
  const dose  = [].concat(body.drug_dosage || []);
  const freq  = [].concat(body.drug_frequency || []);
  return names
    .map((name, i) => ({ name: String(name).trim(), dosage: (dose[i] || '').trim(), frequency: (freq[i] || '').trim() }))
    .filter(d => d.name);
};

const saveAttachments = async (files, { patientId, consultationId, treatmentId, kind, userId, label }) => {
  for (const f of files || []) {
    await db.query(
      `INSERT INTO Attachments
        (patient_id, consultation_id, treatment_id, kind, label,
         original_name, stored_name, mime_type, size_bytes, uploaded_by)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [patientId, consultationId || null, treatmentId || null, kind, label || null,
       f.originalname, f.filename, f.mimetype, f.size, userId || null]);
  }
};

const logTimeline = (patientId, type, title, desc, userId) =>
  db.query(
    `INSERT INTO Timeline_Events (patient_id, event_type, event_title, event_description, event_date, created_by)
     VALUES (?,?,?,?,NOW(),?)`,
    [patientId, type, title, desc, userId || null]
  ).catch(err => console.error('Timeline log failed:', err.message));

// ── Create the initial query / consultation ──────────────────────────────────
exports.create = async (req, res) => {
  const patientId = req.params.id;
  if (req.uploadError) return back(res, patientId, req.uploadError, 'err');

  const b = req.body;
  const complaint = (b.chief_complaint || '').trim();
  if (!complaint) return back(res, patientId, 'A chief complaint is required.', 'err');

  const outcome = OUTCOMES.includes(b.outcome) ? b.outcome : 'Pending';
  const unit    = DURATION_UNITS.includes(b.duration_unit) ? b.duration_unit : 'days';
  const drugs   = readDrugs(b);

  try {
    const [r] = await db.query(
      `INSERT INTO Consultations
        (patient_id, treatment_id, doctor_id, disease_id, consultation_date, visit_type,
         chief_complaint, diagnosis, duration_value, duration_unit, drugs_json,
         outcome, outcome_notes, examination_notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        patientId,
        b.treatment_id || null,
        b.doctor_id || req.user.userId,
        b.disease_id || null,
        b.consultation_date || new Date().toISOString().slice(0, 10),
        ['Initial', 'Follow-up', 'Review'].includes(b.visit_type) ? b.visit_type : 'Initial',
        complaint,
        (b.diagnosis || '').trim() || null,
        b.duration_value ? parseInt(b.duration_value, 10) : null,
        unit,
        drugs.length ? JSON.stringify(drugs) : null,
        outcome,
        (b.outcome_notes || '').trim() || null,
        (b.examination_notes || '').trim() || null,
      ]);

    const consultationId = r.insertId;
    await saveAttachments(req.files, {
      patientId, consultationId, treatmentId: b.treatment_id || null,
      kind: 'report', userId: req.user.userId, label: (b.report_label || '').trim() || null,
    });

    const dur = b.duration_value ? ` · ${b.duration_value} ${unit}` : '';
    await logTimeline(patientId, 'consultation',
      `${b.visit_type || 'Initial'} consultation — ${complaint.slice(0, 90)}`,
      [(b.diagnosis || '').trim() && `Diagnosis: ${b.diagnosis.trim()}`,
       drugs.length && `Advised: ${drugs.map(d => d.name).join(', ')}`,
       `Outcome: ${outcome}${dur}`].filter(Boolean).join(' · '),
      req.user.userId);

    back(res, patientId, 'Consultation recorded.');
  } catch (err) {
    console.error('Consultation create failed:', err.message);
    (req.files || []).forEach(f => removeFile(f.filename));
    back(res, patientId, err.message, 'err');
  }
};

// ── Update an existing consultation's outcome (f) ────────────────────────────
exports.updateOutcome = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT patient_id FROM Consultations WHERE consultation_id=?', [id]);
    if (!rows.length) return res.redirect('/patients');
    const patientId = rows[0].patient_id;
    if (req.uploadError) return back(res, patientId, req.uploadError, 'err');

    const outcome = OUTCOMES.includes(req.body.outcome) ? req.body.outcome : 'Pending';
    await db.query(
      'UPDATE Consultations SET outcome=?, outcome_notes=? WHERE consultation_id=?',
      [outcome, (req.body.outcome_notes || '').trim() || null, id]);

    await saveAttachments(req.files, {
      patientId, consultationId: id, kind: 'report',
      userId: req.user.userId, label: (req.body.report_label || '').trim() || null });

    await logTimeline(patientId, 'consultation_outcome',
      `Consultation outcome — ${outcome}`,
      (req.body.outcome_notes || '').trim() || null, req.user.userId);

    back(res, patientId, 'Outcome updated.');
  } catch (err) {
    console.error('Outcome update failed:', err.message);
    res.redirect('/patients');
  }
};

// ── Final status + discharge summary ─────────────────────────────────────────
exports.discharge = async (req, res) => {
  const treatmentId = req.params.id;
  try {
    const [rows] = await db.query('SELECT patient_id FROM Treatments WHERE treatment_id=?', [treatmentId]);
    if (!rows.length) return res.redirect('/treatments');
    const patientId = rows[0].patient_id;
    if (req.uploadError) return back(res, patientId, req.uploadError, 'err');

    const b = req.body;
    const finalStatus = FINAL_STATUSES.includes(b.final_status) ? b.final_status : 'Discharged';
    const dischargeDate = b.discharge_date || new Date().toISOString().slice(0, 10);
    const summary = (b.discharge_summary || '').trim() || null;

    // The treatment's own status stays the clinician's call; only set it when given.
    const sets = ['final_status=?', 'discharge_date=?', 'discharge_summary=?'];
    const args = [finalStatus, finalStatus === 'Active' ? null : dischargeDate, summary];
    if (['Ongoing', 'Improved', 'Cured', 'Left Treatment'].includes(b.status)) {
      sets.push('status=?'); args.push(b.status);
    }
    if (b.improvement_percentage !== undefined && b.improvement_percentage !== '') {
      sets.push('improvement_percentage=?');
      args.push(Math.max(0, Math.min(100, parseInt(b.improvement_percentage, 10) || 0)));
    }
    if (finalStatus !== 'Active') { sets.push('end_date=?'); args.push(dischargeDate); }
    args.push(treatmentId);
    await db.query(`UPDATE Treatments SET ${sets.join(', ')} WHERE treatment_id=?`, args);

    await saveAttachments(req.files, {
      patientId, treatmentId, kind: 'discharge_summary',
      userId: req.user.userId, label: 'Discharge summary' });

    await logTimeline(patientId, 'discharge',
      `Final status — ${finalStatus}`,
      [summary, (req.files || []).length && 'Discharge summary attached.']
        .filter(Boolean).join(' · ') || null,
      req.user.userId);

    back(res, patientId, `Final status set to ${finalStatus}.`);
  } catch (err) {
    console.error('Discharge failed:', err.message);
    (req.files || []).forEach(f => removeFile(f.filename));
    res.redirect('/treatments');
  }
};

// ── Serve / delete an attachment (login required) ────────────────────────────
exports.download = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Attachments WHERE attachment_id=?', [req.params.id]);
    if (!rows.length) return res.status(404).send('Not found');
    const a = rows[0];
    // stored_name is generated by us; resolve and confirm it stays inside UPLOAD_DIR.
    const file = path.resolve(UPLOAD_DIR, a.stored_name);
    if (!file.startsWith(path.resolve(UPLOAD_DIR) + path.sep) || !fs.existsSync(file)) {
      return res.status(404).send('File is no longer on disk');
    }
    res.type(a.mime_type);
    res.setHeader('Content-Disposition',
      `${req.query.dl ? 'attachment' : 'inline'}; filename="${encodeURIComponent(a.original_name)}"`);
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error('Attachment read failed:', err.message);
    res.status(500).send('Could not read the file');
  }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Attachments WHERE attachment_id=?', [req.params.id]);
    if (!rows.length) return res.redirect('/patients');
    const a = rows[0];
    await db.query('DELETE FROM Attachments WHERE attachment_id=?', [req.params.id]);
    removeFile(a.stored_name);
    back(res, a.patient_id, 'Attachment removed.');
  } catch (err) {
    console.error('Attachment delete failed:', err.message);
    res.redirect('/patients');
  }
};

exports.OUTCOMES = OUTCOMES;
exports.FINAL_STATUSES = FINAL_STATUSES;
exports.DURATION_UNITS = DURATION_UNITS;
