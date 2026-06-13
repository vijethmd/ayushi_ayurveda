const path         = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express      = require('express');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const db           = require('./config/db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'ayushi_fallback_secret_key_2024';

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false, cookie: { maxAge: 7*24*60*60*1000 } }));
app.use(require('cors')({ origin: '*' }));

// ── Auth helpers ───────────────────────────────────────────────────────────────
const requireLogin = async (req, res, next) => {
  const token = req.cookies?.ayushi_token;
  if (!token) return res.redirect('/login');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    res.locals.user = req.user;
    // Pending doctor join requests count (for admin sidebar badge)
    res.locals.pendingRequests = 0;
    if (req.user.role === 'admin') {
      try {
        const [r] = await db.query("SELECT COUNT(*) as c FROM Doctor_Requests WHERE status='pending'");
        res.locals.pendingRequests = r[0].c;
      } catch { /* table may not exist yet */ }
    }
    next();
  } catch { res.clearCookie('ayushi_token'); return res.redirect('/login'); }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.redirect('/dashboard');
  next();
};

// helper: generate a readable temporary password e.g. "Ayush-7k3q9"
const generatePassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'Ayushi-' + s;
};

// helper: get unread count for topbar
const getUnread = async (userId) => {
  try {
    const [r] = await db.query('SELECT COUNT(*) as c FROM Notifications WHERE user_id=? AND is_read=0', [userId]);
    return r[0].c;
  } catch { return 0; }
};

// ════════════════════════════════════════════════════════════════════════════════
// WEB ROUTES (EJS pages)
// ════════════════════════════════════════════════════════════════════════════════

// ── Auth pages ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/login'));

app.get('/login', (req, res) => {
  const token = req.cookies?.ayushi_token;
  if (token) { try { jwt.verify(token, JWT_SECRET); return res.redirect('/dashboard'); } catch {} }
  res.render('pages/login', { activeTab: 'signin', otpStep: false, error: req.query.error || null, success: req.query.success || null, prefillEmail: '' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE email=? AND is_active=1', [email.trim().toLowerCase()]);
    if (!rows.length) return res.redirect('/login?error=No+account+found+with+this+email');
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.redirect('/login?error=Incorrect+password');
    if (!user.is_verified) {
      await db.query('UPDATE Users SET is_verified=1 WHERE user_id=?', [user.user_id]);
    }
    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('ayushi_token', token, { httpOnly: true, maxAge: 7*24*60*60*1000 });
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err.message);
    res.redirect('/login?error=' + encodeURIComponent(err.message));
  }
});

