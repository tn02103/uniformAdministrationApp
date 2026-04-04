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
Every model that belongs to an organisation has an `organisationId` column (mapped to `organisation_id` in the DB).
- **New code**: use field name `organisationId`
- **Legacy**: `fk_assosiation` or `assosiationId` — both map to the same column; migrate to `organisationId` when touching a file
- **Rule**: every Prisma query MUST include `organisationId` (or reach it via a relation) in the `where` clause

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

**Warning**: Never run `prisma migrate reset` without confirming the `DATABASE_URL` shows `localhost`. This command is destructive.

## Static Test Data (seed for dev, integration tests, E2E)

### Files
- `tests/_playwrightConfig/testData/staticDataGenerator.ts` — pure data generation, typed objects with deterministic UUIDs
- `tests/_playwrightConfig/testData/staticDataLoader.ts` — loads data into DB, exposes `StaticData` class

### `StaticData` class
```typescript
const staticData = new StaticData(0); // index 0–99 → each index = separate org
await staticData.resetData();         // wipe + reload full dataset for this org
await staticData.cleanup.removeOrganisation(); // full teardown
```
`staticData.ids` exposes all known UUIDs (cadetIds, uniformIds, etc.) for use in assertions.

### When schema changes, StaticData MUST be updated
1. Add new model data to `StaticDataGenerator` with deterministic UUIDs
2. Add loader method to `StaticDataLoader`
3. Add cleanup method to `StaticDataCleanup`
4. Call new loader in `StaticDataLoader.all()`
5. Run `npx prisma db seed` to validate the seed works end-to-end
