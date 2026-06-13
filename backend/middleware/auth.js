const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'ayushi_fallback_secret_key_2024';

// API middleware - accepts a Bearer token OR the ayushi_token cookie (the web UI
// calls these endpoints with the session cookie via fetch credentials:'include').
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  const token = (header && header.startsWith('Bearer ')) ? header.split(' ')[1]
              : (req.cookies?.ayushi_token || req.session?.token);
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Web middleware - checks cookie/session token, redirects to login if missing
const requireLogin = (req, res, next) => {
  const token = req.cookies?.ayushi_token || req.session?.token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    res.locals.user = req.user; // available in all EJS views
    next();
  } catch {
    res.clearCookie('ayushi_token');
    return res.redirect('/login');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.redirect('/dashboard');
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  next();
};

module.exports = { authenticate, requireLogin, requireAdmin, authorizeAdmin };