// ── Doctor "Request to Join" (replaces self-registration) ──────────────────────
// A doctor submits name + email + phone + specialization + description.
// The request lands in the admin's "Join Requests" page for approval.
app.post('/request-join', async (req, res) => {
  const { name, email, phone, specialization, description } = req.body;
  const renderSignup = (opts) => res.render('pages/login', Object.assign(
    { activeTab:'signup', otpStep:false, error:null, success:null, prefillEmail:'' }, opts
  ));
  try {
    if (!name || !email || !description) {
      return renderSignup({ error: 'Name, email and a short description are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Already an active user?
    const [ex] = await db.query('SELECT user_id FROM Users WHERE email=?', [cleanEmail]);
    if (ex.length) return renderSignup({ error: 'This email already has an account. Please sign in instead.' });

    // Already a pending request?
    const [pend] = await db.query("SELECT request_id FROM Doctor_Requests WHERE email=? AND status='pending'", [cleanEmail]);
    if (pend.length) return renderSignup({ error: 'A request with this email is already pending review.' });

    await db.query(
      'INSERT INTO Doctor_Requests (name, email, phone, specialization, description) VALUES (?,?,?,?,?)',
      [name.trim(), cleanEmail, phone || null, specialization || null, description.trim()]
    );

    // Notify all admins in-app
    try {
      const [admins] = await db.query("SELECT user_id FROM Users WHERE role='admin' AND is_active=1");
      for (const a of admins) {
        await db.query(
          'INSERT INTO Notifications (user_id, title, message, type) VALUES (?,?,?,?)',
          [a.user_id, 'New Doctor Join Request', `${name.trim()} (${cleanEmail}) has requested to join.`, 'info']
        );
      }
    } catch {}

    // Confirmation email to the doctor (best-effort, non-blocking)
    try {
      const { isEmailConfigured, sendRequestReceivedEmail } = require('./utils/mailer');
      if (isEmailConfigured()) await sendRequestReceivedEmail(cleanEmail, name.trim());
    } catch (e) { console.log('Request-received email skipped:', e.message); }

    return renderSignup({
      success: 'Your request to join has been submitted! An administrator will review it and email you your login credentials once approved.'
    });
  } catch (err) {
    console.error('Request-join error:', err.message);
    return renderSignup({ error: 'Could not submit your request: ' + err.message });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('ayushi_token');
  res.redirect('/login?success=Logged+out+successfully');
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const { getDashboardStats } = require('./controllers/dashboardController');
    const fakeRes = { json: (d) => d };
    const data = await new Promise(resolve => {
      const r = { json: resolve, status: () => ({ json: resolve }) };
      getDashboardStats(req, r);
    });
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/dashboard', { data, unreadCount, title:'Clinic Dashboard' });
  } catch (err) { res.render('pages/dashboard', { data:{stats:{},charts:{},upcomingFollowups:[],recentActivity:[]}, unreadCount:0, title:'Clinic Dashboard' }); }
});

app.get('/my-dashboard', requireLogin, async (req, res) => {
  try {
    const { getMyPatientStats } = require('./controllers/patientController');
    const data = await new Promise(resolve => {
      const r = { json: resolve, status: () => ({ json: resolve }) };
      getMyPatientStats(req, r);
    });
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/my-dashboard', { data, unreadCount, title:'My Dashboard' });
  } catch (err) { res.render('pages/my-dashboard', { data:{stats:{},recentPatients:[],upcomingFollowups:[],myDiseases:[]}, unreadCount:0, title:'My Dashboard' }); }
});

// ── Patients ───────────────────────────────────────────────────────────────────
app.get('/patients', requireLogin, async (req, res) => {
  try {
    const { search='', status='', my_patients='', page=1 } = req.query;
    const limit = 20; const offset = (page-1)*limit;
    let where=['p.is_active=1']; let params=[];
    if (search) { where.push('(p.name LIKE ? OR p.patient_code LIKE ? OR p.phone LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (status) { where.push('t.status=?'); params.push(status); }
    if (my_patients==='true') { where.push('t.doctor_id=?'); params.push(req.user.userId); }
    const wc = `WHERE ${where.join(' AND ')}`;
    const [patients] = await db.query(`SELECT DISTINCT p.*,t.status as treatment_status,t.improvement_percentage,d.disease_name,u.name as doctor_name,t.doctor_id FROM Patients p LEFT JOIN Treatments t ON p.patient_id=t.patient_id LEFT JOIN Diseases d ON t.disease_id=d.disease_id LEFT JOIN Users u ON t.doctor_id=u.user_id ${wc} ORDER BY p.registration_date DESC LIMIT ? OFFSET ?`, [...params,limit,parseInt(offset)]);
    const [ct] = await db.query(`SELECT COUNT(DISTINCT p.patient_id) as total FROM Patients p LEFT JOIN Treatments t ON p.patient_id=t.patient_id ${wc}`, params);
    const total = ct[0].total;
    // For the "Add Patient" form: disease + doctor dropdowns (optional initial treatment)
    const [diseases] = await db.query('SELECT disease_id, disease_name, category_name FROM Diseases WHERE is_active=1 ORDER BY category_name, disease_name');
    const [doctors] = await db.query("SELECT user_id, name FROM Users WHERE role='doctor' AND is_active=1 ORDER BY name");
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/patients', { patients, total, currentPage:parseInt(page), totalPages:Math.ceil(total/limit), filters:{search,status,my_patients}, diseases, doctors, unreadCount, title:'Patients' });
  } catch (err) { console.error(err); res.render('pages/patients', { patients:[], total:0, currentPage:1, totalPages:1, filters:{}, diseases:[], doctors:[], unreadCount:0, title:'Patients' }); }
});

app.get('/patients/:id', requireLogin, async (req, res) => {
  try {
    const id = req.params.id;
    const [pts] = await db.query('SELECT * FROM Patients WHERE patient_id=? AND is_active=1', [id]);
    if (!pts.length) return res.redirect('/patients');
    const [treatments] = await db.query(`SELECT t.*,d.disease_name,d.category_name,u.name as doctor_name FROM Treatments t JOIN Diseases d ON t.disease_id=d.disease_id JOIN Users u ON t.doctor_id=u.user_id WHERE t.patient_id=? ORDER BY t.start_date DESC`, [id]);
    const [timeline] = await db.query('SELECT te.*,u.name as created_by_name FROM Timeline_Events te LEFT JOIN Users u ON te.created_by=u.user_id WHERE te.patient_id=? ORDER BY te.event_date DESC LIMIT 30', [id]);
    const [aiReports] = await db.query('SELECT * FROM AI_Reports WHERE patient_id=? ORDER BY generated_at DESC', [id]);
    // Drugs the patient is on — derived from each treatment's medicines_json
    // (Drug_Administrations is empty; medicines_json is the source of truth).
    const [drugCatalog] = await db.query('SELECT name, category FROM Drugs');
    const catByName = new Map(drugCatalog.map(d => [String(d.name).trim().toLowerCase(), d.category]));
    const parseMedsJson = (v) => { if (!v) return []; try { const p = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(p) ? p : []; } catch { return []; } };
    const drugAdministrations = [];
    for (const t of treatments) {
      for (const m of parseMedsJson(t.medicines_json)) {
        const name = typeof m === 'string' ? m : m.name;
        if (!name) continue;
        drugAdministrations.push({
          drug_name: name,
          category: (typeof m === 'object' && m.category) || catByName.get(name.trim().toLowerCase()) || '',
          dosage: (typeof m === 'object' && m.dosage) || null,
          frequency: (typeof m === 'object' && m.frequency) || null,
          disease_name: t.disease_name,
          treatment_status: t.status,
        });
      }
    }
    const [diseases] = await db.query('SELECT * FROM Diseases WHERE is_active=1 ORDER BY category_name,disease_name');
    const [doctors] = await db.query('SELECT user_id,name,specialization FROM Users WHERE role="doctor" AND is_active=1 ORDER BY name');
    const [drugs] = await db.query('SELECT drug_id,name,category FROM Drugs WHERE is_active=1 ORDER BY name');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/patient-detail', { patient:pts[0], treatments, timeline, aiReports, drugAdministrations, diseases, doctors, drugs, unreadCount, title:pts[0].name });
  } catch (err) { console.error(err); res.redirect('/patients'); }
});

// ── Treatments ─────────────────────────────────────────────────────────────────
app.get('/treatments', requireLogin, async (req, res) => {
  try {
    const { status='', page=1 } = req.query;
    const limit=20; const offset=(page-1)*limit;
    let where=[]; let params=[];
    if (status) { where.push('t.status=?'); params.push(status); }
    const wc = where.length?`WHERE ${where.join(' AND ')}`:'';
    const [treatments] = await db.query(`SELECT t.*,p.name as patient_name,p.patient_code,d.disease_name,u.name as doctor_name FROM Treatments t JOIN Patients p ON t.patient_id=p.patient_id JOIN Diseases d ON t.disease_id=d.disease_id JOIN Users u ON t.doctor_id=u.user_id ${wc} ORDER BY t.start_date DESC LIMIT ? OFFSET ?`, [...params,limit,parseInt(offset)]);
    const [ct] = await db.query(`SELECT COUNT(*) as total FROM Treatments t ${wc}`, params);
    const total = ct[0].total;
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/treatments', { treatments, total, currentPage:parseInt(page), totalPages:Math.ceil(total/limit), filters:{status}, unreadCount, title:'Treatments' });
  } catch(err) { console.error(err); res.render('pages/treatments', { treatments:[], total:0, currentPage:1, totalPages:1, filters:{}, unreadCount:0, title:'Treatments' }); }
});

// ── Follow-Ups ─────────────────────────────────────────────────────────────────
app.get('/followups', requireLogin, async (req, res) => {
  try {
    const [upcoming] = await db.query(`SELECT f.*,p.name as patient_name,p.patient_code,d.disease_name,u.name as doctor_name FROM Followups f JOIN Treatments t ON f.treatment_id=t.treatment_id JOIN Patients p ON t.patient_id=p.patient_id JOIN Diseases d ON t.disease_id=d.disease_id JOIN Users u ON t.doctor_id=u.user_id WHERE f.followup_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 7 DAY) ORDER BY f.followup_date ASC LIMIT 50`);
    const [missed] = await db.query(`SELECT f.*,p.name as patient_name,p.patient_code,d.disease_name,u.name as doctor_name FROM Followups f JOIN Treatments t ON f.treatment_id=t.treatment_id JOIN Patients p ON t.patient_id=p.patient_id JOIN Diseases d ON t.disease_id=d.disease_id JOIN Users u ON t.doctor_id=u.user_id WHERE f.followup_date < CURDATE() AND t.status='Ongoing' ORDER BY f.followup_date DESC LIMIT 50`);
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/followups', { upcoming, missed, unreadCount, title:'Follow-Ups' });
  } catch(err) { console.error(err); res.render('pages/followups', { upcoming:[], missed:[], unreadCount:0, title:'Follow-Ups' }); }
});

// ── Doctors ────────────────────────────────────────────────────────────────────
app.get('/doctors', requireLogin, requireAdmin, async (req, res) => {
  try {
    const [doctors] = await db.query(`SELECT u.*,COUNT(DISTINCT t.patient_id) as total_patients,SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured_patients,ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate FROM Users u LEFT JOIN Treatments t ON u.user_id=t.doctor_id WHERE u.role='doctor' GROUP BY u.user_id ORDER BY u.name`);
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/doctors', { doctors, unreadCount, title:'Doctors' });
  } catch(err) { console.error(err); res.render('pages/doctors', { doctors:[], unreadCount:0, title:'Doctors' }); }
});

// ── Doctor Join Requests (admin) ─────────────────────────────────────────────────
app.get('/doctor-requests', requireLogin, requireAdmin, async (req, res) => {
  try {
    const { isEmailConfigured } = require('./utils/mailer');
    const [requests] = await db.query('SELECT r.*, u.name as reviewer_name FROM Doctor_Requests r LEFT JOIN Users u ON r.reviewed_by=u.user_id ORDER BY (r.status="pending") DESC, r.created_at DESC');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/doctor-requests', {
      requests,
      emailConfigured: isEmailConfigured(),
      unreadCount,
      success: req.query.success || null,
      error: req.query.error || null,
      title: 'Join Requests'
    });
  } catch(err) {
    console.error(err);
    res.render('pages/doctor-requests', { requests:[], emailConfigured:false, unreadCount:0, success:null, error:'Could not load requests.', title:'Join Requests' });
  }
});

// Approve a request → generate password, create doctor account, email credentials.
// Email MUST send successfully, otherwise the account is rolled back.
app.post('/doctor-requests/:id/approve', requireLogin, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { isEmailConfigured, sendApprovalEmail } = require('./utils/mailer');

  if (!isEmailConfigured()) {
    return res.redirect('/doctor-requests?error=' + encodeURIComponent('Email is not configured. Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in your .env before approving.'));
  }

  try {
    const [rows] = await db.query("SELECT * FROM Doctor_Requests WHERE request_id=? AND status='pending'", [id]);
    if (!rows.length) return res.redirect('/doctor-requests?error=Request+not+found+or+already+reviewed');
    const reqRow = rows[0];

    // Guard: email might have been registered in the meantime
    const [ex] = await db.query('SELECT user_id FROM Users WHERE email=?', [reqRow.email]);
    if (ex.length) return res.redirect('/doctor-requests?error=' + encodeURIComponent('An account with this email already exists.'));

    // Generate a readable temporary password
    const tempPassword = generatePassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    // Create the doctor account (active + verified)
    const [ins] = await db.query(
      'INSERT INTO Users (name,email,phone,password_hash,role,specialization,is_verified,is_active) VALUES (?,?,?,?,?,?,1,1)',
      [reqRow.name, reqRow.email, reqRow.phone || null, hash, 'doctor', reqRow.specialization || null]
    );

    // Send credentials email — if this throws, roll back the account.
    const loginUrl = `${req.protocol}://${req.get('host')}/login`;
    try {
      await sendApprovalEmail(reqRow.email, reqRow.name, reqRow.email, tempPassword, loginUrl);
    } catch (mailErr) {
      await db.query('DELETE FROM Users WHERE user_id=?', [ins.insertId]);
      console.error('Approval email failed:', mailErr.message);
      return res.redirect('/doctor-requests?error=' + encodeURIComponent('Could not send the approval email — account not created. Check email settings. (' + mailErr.message + ')'));
    }

    // Mark request approved
    await db.query("UPDATE Doctor_Requests SET status='approved', reviewed_by=?, reviewed_at=NOW() WHERE request_id=?", [req.user.userId, id]);

    res.redirect('/doctor-requests?success=' + encodeURIComponent(`${reqRow.name} approved. Login credentials emailed to ${reqRow.email}.`));
  } catch(err) {
    console.error('Approve error:', err.message);
    res.redirect('/doctor-requests?error=' + encodeURIComponent('Approval failed: ' + err.message));
  }
});

// Reject a request (optionally with a note emailed to the doctor).
app.post('/doctor-requests/:id/reject', requireLogin, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const { note } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM Doctor_Requests WHERE request_id=? AND status='pending'", [id]);
    if (!rows.length) return res.redirect('/doctor-requests?error=Request+not+found+or+already+reviewed');
    const reqRow = rows[0];

    await db.query("UPDATE Doctor_Requests SET status='rejected', review_note=?, reviewed_by=?, reviewed_at=NOW() WHERE request_id=?", [note || null, req.user.userId, id]);

    try {
      const { isEmailConfigured, sendRejectionEmail } = require('./utils/mailer');
      if (isEmailConfigured()) await sendRejectionEmail(reqRow.email, reqRow.name, note);
    } catch (e) { console.log('Rejection email skipped:', e.message); }

    res.redirect('/doctor-requests?success=Request+rejected.');
  } catch(err) {
    console.error('Reject error:', err.message);
    res.redirect('/doctor-requests?error=' + encodeURIComponent('Reject failed: ' + err.message));
  }
});

