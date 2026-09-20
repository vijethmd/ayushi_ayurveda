/**
 * Upload handling for clinical documents.
 * Accepts the formats the intake form offers — PDF, DOCX/DOC and JPEG/PNG —
 * and nothing else. Files land in backend/uploads/ under a generated name;
 * the original name is kept in the Attachments row for display only.
 */
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// mime → canonical extension. The key set is also the accept-list.
const ALLOWED = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};
const ACCEPT_ATTR = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 4 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new Error('Only PDF, DOC/DOCX, JPEG and PNG files are accepted.'));
  },
});

/** Wraps a multer middleware so a rejected upload becomes a readable message. */
const handle = (mw) => (req, res, next) => mw(req, res, (err) => {
  if (!err) return next();
  req.uploadError = err.code === 'LIMIT_FILE_SIZE'
    ? 'That file is larger than 10 MB.'
    : err.message;
  next();
});

/** Remove a stored file, ignoring "already gone". */
const removeFile = (storedName) => {
  if (!storedName) return;
  fs.unlink(path.join(UPLOAD_DIR, storedName), () => {});
};

module.exports = { upload, handle, removeFile, UPLOAD_DIR, ALLOWED, ACCEPT_ATTR, MAX_BYTES };
