#!/usr/bin/env bash
# Import the AYUSHI database into a hosted MySQL server.
#
#   ./backend/sql/import_to_host.sh 'mysql://user:pass@host:3306/dbname'
#
# or, with DATABASE_URL already set in backend/.env:
#   ./backend/sql/import_to_host.sh
#
# Imports the dump, re-runs the migration scripts, then verifies.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DUMP="$ROOT/backend/sql/dump/ayushi_db.sql"
MYSQL_BIN="${MYSQL_BIN:-$(command -v mysql || echo /usr/local/mysql/bin/mysql)}"

URL="${1:-}"
if [ -z "$URL" ]; then
  URL="$(grep -E '^DATABASE_URL=' "$ROOT/backend/.env" 2>/dev/null | cut -d= -f2- || true)"
fi
[ -n "$URL" ] || { echo "No connection string. Pass one, or set DATABASE_URL in backend/.env." >&2; exit 1; }
[ -f "$DUMP" ] || { echo "Dump not found at $DUMP" >&2; exit 1; }

# Pull the pieces out of mysql://user:pass@host:port/db
eval "$(python3 - "$URL" <<'PY'
import sys, urllib.parse as u
p = u.urlparse(sys.argv[1])
q = lambda s: "'" + (s or '').replace("'", "'\\''") + "'"
print(f"H={q(p.hostname)}; PORT={p.port or 3306}; U={q(u.unquote(p.username or ''))}; "
      f"PW={q(u.unquote(p.password or ''))}; DB={q((p.path or '').lstrip('/'))}")
PY
)"

echo "  target : $U@$H:$PORT/$DB"
echo "  dump   : $(du -h "$DUMP" | cut -f1)"
echo

# Hosted providers require TLS; --ssl-mode=REQUIRED without a CA still encrypts.
MY=( "$MYSQL_BIN" --protocol=TCP -h"$H" -P"$PORT" -u"$U" -p"$PW" --ssl-mode=REQUIRED --default-character-set=utf8mb4 )

echo "→ checking connection"
"${MY[@]}" -e "SELECT VERSION() AS server;" "$DB" || {
  echo "Could not connect. Check the string, and that this machine is allowlisted." >&2; exit 1; }

echo "→ importing dump (this takes a minute over the network)"
"${MY[@]}" "$DB" < "$DUMP"

echo "→ re-running migrations"
cd "$ROOT"
DATABASE_URL="$URL" node backend/sql/seed_public_directory.js  >/dev/null
DATABASE_URL="$URL" node backend/sql/seed_materia_medica.js    >/dev/null
DATABASE_URL="$URL" node backend/sql/migrate_consultations.js  >/dev/null

echo "→ verifying"
DATABASE_URL="$URL" node backend/sql/check_db.js
