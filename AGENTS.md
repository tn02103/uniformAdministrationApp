# Uniform Administration App - Agent Instructions

## Purpose
Multi-tenant web application for managing uniform inventory and inspections for non-profit organizations. Each organization's data is fully isolated.

## Tech Stack
- Next.js 15 (App Router), React 19 - PostgreSQL via Prisma 7 - iron-session - Zod - react-hook-form - Bootstrap 5
- Testing: Vitest (unit + integration), Playwright (E2E)

## Multi-tenancy - CRITICAL
Every database query MUST be scoped to `organisationId`. Never query without an org filter. All IDs passed from the frontend must be validated to belong to the user's organisation before use - enforced via `genericSAValidator` in every DAL function.

## Key Directories
```
src/dal/          # ALL DB access goes here - never import prisma elsewhere
src/app/          # Next.js App Router pages and page-specific components
src/components/   # Global reusable components
src/dataFetcher/  # SWR hooks (use* functions)
src/zod/          # Shared Zod schemas (frontend + DAL)
src/types/        # Complex Prisma type definitions
src/lib/          # Singletons: db.ts (prisma), ironSession.ts, AuthRoles.ts
src/actions/      # LEGACY - do not add new code here
prisma/           # schema.prisma, migrations/, seed.ts
tests/            # Playwright E2E tests and shared test data
```

## Legacy Code (never create new)
- `src/actions/controllers/` and `src/actions/dbHandlers/` - deprecated, migrate to `src/dal/` when touching
- `_index.ts` export files - deprecated, use `index.ts`
- Field `fk_assosiation` / `assosiationId` - use `organisationId`; `fk_` prefix FKs - use `objectId` suffix

## Dev Commands
```bash
npm run dev                   # Dev server (port 3021)
npm run build                 # Production build
npm run lint                  # ESLint
npm run test:dal:unit         # DAL unit tests (fast, mocked)
npm run test:dal:integration  # DAL integration tests (real DB)
npm run test:components       # Component tests
npm run test:e2e              # Playwright E2E (requires build)
```

## Workflow Entry Points
Use slash commands to start any workflow:
- `/new-feature <issue-number>` - implement a new feature
- `/fix-bug <issue-number>` - fix a bug
- `/add-requirement <issue-number>` - add requirements to an existing feature branch
- `/implement-review <pr-number>` - implement PR review comments
- `/review` - standalone review of current branch changes

Coding rules auto-load from `.github/instructions/` based on which files are in context.
Agents are in `.github/agents/`. Session state is written to `.github/session/` (gitignored).
