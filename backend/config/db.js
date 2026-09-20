/**
 * MySQL connection pool.
 *
 * Works against a local server or a hosted one. Two ways to configure it:
 *
 *   1. DATABASE_URL  — mysql://user:password@host:port/database
 *      This is the single string most managed providers hand you
 *      (Railway, Aiven, Clever Cloud, PlanetScale, RDS …). It wins if set.
 *
 *   2. DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
 *      The discrete variables, used when DATABASE_URL is absent.
 *
 * TLS: hosted providers require it. Set DB_SSL=true for the provider's
 * certificate chain, or point DB_SSL_CA at a downloaded CA bundle.
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bool = (v) => /^(1|true|yes|on)$/i.test(String(v || '').trim());

// ── Resolve where we are connecting ──────────────────────────────────────────
function resolveTarget() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port) || 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      // Providers commonly append ?ssl-mode=REQUIRED / ?sslaccept=strict
      sslFromUrl: /ssl|tls/i.test(u.search),
      source: 'DATABASE_URL',
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ayushi_db',
    sslFromUrl: false,
    source: 'DB_* variables',
  };
}

const target = resolveTarget();
const isRemote = !['localhost', '127.0.0.1', '::1'].includes(target.host);

// ── TLS ──────────────────────────────────────────────────────────────────────
function resolveSsl() {
  const caPath = (process.env.DB_SSL_CA || '').trim();
  if (caPath) {
    const abs = path.isAbsolute(caPath) ? caPath : path.join(__dirname, '..', caPath);
    if (!fs.existsSync(abs)) throw new Error(`DB_SSL_CA points at a missing file: ${abs}`);
    return { ca: fs.readFileSync(abs), minVersion: 'TLSv1.2' };
  }
  if (bool(process.env.DB_SSL) || target.sslFromUrl) {
    // Verify against the system trust store; providers use public CAs.
    return { minVersion: 'TLSv1.2', rejectUnauthorized: !bool(process.env.DB_SSL_INSECURE) };
  }
  return undefined;
}

const ssl = resolveSsl();

const pool = mysql.createPool({
  host: target.host,
  port: target.port,
  user: target.user,
  password: target.password,
  database: target.database,
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  // A hosted plan caps connections — stay well under it.
  connectionLimit: Number(process.env.DB_POOL_SIZE) || (isRemote ? 8 : 10),
  queueLimit: 0,
  // Remote round-trips need more headroom than a unix socket.
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || (isRemote ? 20000 : 10000),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: '+05:30',
  dateStrings: true,
  charset: 'utf8mb4',
});

// ── Per-connection compatibility ────────────────────────────────────────────
// Hosted providers often run ANSI mode. Under ANSI_QUOTES a double-quoted
// value is an identifier, not a string, so `role="doctor"` becomes an unknown
// column; PIPES_AS_CONCAT likewise redefines ||. This app is written against
// MySQL's default interpretation, so drop just those two flags per session and
// leave every strictness flag the host sets (STRICT_*, NO_ZERO_DATE, …) alone.
const INCOMPATIBLE_MODES = ['ANSI_QUOTES', 'PIPES_AS_CONCAT'];
let modeNoted = false;

pool.on('connection', (conn) => {
  conn.query('SELECT @@sql_mode AS m', (err, rows) => {
    if (err || !rows?.length) return;
    const modes = String(rows[0].m).split(',').filter(Boolean);
    const strip = modes.filter(m => INCOMPATIBLE_MODES.includes(m));
    if (!strip.length) return;
    const kept = modes.filter(m => !INCOMPATIBLE_MODES.includes(m));
    conn.query(`SET SESSION sql_mode = ${conn.escape(kept.join(','))}`, (e) => {
      if (e || modeNoted) return;
      modeNoted = true;
      console.log(`   sql_mode: dropped ${strip.join(', ')} for this session`);
    });
  });
});

// ── Startup check, with enough detail to act on a failure ───────────────────
const describe = () =>
  `${target.user}@${target.host}:${target.port}/${target.database}` +
  `${ssl ? ' (TLS)' : ''}`;

const HINTS = {
  ER_ACCESS_DENIED_ERROR: 'Wrong username or password.',
  ER_BAD_DB_ERROR:        'That database does not exist on the server yet — create it, then import the dump.',
  ENOTFOUND:              'Host not found — check the hostname.',
  ETIMEDOUT:              'Timed out — the provider may need this machine allowlisted, or the port is closed.',
  ECONNREFUSED:           'Connection refused — is the server running and the port correct?',
  HANDSHAKE_SSL_ERROR:    'TLS handshake failed — try DB_SSL=true, or supply DB_SSL_CA.',
};

(async () => {
  try {
    const conn = await pool.getConnection();
    const [[v]] = await conn.query('SELECT VERSION() AS v');
    conn.release();
    console.log(`✅ MySQL connected — ${describe()}`);
    console.log(`   server ${v.v} · via ${target.source}${isRemote ? ' · remote' : ' · local'}`);
  } catch (err) {
    console.error(`❌ MySQL connection failed — ${describe()}`);
    console.error(`   ${err.code || ''} ${err.message}`);
    const hint = HINTS[err.code];
    if (hint) console.error(`   → ${hint}`);
  }
})();

module.exports = pool;
module.exports.target = target;