// ── Diseases ───────────────────────────────────────────────────────────────────
app.get('/diseases', requireLogin, async (req, res) => {
  try {
    const { search='' } = req.query;
    let q='SELECT * FROM Diseases'; let p=[];
    if (search) { q+=' WHERE disease_name LIKE ? OR category_name LIKE ?'; p=[`%${search}%`,`%${search}%`]; }
    q+=' ORDER BY category_name,disease_name';
    const [diseases] = await db.query(q,p);
    const [cats] = await db.query('SELECT DISTINCT category_name FROM Diseases WHERE is_active=1 ORDER BY category_name');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/diseases', { diseases, categories:cats, filters:{search}, unreadCount, title:'Diseases' });
  } catch(err) { console.error(err); res.render('pages/diseases', { diseases:[], categories:[], filters:{}, unreadCount:0, title:'Diseases' }); }
});

// ── Disease Intelligence ───────────────────────────────────────────────────────
app.get('/disease-intelligence', requireLogin, async (req, res) => {
  try {
    const { search='' } = req.query;
    const [diseases] = await db.query(`SELECT d.disease_id,d.disease_name,d.category_name,COUNT(DISTINCT t.patient_id) as total_patients,SUM(CASE WHEN t.status='Ongoing' THEN 1 ELSE 0 END) as active_patients,SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured_patients,SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END) as left_patients,ROUND(SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(t.treatment_id),0),1) as cure_rate FROM Diseases d LEFT JOIN Treatments t ON d.disease_id=t.disease_id WHERE d.is_active=1 ${search?'AND (d.disease_name LIKE ? OR d.category_name LIKE ?)':''} GROUP BY d.disease_id HAVING total_patients>0 ORDER BY total_patients DESC`, search?[`%${search}%`,`%${search}%`]:[]);
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/disease-intelligence', { diseases, filters:{search}, unreadCount, title:'Disease Intelligence' });
  } catch(err) { console.error(err); res.render('pages/disease-intelligence', { diseases:[], filters:{}, unreadCount:0, title:'Disease Intelligence' }); }
});

