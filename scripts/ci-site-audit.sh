#!/usr/bin/env bash
# Starts the production build, crawls it with both audits, and stops the server again (CI runs this).
# The server is started with node directly, not through npx: killing npx leaves the real server running and
# holding the port, which silently breaks whatever starts next on it.
set -u
PORT="${PORT:-3100}"
BASE="http://localhost:${PORT}"
node node_modules/next/dist/bin/next start -p "$PORT" &
server=$!
for _ in $(seq 1 30); do curl -sf "$BASE/api/health" >/dev/null && break; sleep 1; done
status=0
node scripts/audit-site.mjs "$BASE" "$BASE" || status=1
node scripts/audit-pages.mjs "$BASE" "$BASE" || status=1
kill "$server" 2>/dev/null
wait "$server" 2>/dev/null
exit "$status"
