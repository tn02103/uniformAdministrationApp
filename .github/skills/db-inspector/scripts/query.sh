#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash .github/skills/db-inspector/scripts/query.sh \"SELECT ...\"" >&2
  exit 1
fi

SQL="$1"

if [[ -f .env.local ]]; then
  set -a
  source .env.local
  set +a
fi
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set (.env.local/.env/env)." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed or not in PATH." >&2
  exit 1
fi

if ! grep -qiE '^\s*(select|with)\b' <<< "$SQL"; then
  echo "Only read-only SELECT/WITH queries are allowed by this helper." >&2
  exit 1
fi

if grep -qiE '\b(insert|update|delete|alter|drop|truncate|grant|revoke|create)\b' <<< "$SQL"; then
  echo "Potentially mutating SQL detected. Blocked by safety rule." >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "$SQL"
