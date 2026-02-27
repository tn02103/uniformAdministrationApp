# DAL Testing — Unit & Integration

## Two Test Types for DAL

| | Unit (`*.test.ts`) | Integration (`*.integration.test.ts`) |
|---|---|---|
| DB | Mocked (jest.mock) | Real PostgreSQL |
| Speed | ~1000× faster | Slower |
| Parallelism | 50% max workers | maxWorkers: 1 (sequential) |
| Command | `npm run test:dal:unit` | `npm run test:dal:integration` |
| Config | `jest.dal-unit.config.ts` | `jest.dal-integration.config.ts` |
| Setup file | `jest/setup-dal-unit.ts` | `jest/setup-dal-integration.ts` |

## When to Write Which

**Unit tests** (`*.test.ts`):
- Business logic, conditional branches, data transformations
- Error handling paths
- Any logic that doesn't purely delegate to a Prisma call
- Mock Prisma responses to control inputs/outputs

**Integration tests** (`*.integration.test.ts`):
- Actual Prisma query behaviour (joins, relations, nested writes)
- DB constraints and transactions
- Organisation scoping — confirm other org's data is not returned
- Soft-delete filtering
- Simple CRUD with no logic may only need integration tests

## Unit Test Setup
Prisma and iron-session are auto-mocked by `jest/setup-dal-unit.ts`.
```typescript
import { prisma } from '@/lib/db';
jest.mock('@/lib/db'); // already done in setup; just cast for type hints

(prisma.uniform.findUnique as jest.Mock).mockResolvedValue({ id: '...', ... });
```

## Integration Test Setup
Use the `StaticData` system (see `.github/agent/database.md` for full details).
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
- Every integration test must call `staticData.resetData()` in `beforeAll` — never assume DB state
- Integration tests run sequentially (`maxWorkers: 1`) — do NOT add parallelism
- Always assert that queries scoped to org A do NOT return records from org B (use a second `StaticData` instance with a different index)
- Session is mocked in unit tests; in integration tests, validators are bypassed via the `__unsecured` helpers or by calling Prisma directly
