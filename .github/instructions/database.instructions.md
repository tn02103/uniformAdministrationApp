---
description: "Use when working with Prisma schema, creating or modifying migrations, updating seed data, or changing staticDataGenerator or staticDataLoader"
---

# Database — Rules & Patterns

## Stack
- **ORM**: Prisma 7
- **DB**: PostgreSQL
- **Client**: singleton exported from `src/lib/db.ts` as `prisma`
- **Schema**: `prisma/schema.prisma`

## Multi-tenancy
Every model that belongs to an assosiation has an `fk_assosiation` column (mapped to `assosiation_id` in the DB).
- **New code**: use field name `fk_assosiation`
- **Rule**: every Prisma query MUST include `fk_assosiation` (or reach it via a relation) in the `where` clause

## Soft Delete
Models with soft delete: `Uniform`, `UniformType`, `UniformGeneration`, `Cadet`, `Material`, `MaterialGroup`.
- Field: `recdelete` (DateTime?, nullable) — null = active
- Companion: `recdeleteUser` (string?) — who deleted it
- Rule: always add `recdelete: null` to `where` clauses on these models unless explicitly querying deleted records

## Complex Prisma Types
When a query shape is reused across multiple DAL functions, define it in `src/types/`:
```typescript
// src/types/globalUniformTypes.ts
export const uniformArgs = Prisma.validator<Prisma.UniformDefaultArgs>()({
    include: { type: true, generation: true, size: true },
});
export type UniformWithDetails = Prisma.UniformGetPayload<typeof uniformArgs>;
```
Import the args constant into Prisma queries to ensure type consistency.

## Migrations

### Workflow
1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate` (updates Prisma Client types)
3. Adapt `StaticData` if new/changed models affect test data (see below)
4. Run `npx prisma migrate dev --name <name>` to create the migration
5. Verify with `npx prisma studio`
6. Run schema/migration verification with `db-inspector` skill scripts

### Naming convention
- Work-in-progress: prefix with `snapshot_`, e.g. `snapshot_add_storage_unit`
- Finalized: rename to descriptive snake_case, e.g. `add_storage_unit` (when feature is complete and PR merged)

### Commands
```bash
npx prisma migrate dev --name <name>   # Create new migration
npx prisma migrate deploy              # Apply to production
npx prisma migrate reset               # ⚠️ DESTRUCTIVE — drops and recreates DB. Verify DATABASE_URL shows localhost before confirming.
npx prisma db push                     # Push schema without migration file (prototyping only)
npx prisma db seed                     # Run seed.ts
npx prisma generate                    # Regenerate Prisma Client
npx prisma studio                      # Visual DB browser
```

## DB inspector skill scripts
Use these helpers for repeatable migration verification:

```bash
bash .github/skills/db-inspector/scripts/schema.sh
bash .github/skills/db-inspector/scripts/migration-verify.sh
bash .github/skills/db-inspector/scripts/query.sh "SELECT table_schema, table_name FROM information_schema.tables LIMIT 20"
```

`query.sh` blocks mutating SQL by design and is intended for read-only diagnostics.

## Hybrid verification guidance
Prisma checks are required but not always sufficient. For migrations involving views, indexes, functions, or cross-schema effects, combine:
1. Prisma/DAL checks for app-level correctness
2. SQL/catalog checks via `db-inspector` scripts for structural correctness

**Warning**: Never run `prisma migrate reset` without confirming the `DATABASE_URL` shows `localhost`. This command is destructive.

## Static Test Data (seed for dev, integration tests, E2E)

### Files
- `tests/_playwrightConfig/testData/staticDataGenerator.ts` — pure data generation, typed objects with deterministic UUIDs
- `tests/_playwrightConfig/testData/staticDataLoader.ts` — loads data into DB, exposes `StaticData` class

### `StaticData` class
```typescript
const staticData = new StaticData(0); // index 0–99 → each index = separate org
await staticData.resetData();         // wipe + reload full dataset for this org
await staticData.cleanup.removeassosiation(); // full teardown
```
`staticData.ids` exposes all known UUIDs (cadetIds, uniformIds, etc.) for use in assertions.

### When schema changes, StaticData MUST be updated
1. Add new model data to `StaticDataGenerator` with deterministic UUIDs
2. Add loader method to `StaticDataLoader`
3. Add cleanup method to `StaticDataCleanup`
4. Call new loader in `StaticDataLoader.all()`
5. Run `npx prisma db seed` to validate the seed works end-to-end