app.get('/disease-intelligence/:id', requireLogin, async (req, res) => {
  try {
    const id = req.params.id;
    const [dis] = await db.query('SELECT * FROM Diseases WHERE disease_id=?',[id]);
    if (!dis.length) return res.redirect('/disease-intelligence');
    const [st] = await db.query(`SELECT COUNT(*) as total,SUM(CASE WHEN status='Ongoing' THEN 1 ELSE 0 END) as active,SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END) as cured,SUM(CASE WHEN status='Left Treatment' THEN 1 ELSE 0 END) as left_treatment,SUM(CASE WHEN status='Improved' THEN 1 ELSE 0 END) as improved,ROUND(SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1) as cure_rate,ROUND(AVG(improvement_percentage),1) as avg_improvement FROM Treatments WHERE disease_id=?`,[id]);
    const [patients] = await db.query(`
      SELECT p.patient_id,p.patient_code,p.name as patient_name,t.treatment_id,t.status,t.improvement_percentage,
             t.start_date,t.end_date,t.medicines_json,t.lifestyle_json,t.diet_json,u.name as doctor_name,
             COALESCE(ds.drugs_summary,'') as drugs_summary,
             ds.drug_count,
             ds.avg_drug_efficacy,
             ds.side_effects
      FROM Treatments t
      JOIN Patients p ON t.patient_id=p.patient_id
      JOIN Users u ON t.doctor_id=u.user_id
      LEFT JOIN (
        SELECT da.treatment_id,
               COUNT(DISTINCT da.admin_id) as drug_count,
               ROUND(AVG(do2.efficacy_score),1) as avg_drug_efficacy,
               GROUP_CONCAT(DISTINCT CONCAT(
                 dr.name,
                 COALESCE(CONCAT(' ', NULLIF(da.dosage,'')), ''),
                 COALESCE(CONCAT(' ', NULLIF(da.frequency,'')), '')
               ) SEPARATOR '; ') as drugs_summary,
               GROUP_CONCAT(DISTINCT NULLIF(do2.side_effects,'') SEPARATOR '; ') as side_effects
        FROM Drug_Administrations da
        JOIN Drugs dr ON da.drug_id=dr.drug_id
        LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
        GROUP BY da.treatment_id
      ) ds ON t.treatment_id=ds.treatment_id
      WHERE t.disease_id=?
      ORDER BY t.start_date DESC
      LIMIT 100
    `,[id]);
    const [drugSummary] = await db.query(`
      SELECT dr.name as drug_name, dr.category,
             COUNT(DISTINCT da.admin_id) as administrations,
             COUNT(DISTINCT t.patient_id) as patients,
             ROUND(AVG(do2.efficacy_score),1) as avg_efficacy,
             ROUND(AVG(t.improvement_percentage),1) as avg_improvement,
             SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured_cases
      FROM Drug_Administrations da
      JOIN Drugs dr ON da.drug_id=dr.drug_id
      JOIN Treatments t ON da.treatment_id=t.treatment_id
      LEFT JOIN Drug_Outcomes do2 ON da.admin_id=do2.admin_id
      WHERE t.disease_id=?
      GROUP BY dr.drug_id
      ORDER BY avg_efficacy DESC, administrations DESC
      LIMIT 8
    `,[id]);
    const [monthlyTrend] = await db.query(`SELECT DATE_FORMAT(start_date,'%Y-%m') as month,COUNT(*) as registrations,SUM(CASE WHEN status='Cured' THEN 1 ELSE 0 END) as cured FROM Treatments WHERE disease_id=? GROUP BY month ORDER BY month DESC LIMIT 12`,[id]);
    // Deterministic efficacy engine — real drug ranking (cohort lift + confidence),
    // derived from medicines_json since Drug_Administrations may be empty.
    let evidence = null;
    try { const { buildDiseaseEvidence } = require('./utils/efficacyEngine'); evidence = await buildDiseaseEvidence(id); } catch (e) { console.error('engine error:', e.message); }
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/disease-detail', { disease:dis[0], stats:st[0], patients, drugSummary, monthlyTrend, evidence, unreadCount, title:dis[0].disease_name });
  } catch(err) { console.error(err); res.redirect('/disease-intelligence'); }
});

