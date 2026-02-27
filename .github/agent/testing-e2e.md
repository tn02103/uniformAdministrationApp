# E2E Testing — Playwright

## Setup
- **Config**: `playwright.config.ts`
- **Command**: `npm run test:e2e`
- **Location**: `tests/e2e/`
- **Prerequisite**: production build (`npm run build`) must exist before running

## Worker Isolation
Each Playwright worker gets its own organisation in the database via `StaticData`. Workers run in parallel without interfering with each other because every organisation's data is fully isolated.

## StaticData in E2E
Each worker is assigned an index (0–N). The worker's `StaticData` instance manages setup/teardown for that org:
```typescript
// In a fixture or test setup
const staticData = new StaticData(workerIndex);
await staticData.resetData();

// After all tests in the worker
await staticData.cleanup.removeOrganisation();
```
Access known IDs through `staticData.ids` for reliable selectors and assertions.

## Test Data Location
```
tests/_playwrightConfig/testData/
    staticDataGenerator.ts   — generates typed objects with deterministic UUIDs
    staticDataLoader.ts      — StaticData, StaticDataLoader, StaticDataCleanup classes
```

## What to Test
- Full user workflows (login → perform action → verify outcome)
- Role-based access (confirm lower-role users cannot access restricted pages/actions)
- Organisation isolation (one org cannot see another's data)
- Critical happy paths for each domain (cadet management, uniform issuance, inspection)

## What NOT to Test
- Unit-level logic (use DAL unit tests)
- Pure UI rendering (use component tests)

## Login Helper
Use the shared auth fixture/helper so every test starts with an authenticated session at the required role level. Avoid repeating login steps inline.

## Key Rules
- Never hardcode UUIDs or organisation-specific data in E2E tests — always derive from `staticData.ids`
- Reset only the data slice you need when possible (e.g. `staticData.cleanup.cadet()`) rather than full `resetData()` for performance
- E2E tests verify behaviour from the user's perspective; avoid asserting on internal implementation (DB state directly) unless validating side effects that have no UI representation
- Keep test files in `tests/e2e/` organised by domain/page, one file per major workflow
