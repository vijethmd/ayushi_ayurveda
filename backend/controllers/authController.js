const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { sendOTPEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'ayushi_fallback_secret_key_2024';
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const makeToken = (user) => jwt.sign(
  { userId: user.user_id, email: user.email, role: user.role, name: user.name },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Safely detect if extra columns exist
let _colsOk = null;
const hasExtraCols = async () => {
  if (_colsOk !== null) return _colsOk;
  try {
    const [r] = await db.query("SHOW COLUMNS FROM Users LIKE 'qualification'");
    _colsOk = r.length > 0;
  } catch { _colsOk = false; }
  return _colsOk;
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    // Fetch user — no is_active filter so we can give a clear error
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [cleanEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'No account found with this email address.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'This account has been deactivated.' });
    }

    // Compare password
    const valid = await bcrypt.compare(String(password), user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // Auto-verify if not verified (handles seeded users)
    if (!user.is_verified) {
      await db.query('UPDATE Users SET is_verified = 1 WHERE user_id = ?', [user.user_id]);
      user.is_verified = 1;
    }

    const token = makeToken(user);
    const { password_hash, ...userData } = user;

    return res.json({ success: true, token, user: userData });

  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    return res.status(500).json({ success: false, message: 'Login error: ' + err.message });
  }
};

// ── REGISTER ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { name, email, phone, password, role = 'doctor', qualification, specialization, experience_years } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const [existing] = await db.query('SELECT user_id FROM Users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'This email is already registered. Please sign in.' });
    }

    const hash  = await bcrypt.hash(String(password), 10);
    const extra = await hasExtraCols();
    let result;

    if (extra) {
      [result] = await db.query(
        'INSERT INTO Users (name,email,phone,password_hash,role,qualification,specialization,experience_years) VALUES(?,?,?,?,?,?,?,?)',
        [String(name).trim(), cleanEmail, phone || null, hash, role,
         qualification || null, specialization || null, parseInt(experience_years) || 0]
      );
    } else {
      [result] = await db.query(
        'INSERT INTO Users (name,email,phone,password_hash,role) VALUES(?,?,?,?,?)',
        [String(name).trim(), cleanEmail, phone || null, hash, role]
      );
    }

    const userId = result.insertId;
    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      'INSERT INTO OTP_Verifications(user_id,otp_code,expiry_time) VALUES(?,?,?)',
      [userId, otp, expiry]
    );

    // Try to send email — OTP never goes to frontend response
    try {
      await sendOTPEmail(cleanEmail, String(name).trim(), otp);
      console.log(`✅ OTP email sent to ${cleanEmail}`);
    } catch (mailErr) {
      // Log to server console ONLY — never send to client
      console.log(`\n📧 EMAIL NOT CONFIGURED — OTP for ${cleanEmail}: ${otp}\n`);
    }

    return res.status(201).json({
      success: true,
      message: 'Account created! Check your email for the OTP verification code.',
      userId
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
  }
};

// ── VERIFY OTP → auto-login ───────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'userId and otp are required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM OTP_Verifications WHERE user_id=? AND otp_code=? AND expiry_time>NOW() ORDER BY otp_id DESC LIMIT 1',
      [userId, String(otp).trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
    }

    await db.query('UPDATE Users SET is_verified=1 WHERE user_id=?', [userId]);
    await db.query('DELETE FROM OTP_Verifications WHERE user_id=?', [userId]);

    const [users] = await db.query('SELECT * FROM Users WHERE user_id=?', [userId]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const user  = users[0];
    const token = makeToken(user);
    const { password_hash, ...userData } = user;

    return res.json({ success: true, message: 'Email verified! Signing you in…', token, user: userData });

  } catch (err) {
    console.error('VERIFY OTP ERROR:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  const { userId } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM Users WHERE user_id=?', [userId]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const user   = users[0];
    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.query('DELETE FROM OTP_Verifications WHERE user_id=?', [userId]);
    await db.query('INSERT INTO OTP_Verifications(user_id,otp_code,expiry_time) VALUES(?,?,?)', [userId, otp, expiry]);

    try { await sendOTPEmail(user.email, user.name, otp); } catch {}
    // Log to server console only
    console.log(`\n📧 Resent OTP for ${user.email}: ${otp}\n`);

    return res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── PROFILE ───────────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id,name,email,phone,role,created_at FROM Users WHERE user_id=?',
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found.' });
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, qualification, specialization, experience_years } = req.body;
  try {
    const extra = await hasExtraCols();
    if (extra) {
      await db.query(
        'UPDATE Users SET name=?,phone=?,qualification=?,specialization=?,experience_years=? WHERE user_id=?',
        [name, phone, qualification, specialization, parseInt(experience_years) || 0, req.user.userId]
      );
    } else {
      await db.query('UPDATE Users SET name=?,phone=? WHERE user_id=?', [name, phone, req.user.userId]);
    }
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT password_hash FROM Users WHERE user_id=?', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const valid = await bcrypt.compare(String(currentPassword), rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(String(newPassword), 10);
    await db.query('UPDATE Users SET password_hash=? WHERE user_id=?', [hash, req.user.userId]);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, register, verifyOTP, resendOTP, getProfile, updateProfile, changePassword };