// ── Drug Research ──────────────────────────────────────────────────────────────
app.get('/drug-research', requireLogin, async (req, res) => {
  try {
    const { search='', category='' } = req.query;
    // Usage/cure-rate derived from medicines_json (Drug_Administrations is empty)
    const { listDrugUsage } = require('./utils/drugResearch');
    const drugs = await listDrugUsage({ search, category });
    const [cats] = await db.query('SELECT DISTINCT category,COUNT(*) as count FROM Drugs WHERE is_active=1 GROUP BY category ORDER BY count DESC');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/drug-research', { drugs, categories:cats, filters:{search,category}, unreadCount, title:'Drug Research' });
  } catch(err) { console.error(err); res.render('pages/drug-research', { drugs:[], categories:[], filters:{}, unreadCount:0, title:'Drug Research' }); }
});

app.get('/drug-research/:id', requireLogin, async (req, res) => {
  try {
    // Usage/cure-rate derived from medicines_json (Drug_Administrations is empty)
    const { drugDetail } = require('./utils/drugResearch');
    const detail = await drugDetail(req.params.id);
    if (!detail) return res.redirect('/drug-research');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/drug-detail', {
      drug: detail.drug,
      diseaseBreakdown: detail.diseaseBreakdown,
      outcomesTrend: detail.outcomesTrend,
      administrations: detail.administrations,
      unreadCount, title: detail.drug.name
    });
  } catch(err) { console.error(err); res.redirect('/drug-research'); }
});

