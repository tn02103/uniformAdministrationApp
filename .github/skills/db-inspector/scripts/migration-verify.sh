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

echo "== Prisma migration status =="
if command -v npx >/dev/null 2>&1; then
  npx prisma migrate status || true
else
  echo "npx not available, skipping prisma migrate status"
fi

echo "== Latest _prisma_migrations entries =="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT migration_name, started_at, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY started_at DESC
LIMIT 20;
"

echo "== Schema object counts =="
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT
  n.nspname AS schema,
  SUM(CASE WHEN c.relkind = 'r' THEN 1 ELSE 0 END) AS tables,
  SUM(CASE WHEN c.relkind = 'v' THEN 1 ELSE 0 END) AS views,
  SUM(CASE WHEN c.relkind = 'm' THEN 1 ELSE 0 END) AS matviews,
  SUM(CASE WHEN c.relkind = 'i' THEN 1 ELSE 0 END) AS indexes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
GROUP BY n.nspname
ORDER BY n.nspname;
"

echo "== Validation complete =="
echo "Run targeted SELECT checks for migrated entities if needed."
