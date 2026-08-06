#!/usr/bin/env bash
set -euo pipefail

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

echo "== Schemas =="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name;
"

echo "== Tables by schema =="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
"

echo "== Views by schema =="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name;
"
