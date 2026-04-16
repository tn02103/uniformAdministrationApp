# Uniform Administration App — Agent Instructions

## Purpose
Multi-tenant web application for managing uniform inventory and inspections for non-profit organizations. Each organization's data is fully isolated.

## Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
- **Database**: PostgreSQL via Prisma 6
- **Auth**: iron-session (cookie-based)
- **Validation**: Zod (shared schemas in `src/zod/`)
- **Forms**: react-hook-form + @hookform/resolvers/zod
- **UI**: Bootstrap 5
- **Testing**: Jest (unit + integration), Playwright (E2E)

## Key Directories
```
src/dal/          # Data Access Layer — ALL DB access goes here
src/actions/      # LEGACY — do not add new code here
src/app/          # Next.js App Router pages and page-specific components
src/components/   # Global reusable components
src/dataFetcher/  # SWR hooks (use* functions) — bridge between DAL and components
src/zod/          # Shared Zod schemas (used by both frontend and DAL)
src/types/        # Complex Prisma type definitions
src/lib/          # Singletons: db.ts (prisma), ironSession.ts, AuthRoles.ts
prisma/           # schema.prisma, migrations/, seed.ts
tests/            # Playwright E2E tests and shared test data
jest/             # Jest setup files
```

## Architecture Rules (always apply)

### Multi-tenancy — CRITICAL
Every database query MUST be scoped to `organisationId`. Never query without an org filter. All IDs passed from the frontend must be validated to belong to the user's organisation before use.

### Data Access
All DB access goes through `src/dal/`. See `.github/agent/dal.md`.

### Authentication & Authorization
- **Page/route access**: enforced in `src/middleware.ts` — unauthenticated requests to protected routes are redirected to `/login`; the middleware also resolves the org acronym from the session.
- **Data access**: enforced inside every DAL function via `genericSAValidator` / `genericSANoDataValidator` (role check + org scoping).
- Session managed by iron-session. User object available via `getIronSession()`. Role-based access enforced via `AuthRole` enum (1=User, 2=Inspector, 3=Manager, 4=Admin). Higher number = more permissions.

### Validation
All Zod schemas go in `src/zod/`. Reuse them in both DAL (server) and forms (client). Never define inline schemas in component files.

### Legacy Code
`src/actions/controllers/` and `src/actions/dbHandlers/` are deprecated. Migrate to `src/dal/` when touching those files. `_index.ts` export files are deprecated — use `index.ts`.

### Field Naming
- Organisation FK: prefer `organisationId` (legacy: `fk_assosiation`, `assosiationId`)
- Foreign keys: prefer `objectId` suffix (legacy: `fk_` prefix)
- Soft delete: `recdelete` (DateTime?) + `recdeleteUser` (string?)

## Public Documentation (`/docs`)

A public-facing documentation section lives at `src/app/[locale]/docs/`. It is **not** inside the `[acronym]/` layout and requires **no authentication**.

### Structure
```
src/app/[locale]/docs/
  layout.tsx                      # Docs layout with sidebar navigation (no auth)
  page.tsx                        # Übersicht & Kernkonzepte
  _components/DocsNav.tsx         # Client sidebar nav component
  cadet/page.tsx                  # Personen (Kadetten)
  uniform/
    page.tsx                      # Uniformteile
    type/page.tsx                 # Uniformtypen & Generationen
    sizes/page.tsx                # Größen & Größenlisten
  storage/page.tsx                # Lager
  material/page.tsx               # Material
  inspection/
    page.tsx                      # Kontrollen (Überblick)
    conduct/page.tsx              # Kontrolle durchführen
    deficiencies/page.tsx         # Mängel & Mängeltypen
  dashboard/page.tsx              # Dashboard & Auswertungen
  admin/
    uniform/page.tsx              # Uniform-Konfiguration
    material/page.tsx             # Material-Konfiguration
    users/page.tsx                # Benutzerverwaltung
    settings/page.tsx             # Organisationseinstellungen
```

### Keeping Docs Up-to-Date
- Documentation pages are plain TSX files. All content is written as JSX (tables, lists, paragraphs) — no MDX or external libraries required.
- When you add or change a feature that is documented above, update the corresponding page in `src/app/[locale]/docs/`.
- When you add a new major feature or object, create a new page under the appropriate sub-path and add a link to `DocsNav.tsx` and the overview `page.tsx`.
- Nav links in `DocsNav.tsx` are relative to `/docs` (e.g. `/docs/cadet`). Always prefix with `/${locale}` in rendered `<Link>` hrefs — this is already done in the component.
- All content is in **German**.

## Detailed Guidance (load when relevant)
- Database & schema: `.github/agent/database.md`
- DAL patterns & server actions: `.github/agent/dal.md`
- Frontend components & forms: `.github/agent/frontend.md`
- DAL testing (unit + integration): `.github/agent/testing-dal.md`
- Frontend/component testing: `.github/agent/testing-frontend.md`
- E2E testing (Playwright): `.github/agent/testing-e2e.md`

## Dev Commands
```bash
npm run dev              # Dev server (port 3021)
npm run build            # Production build
npm run lint             # ESLint
npm run test:dal:unit         # DAL unit tests (fast, mocked)
npm run test:dal:integration  # DAL integration tests (real DB)
npm run test:components       # Component tests
npm run test:e2e              # Playwright E2E (requires build)
```
