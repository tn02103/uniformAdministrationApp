# DAL (Data Access Layer) — Rules & Patterns

## Core Rule
ALL database access MUST go through `src/dal/`. Never import `prisma` directly in components, pages, or route handlers. Never add new code to `src/actions/controllers/` or `src/actions/dbHandlers/` — those are deprecated.

## Directory Structure
```
src/dal/
└── <domain>/           # e.g. uniform/, cadet/, inspection/, material/, storageUnit/, auth/
    └── <subdomain>/    # optional, e.g. uniform/item/, uniform/type/
        ├── index.ts    # "use server" directive + re-exports with domain-prefixed names
        ├── get.ts
        ├── create.ts
        ├── update.ts
        ├── delete.ts
        ├── *.test.ts               # unit tests
        └── *.integration.test.ts  # integration tests
```

## Server Actions & Exports
- Every `index.ts` in `src/dal/` MUST have `"use server"` at the top
- External callers (pages, components) import ONLY from `index.ts` files
- Function files (`get.ts`, `create.ts`, etc.) do NOT need `"use server"` — they inherit it from the index barrel
- Exported names must be domain-prefixed: `getUniformItem`, `createCadet`, not just `get` or `create`

## Security: Every public DAL function MUST use a validator

### `genericSAValidator` — use for actions that receive input data
Input MUST be a single object/type validated by a Zod schema. Do not use individual primitive parameters; wrap them in an object.
```typescript
// src/zod/uniform.ts
export const getUniformItemSchema = z.object({ uniformId: z.string().uuid() });

// src/dal/uniform/item/get.ts
export const getUniformItem = (data: { uniformId: string }) =>
    genericSAValidator(
        AuthRole.user,
        data,
        getUniformItemSchema,
        { uniformId: data.uniformId }   // org-scoping validation
    ).then(([{ organisationId }, { uniformId }]) =>
        prisma.uniform.findUnique({
            where: { id: uniformId, type: { organisationId } }
        })
    );
```

### `genericSANoDataValidator` — use for actions with no input
```typescript
export const getUniformTypeList = () =>
    genericSANoDataValidator(AuthRole.user)
        .then(([user]) =>
            prisma.uniformType.findMany({
                where: { organisationId: user.organisationId, recdelete: null }
            })
        );
```

### Org-scoping validation keys
Pass an object with any of these keys to have the validator confirm the IDs belong to the caller's organisation:
```
userId, cadetId, uniformId, uniformTypeId, uniformGenerationId,
uniformSizelistId, uniformSizeId, materialId, materialGroupId,
deficiencytypeId, deficiencyId, inspectionId, storageUnitId
```
Each accepts a single string or `string[]`.

## Unsecured (internal) helpers
Used when one DAL function needs to call another to avoid double session checks.
- Naming: prefix with `__unsecured` (e.g. `__unsecuredGetUniformList`)
- Parameters: accept `organisationId: string` and optionally `client?: Prisma.TransactionClient`
- Never export from `index.ts` — internal use only
```typescript
export const __unsecuredGetUniformList = (
    organisationId: string,
    client?: Prisma.TransactionClient
) => (client ?? prisma).uniform.findMany({
    where: { type: { organisationId }, recdelete: null }
});
```

## Zod Schemas
- All schemas live in `src/zod/` (domain files: `uniform.ts`, `cadet.ts`, etc.)
- Export both the schema and its inferred type:
```typescript
export const createUniformSchema = z.object({ number: z.number(), typeId: z.string().uuid() });
export type CreateUniformInput = z.infer<typeof createUniformSchema>;
```
- Reuse the same schema on the frontend for form validation

## AuthRole values
```
User (1)      — read-only
Inspector (2) — CRUD cadets/uniforms/materials
Manager (3)   — settings, inspections
Admin (4)     — users, org config
```

## Session user object
`genericSAValidator` resolves with `[user, validatedData]` where `user` is:
```typescript
{ id, name, username, role: AuthRole, acronym, organisationId, assosiation }
```

## Transactions
Use `prisma.$transaction([...])` or the interactive transaction form for multi-step mutations. Pass the transaction client to `__unsecured` helpers.

## Checklist for every new DAL function
- [ ] Input wrapped in typed object, validated by Zod schema in `src/zod/`
- [ ] Uses `genericSAValidator` or `genericSANoDataValidator`
- [ ] Required `AuthRole` is set to the minimum needed
- [ ] All input UUIDs listed in org-scoping validation object
- [ ] All queries include `organisationId` filter
- [ ] Soft-deletable models include `recdelete: null`
- [ ] Exported via `index.ts` with domain-prefixed name
- [ ] Unit test and/or integration test written (see `.github/agent/testing-dal.md`)
