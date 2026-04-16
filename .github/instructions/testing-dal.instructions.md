---
applyTo: src/dal/**/*.test.ts, src/dal/**/*.integration.test.ts
---

# DAL Testing — Unit & Integration

## Two Test Types for DAL

| | Unit (`*.test.ts`) | Integration (`*.integration.test.ts`) |
|---|---|---|
| DB | Mocked (prisma-mock) | Real PostgreSQL |
| Speed | ~1000× faster | Slower |
| Parallelism | `fileParallelism: true` | `fileParallelism: false` (sequential) |
| Command | `npm run test:dal:unit` | `npm run test:dal:integration` |
| Config | `vitest.dal-unit.config.ts` | `vitest.dal-integration.config.ts` |
| Setup file | `vitest/setup-dal-unit.ts` | `vitest/setup-dal-integration.ts` |

## When to Write Which

**Integration tests are the default.** Every DAL function should have an integration test that verifies actual DB behaviour.

**Unit tests** (`*.test.ts`) — only when the function contains significant internal logic NOT primarily driven by a DB call:
- Complex data transformations or business rules computed in-process (e.g., password hashing algorithm, random token generation)
- Error handling that can be triggered without a real DB (e.g., bcrypt throws)
- Do NOT write unit tests for things that are just "call Prisma and return" — test those with integration tests instead

**Integration tests** (`*.integration.test.ts`) — always required:
- Actual Prisma query behaviour (joins, relations, nested writes)
- DB constraints and transactions
- Organisation scoping — confirm other org's data is not returned
- Soft-delete filtering
- Success + error paths (e.g. duplicate key, role rejection, cross-org rejection)
- Simple CRUD with no internal logic needs integration tests only

**Example split** (`adminTriggerPasswordReset`):
- Unit: bcrypt called with 12 rounds; temp password format matches regex
- Integration: user record updated correctly; sessions invalidated; refresh tokens revoked; cross-org and role rejection

## Bug Fix Tests
Every bug fix MUST include a new test case that:
- Would have caught the bug before the fix (i.e., fails on the original code)
- Passes after the fix
- Is named to describe the bug scenario, e.g. `should not return deleted items when recdelete filter is missing`

## Unit Test Setup
Prisma and iron-session are auto-mocked by `vitest/setup-dal-unit.ts`.
The typed mock is exported under the `@test-utils/prisma-mock` alias:

```typescript
import { prismaMock } from '@test-utils/prisma-mock';

const mockFindUnique = prismaMock.uniform.findUnique;

test('returns uniform by id', async () => {
    mockFindUnique.mockResolvedValue({ id: 'abc', number: 1 });

    const result = await getUniformItem({ uniformId: 'abc' });

    expect(result?.id).toBe('abc');
    expect(mockFindUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ id: 'abc' }),
    }));
});
```

Use `afterEach(() => vi.clearAllMocks())` to reset call counts between tests.

## Integration Test Setup
Use the `StaticData` system (see `database.instructions.md` for full details).
```typescript
import { StaticData } from 'tests/_playwrightConfig/testData/staticDataLoader';

const staticData = new StaticData(0);

beforeAll(async () => { await staticData.resetData(); });
afterAll(async () => { await staticData.cleanup.removeOrganisation(); });

test('returns only own org data', async () => {
    const result = await getUniformItem({ uniformId: staticData.ids.uniformIds[0][0] });
    expect(result?.id).toBe(staticData.ids.uniformIds[0][0]);
});
```

## File Placement
Tests live alongside the function file:
```
src/dal/uniform/item/
    get.ts
    get.test.ts               # unit
    get.integration.test.ts   # integration
```

## Key Rules
- Use `vi.fn()`, `vi.mock()`, `vi.clearAllMocks()` — **never** `jest.*` equivalents
- Every integration test must call `staticData.resetData()` in `beforeAll` — never assume DB state
- Integration tests run sequentially (`fileParallelism: false`) — do NOT add parallelism
- Always assert that queries scoped to org A do NOT return records from org B (use a second `StaticData` instance with a different index)
- Session is mocked in unit and integration tests. Default role is `materialManager`, but can be overwritten via `global.__ROLE__`
- New feature: every acceptance criterion must have at least one test
- Changed requirement: update existing tests so they reflect the new expected behaviour
