/**
 * Let attachments live in the database instead of on local disk.
 *
 * Render (and most PaaS free tiers) give you an ephemeral filesystem: every
 * deploy or restart wipes it. Uploaded reports and discharge summaries would
 * disappear while their Attachments rows still pointed at them. Storing the
 * bytes alongside the row keeps a document and its metadata together and makes
 * the app stateless, so it can be redeployed or scaled without losing files.
 *
 * Idempotent.  Run:  node backend/sql/migrate_attachment_storage.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../config/db');

(async () => {
  try {
    const [cols] = await db.query(
      `SELECT column_name AS c, is_nullable AS n FROM information_schema.columns
        WHERE table_schema = DATABASE() AND table_name = 'Attachments'`);
    const have = new Map(cols.map(r => [r.c, r.n]));

    if (!have.has('content')) {
      // 10 MB upload cap, so LONGBLOB is ample headroom.
      await db.query('ALTER TABLE Attachments ADD COLUMN content LONGBLOB NULL');
      console.log('   + Attachments.content');
    }
    if (!have.has('storage')) {
      await db.query(
        "ALTER TABLE Attachments ADD COLUMN storage ENUM('disk','db') NOT NULL DEFAULT 'disk'");
      console.log('   + Attachments.storage');
    }
    // A DB-stored row has no file on disk, so stored_name must be optional.
    if (have.get('stored_name') === 'NO') {
      await db.query('ALTER TABLE Attachments MODIFY stored_name VARCHAR(255) NULL');
      console.log('   ~ Attachments.stored_name now nullable');
    }
    console.log('\n✅ Attachment storage ready.\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