// ── Analytics ──────────────────────────────────────────────────────────────────
app.get('/analytics', requireLogin, async (req, res) => {
  try {
    const [categoryStats] = await db.query(`SELECT d.category_name,COUNT(t.treatment_id) as total,SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured,SUM(CASE WHEN t.status='Left Treatment' THEN 1 ELSE 0 END) as dropout FROM Diseases d JOIN Treatments t ON d.disease_id=t.disease_id GROUP BY d.category_name ORDER BY total DESC`);
    const [ageGroup] = await db.query(`SELECT CASE WHEN p.age<18 THEN 'Under 18' WHEN p.age BETWEEN 18 AND 30 THEN '18-30' WHEN p.age BETWEEN 31 AND 45 THEN '31-45' WHEN p.age BETWEEN 46 AND 60 THEN '46-60' ELSE 'Above 60' END as age_group,COUNT(*) as count FROM Patients p WHERE p.is_active=1 GROUP BY age_group ORDER BY count DESC`);
    const [genderDist] = await db.query('SELECT gender,COUNT(*) as count FROM Patients WHERE is_active=1 GROUP BY gender');
    const [yearlyGrowth] = await db.query(`SELECT YEAR(p.registration_date) as year,COUNT(DISTINCT p.patient_id) as patients,SUM(CASE WHEN t.status='Cured' THEN 1 ELSE 0 END) as cured FROM Patients p LEFT JOIN Treatments t ON p.patient_id=t.patient_id WHERE p.is_active=1 GROUP BY year ORDER BY year`);
    const [dropoutAnalysis] = await db.query(`SELECT FLOOR(DATEDIFF(end_date,start_date)/30) as month_number,COUNT(*) as dropouts FROM Treatments WHERE status='Left Treatment' AND end_date IS NOT NULL GROUP BY month_number ORDER BY month_number LIMIT 12`);
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/analytics', { categoryStats, ageGroup, genderDist, yearlyGrowth, dropoutAnalysis, unreadCount, title:'Analytics' });
  } catch(err) { console.error(err); res.render('pages/analytics', { categoryStats:[], ageGroup:[], genderDist:[], yearlyGrowth:[], dropoutAnalysis:[], unreadCount:0, title:'Analytics' }); }
});

