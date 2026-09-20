/**
 * Verify the configured database — local or hosted.
 *
 *   node backend/sql/check_db.js
 *
 * Reports what it connected to, whether every table the app needs exists,
 * and the row counts, so you can confirm an import landed correctly.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

const REQUIRED = [
  'Users', 'Patients', 'Doctors_placeholder', 'Diseases', 'Drugs', 'Treatments',
  'Followups', 'Timeline_Events', 'Notifications', 'AI_Reports',
  'Drug_Administrations', 'Drug_Outcomes', 'Doctor_Requests', 'OTP_Verifications',
  'Medicine_Brands', 'Consultations', 'Attachments',
].filter(t => t !== 'Doctors_placeholder');

// Columns added by the migration scripts — a fresh import needs these too.
const REQUIRED_COLUMNS = {
  Users: ['clinic_name', 'area', 'city', 'state', 'consultation_fee', 'languages'],
  Drugs: ['generic_name', 'botanical_name', 'dosage_form', 'source_type',
          'source_subtype', 'preparation_class', 'rasa', 'virya', 'vipaka'],
  Treatments: ['final_status', 'discharge_date', 'discharge_summary'],
};

const pad = (s, n) => String(s).padEnd(n);

(async () => {
  let problems = 0;
  try {
    const [[info]] = await db.query(
      'SELECT VERSION() AS version, DATABASE() AS db, @@character_set_database AS charset');
    console.log(`\n  server   ${info.version}`);
    console.log(`  database ${info.db} (${info.charset})\n`);

    const [tables] = await db.query(
      'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()');
    const have = new Set(tables.map(r => r.t));

    console.log('  TABLE                   ROWS');
    console.log('  ' + '─'.repeat(34));
    for (const t of REQUIRED) {
      if (!have.has(t)) { console.log(`  ${pad(t, 22)} MISSING`); problems++; continue; }
      const [[c]] = await db.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
      console.log(`  ${pad(t, 22)} ${String(c.n).padStart(6)}`);
    }

    console.log('\n  MIGRATION COLUMNS');
    console.log('  ' + '─'.repeat(34));
    for (const [table, cols] of Object.entries(REQUIRED_COLUMNS)) {
      if (!have.has(table)) continue;
      const [rows] = await db.query(
        `SELECT column_name AS c FROM information_schema.columns
          WHERE table_schema = DATABASE() AND table_name = ?`, [table]);
      const present = new Set(rows.map(r => r.c));
      const missing = cols.filter(c => !present.has(c));
      if (missing.length) { console.log(`  ${pad(table, 22)} missing: ${missing.join(', ')}`); problems++; }
      else console.log(`  ${pad(table, 22)} ok`);
    }

    // A round-trip write, so we know the credentials are not read-only.
    try {
      // Needs a primary key: hosted MySQL often runs sql_require_primary_key=ON.
      await db.query('CREATE TEMPORARY TABLE _ayushi_probe (id INT PRIMARY KEY)');
      await db.query('DROP TEMPORARY TABLE _ayushi_probe');
      console.log('\n  write access          ok');
    } catch (e) {
      console.log(`\n  write access          FAILED — ${e.code || e.message}`);
      problems++;
    }

    console.log(problems
      ? `\n  ${problems} problem(s). Import the dump, then re-run the migration scripts.\n`
      : '\n  Everything the app needs is present.\n');
    process.exit(problems ? 1 : 0);
  } catch (err) {
    console.error(`\n  Could not query the database: ${err.code || ''} ${err.message}\n`);
    process.exit(1);
  }
})();
