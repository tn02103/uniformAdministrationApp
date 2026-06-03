---
name: db-inspector
description: "Inspect PostgreSQL schemas and verify migration outcomes safely for this multi-tenant app. Use when checking schema objects, validating migration effects, or running read-only DB diagnostics."
user-invocable: true
---

# DB Inspector

Use this skill for database structure and migration verification in this repository.

## Scope
- Read-first diagnostics for PostgreSQL
- Schema, table, view, and migration verification
- Migration sanity checks after Prisma changes

## Safety Rules
- Default to read-only checks.
- Use schema-qualified names in SQL.
- Respect multi-tenancy (`fk_assosiation`) when querying tenant data.
- Never run destructive commands from this skill.

## Environment
The scripts load `DATABASE_URL` from:
1. `.env.local` (preferred)
2. `.env`
3. Existing shell environment

## Commands
List schemas/tables/views:
```bash
bash .github/skills/db-inspector/scripts/schema.sh
```

Run read-only query (`SELECT`/`WITH` only):
```bash
bash .github/skills/db-inspector/scripts/query.sh "SELECT table_schema, table_name FROM information_schema.tables LIMIT 20"
```

Run migration verification checks:
```bash
bash .github/skills/db-inspector/scripts/migration-verify.sh
```

## Migration Validation Pattern
1. Run Prisma migration workflow (`npx prisma migrate dev ...`).
2. Run `migration-verify.sh` for catalog-level checks.
3. Run targeted Prisma/DAL checks for application-level correctness.
4. If migration included SQL features outside Prisma models (views/functions/indexes), verify them with schema/query scripts.

## Hybrid Validation Guidance
- Prisma checks are good for app behavior and data shape.
- SQL/catalog checks are required for full migration confidence (views, indexes, functions, cross-schema objects).