// ── AI Insights ────────────────────────────────────────────────────────────────
app.get('/ai-insights', requireLogin, async (req, res) => {
  try {
    const [reports] = await db.query(`SELECT r.*,u.name as generated_by_name FROM AI_Reports r LEFT JOIN Users u ON r.generated_by=u.user_id WHERE r.patient_id IS NULL ORDER BY r.generated_at DESC LIMIT 30`);
    const [doctors] = await db.query('SELECT user_id,name,specialization FROM Users WHERE role="doctor" AND is_active=1 ORDER BY name');
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/ai-insights', { reports, doctors, unreadCount, title:'AI Insights' });
  } catch(err) { console.error(err); res.render('pages/ai-insights', { reports:[], doctors:[], unreadCount:0, title:'AI Insights' }); }
});

// ── Timeline ───────────────────────────────────────────────────────────────────
app.get('/timeline/:patientId', requireLogin, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { search='', event_type='', page=1 } = req.query;
    const limit=30; const offset=(page-1)*limit;
    const [pts] = await db.query('SELECT * FROM Patients WHERE patient_id=?',[patientId]);
    if (!pts.length) return res.redirect('/patients');
    let where=['te.patient_id=?']; let params=[patientId];
    if (event_type) { where.push('te.event_type=?'); params.push(event_type); }
    if (search) { where.push('(te.event_title LIKE ? OR te.event_description LIKE ?)'); params.push(`%${search}%`,`%${search}%`); }
    const wc=`WHERE ${where.join(' AND ')}`;
    const [events] = await db.query(`SELECT te.*,u.name as created_by_name FROM Timeline_Events te LEFT JOIN Users u ON te.created_by=u.user_id ${wc} ORDER BY te.event_date DESC LIMIT ? OFFSET ?`, [...params,limit,parseInt(offset)]);
    const [ct] = await db.query(`SELECT COUNT(*) as total FROM Timeline_Events te ${wc}`, params);
    const total = ct[0].total;
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/timeline', { patient:pts[0], events, total, currentPage:parseInt(page), totalPages:Math.ceil(total/limit), filters:{search,event_type}, unreadCount, title:pts[0].name+' — Timeline' });
  } catch(err) { console.error(err); res.redirect('/patients'); }
});

// ── Notifications ──────────────────────────────────────────────────────────────
app.get('/notifications', requireLogin, async (req, res) => {
  try {
    const [notifications] = await db.query('SELECT * FROM Notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',[req.user.userId]);
    const [ct] = await db.query('SELECT SUM(CASE WHEN is_read=0 THEN 1 ELSE 0 END) as unread FROM Notifications WHERE user_id=?',[req.user.userId]);
    const unread = ct[0].unread||0;
    res.render('pages/notifications', { notifications, unread, unreadCount:unread, title:'Notifications' });
  } catch(err) { console.error(err); res.render('pages/notifications', { notifications:[], unread:0, unreadCount:0, title:'Notifications' }); }
});

app.post('/notifications/read-all', requireLogin, async (req, res) => {
  await db.query('UPDATE Notifications SET is_read=1 WHERE user_id=?',[req.user.userId]);
  res.redirect('/notifications');
});

app.post('/notifications/:id/read', requireLogin, async (req, res) => {
  await db.query('UPDATE Notifications SET is_read=1 WHERE notification_id=? AND user_id=?',[req.params.id,req.user.userId]);
  res.redirect('/notifications');
});

// ── Reports ────────────────────────────────────────────────────────────────────
app.get('/reports', requireLogin, async (req, res) => {
  const unreadCount = await getUnread(req.user.userId);
  res.render('pages/reports', { unreadCount, title:'Reports' });
});

// ── Profile ────────────────────────────────────────────────────────────────────
app.get('/profile', requireLogin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE user_id=?',[req.user.userId]);
    const unreadCount = await getUnread(req.user.userId);
    res.render('pages/profile', { user:{...req.user,...rows[0]}, unreadCount, success:req.query.success||null, title:'Profile' });
  } catch(err) { res.redirect('/dashboard'); }
});

app.post('/profile', requireLogin, async (req, res) => {
  const { name, phone, qualification, specialization, experience_years } = req.body;
  try {
    await db.query('UPDATE Users SET name=?,phone=?,qualification=?,specialization=?,experience_years=? WHERE user_id=?',[name,phone,qualification,specialization,parseInt(experience_years)||0,req.user.userId]);
    res.redirect('/profile?success=Profile+updated+successfully');
  } catch(err) { res.redirect('/profile'); }
});

app.post('/profile/password', requireLogin, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  try {
    if (newPassword !== confirmPassword) return res.redirect('/profile?error=Passwords+do+not+match');
    const [rows] = await db.query('SELECT password_hash FROM Users WHERE user_id=?',[req.user.userId]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return res.redirect('/profile?error=Current+password+incorrect');
    const hash = await bcrypt.hash(newPassword,10);
    await db.query('UPDATE Users SET password_hash=? WHERE user_id=?',[hash,req.user.userId]);
    res.redirect('/profile?success=Password+changed+successfully');
  } catch(err) { res.redirect('/profile'); }
});

// ════════════════════════════════════════════════════════════════════════════════
// API ROUTES (JSON)
// ════════════════════════════════════════════════════════════════════════════════
const { authenticate, authorizeAdmin } = require('./middleware/auth');

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/doctors',       require('./routes/doctors'));
app.use('/api/patients',      require('./routes/patients'));
app.use('/api/treatments',    require('./routes/treatments'));
app.use('/api/followups',     require('./routes/followups'));
app.use('/api/diseases',      require('./routes/diseases'));
app.use('/api/drugs',         require('./routes/drugs'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/timeline',      require('./routes/timeline'));
app.use('/api/notifications', require('./routes/timeline'));
app.use('/api/reports',       require('./routes/reports'));

// Debug (dev only)
app.post('/api/debug/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT user_id,name,email,role,is_active,is_verified,password_hash FROM Users WHERE email=?',[email]);
    if (!rows.length) return res.json({ found:false, message:'No user with this email' });
    const u = rows[0];
    const match = await bcrypt.compare(password, u.password_hash);
    res.json({ found:true, is_active:u.is_active, is_verified:u.is_verified, password_match:match, role:u.role, user_id:u.user_id });
  } catch(err) { res.json({ error:err.message }); }
});

app.post('/api/debug/fix-user', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password,10);
    await db.query('UPDATE Users SET password_hash=?,is_verified=1,is_active=1 WHERE email=?',[hash,email]);
    const [rows] = await db.query('SELECT user_id,email,role,is_active,is_verified FROM Users WHERE email=?',[email]);
    res.json({ success:true, updated:rows[0] });
  } catch(err) { res.json({ error:err.message }); }
});

app.get('/api/health', (req,res) => res.json({ status:'ok', time:new Date() }));
app.use((req,res) => res.status(404).json({ success:false, message:`Route ${req.path} not found` }));
app.use((err,req,res,next) => { console.error(err.stack); res.status(500).json({ success:false, message:err.message }); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🌿 AYUSHI running → http://localhost:${PORT}`);
  console.log(`   Login → http://localhost:${PORT}/login`);
  console.log(`   Health → http://localhost:${PORT}/api/health\n`);
});
