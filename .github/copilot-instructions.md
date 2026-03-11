# Uniform Administration App - Development Guidelines

## Project Overview

**Purpose**: This application manages uniform items and regular inspections for smaller non-profit organizations. It provides an overview of uniform ownership, maintains historical records, tracks inventory status, and facilitates inspection workflows.

**Multi-tenancy**: The application is fully multi-tenant. Each organization has complete data isolation. All database queries must filter by `organisationId` to ensure data security.

**Tech Stack**: Next.js 15 (App Router), React 19, Prisma 6 (PostgreSQL), iron-session, react-hook-form, Zod, Bootstrap 5, Playwright, Jest

---

## Architecture & Patterns

### Data Access Layer (DAL)

**All database access MUST go through the Data Access Layer (`src/dal/`).**

#### DAL Structure
- Organized by domain: `auth/`, `cadet/`, `uniform/`, `inspection/`, `material/`, `storageUnit/`
- Each domain has function files: `create.ts`, `update.ts`, `delete.ts`, `get.ts`, etc.
- Export via `index.ts` files (NOT `_index.ts` - that's the old pattern)
- All DAL functions marked with `"use server"` directive

#### Example DAL Structure
```
src/dal/
├── uniform/
│   ├── item/
│   │   ├── index.ts          // Exports all functions with domain-prefixed names
│   │   ├── create.ts         // Creation logic
│   │   ├── get.ts            // Retrieval logic
│   │   ├── update.ts         // Update logic
│   │   ├── delete.ts         // Deletion logic
│   │   ├── create.test.ts    // Unit tests
│   │   └── get.integration.test.ts  // Integration tests
```

#### DAL Security Pattern
Every DAL function must:
1. Use `genericSAValidator`, `genericSAValidatorV2`, or `genericSANoDataValidator` from `@/actions/validations`
2. Validate user's role (AuthRole)
3. Validate input data with Zod schema
4. Validate that any IDs belong to the user's organization
5. Return typed data

```typescript
export const getUniformItem = (uniformId: string) => 
    genericSAValidator(
        AuthRole.user,
        uniformId,
        z.string().uuid(),
        { uniformId } // Organization validation
    ).then(([{ organisationId }, validatedId]) => 
        prisma.uniform.findUnique({
            where: { 
                id: validatedId,
                type: { organisationId } // Always filter by org
            }
        })
    );
```

#### Unsecured Helper Functions
- Prefix with `__unsecured` or `unsecured`
- Used for internal DAL calls to avoid redundant session checks
- Accept `organisationId` or `Prisma.TransactionClient` as parameters
- Never expose directly to frontend

```typescript
export const __unsecuredGetUniformList = (
    organisationId: string, 
    client?: Prisma.TransactionClient
) => (client ?? prisma).uniform.findMany({
    where: { type: { organisationId } }
});
```

### Deprecated Patterns

**DO NOT use `src/actions/` for new implementations.**
- `src/actions/controllers/` - DEPRECATED
- `src/actions/dbHandlers/` - DEPRECATED
- Old pattern used DBHandler classes; new pattern uses DAL functions

Existing code in `src/actions/` is legacy and should be migrated to `src/dal/` when modified.

---

## Database & Data Access

### Prisma & PostgreSQL

**Database Client**: `src/lib/db.ts` exports singleton `prisma` instance

**Multi-tenancy Field Names**:
- **Preferred**: `organisationId` (use this for new code)
- **Legacy**: `fk_assosiation` or `assosiationId` (being migrated)
- All are mapped to `organisation_id` in database

### Organization Scoping

**CRITICAL**: All queries MUST filter by organization to prevent data leaks.

```typescript
// ✅ CORRECT - Filters by organisation
await prisma.cadet.findMany({
    where: { organisationId }
});

// ❌ WRONG - Could expose other orgs' data
await prisma.cadet.findMany({});
```

### Soft Delete Pattern

Many models use soft delete via the `recdelete` field:
- Field: `recdelete` (DateTime?, nullable)
- Companion: `recdeleteUser` (string?, tracks who deleted)
- Models: `Uniform`, `UniformType`, `UniformGeneration`, `Cadet`, `Material`, `MaterialGroup`

Always filter out soft-deleted records:
```typescript
where: { 
    organisationId,
    recdelete: null  // Exclude soft-deleted
}
```

### Complex Prisma Types

When using complex Prisma types regularly, define them in `src/types/`:
- Define the TypeScript type
- Define the Prisma args used to retrieve that type
- Example: `src/types/globalUniformTypes.ts`

```typescript
export const uniformArgs = Prisma.validator<Prisma.UniformFindManyArgs>()({
    include: {
        type: true,
        generation: true,
        size: true,
    },
});

export type Uniform = Prisma.UniformGetPayload<typeof uniformArgs>;
```

---

## Authentication & Authorization

### Session Management

**Library**: iron-session (cookie-based, encrypted sessions)

**Session Data**:
```typescript
interface IronSessionData {
    user?: {
        id: string;
        name: string;
        username: string;
        role: AuthRole;
        acronym: string;
        organisationId: string;
    }
    sessionId?: string;
}
```

### Role Hierarchy

AuthRole values (higher = more permissions):
1. **User (1)**: Read-only access, can check basic information (e.g., uniform ownership lookup)
2. **Inspector (2)**: Can write basic data (CRUD cadets, uniforms, issue materials), cannot change settings
3. **Manager (3)**: Can change all uniform/material settings, manage inspections
4. **Admin (4)**: Can CRUD users, change organization settings (2FA requirements, etc.)

### Server Action Validators

**All Server Actions must use one of these validators** (`src/actions/validations.ts`):

#### genericSAValidator
For actions with data and validation:
```typescript
export const myAction = async (data: MyType) => 
    genericSAValidator(
        AuthRole.inspector,      // Required role
        data,                    // Data to validate
        myZodSchema,            // Zod schema
        { cadetId: data.id }    // Org validation
    ).then(([user, validatedData]) => {
        // user: IronSessionUser with organisationId
        // validatedData: Type-safe validated data
    });
```

#### genericSAValidatorV2
For actions with manual type validation:
```typescript
export const myAction = async (id: string) => 
    genericSAValidatorV2(
        AuthRole.user,
        uuidValidationPattern.test(id),  // Manual validation
        { uniformId: id }                // Org validation
    ).then((user) => {
        // user: IronSessionUser
    });
```

#### genericSANoDataValidator
For actions without input data:
```typescript
export const getList = async () => 
    genericSANoDataValidator(AuthRole.user)
        .then(([user]) => {
            // user: IronSessionUser
        });
```

#### Organization Validation
The validators automatically verify IDs belong to the user's organization:
```typescript
{ 
    userId?: string | string[],
    cadetId?: string | string[],
    uniformId?: string | string[],
    uniformTypeId?: string | string[],
    materialId?: string | string[],
    materialGroupId?: string | string[],
    deficiencytypeId?: string | string[],
    deficiencyId?: string | string[],
    inspectionId?: string | string[],
    storageUnitId?: string | string[],
    // ... supports single ID or array of IDs
}
```

---

## Frontend Patterns

### Component Organization

#### Global Components
**Location**: `src/components/`
- Reusable across the entire application
- Examples: `UniformOffcanvas/`, `fields/`, `reorderDnD/`, `TooltipIcon.tsx`

#### Page-Specific Components
**Location**: `src/app/[locale]/[acronym]/*/`
- Components specific to one page/route
- Organized in subfolders with **underscore prefix**: `_filterPanel/`, `_uniformTable/`, `_typeAdministration/`
- The underscore prevents Next.js from treating them as routes

```
src/app/[locale]/[acronym]/
├── cadet/
│   └── [cadetId]/
│       ├── page.tsx
│       ├── _uniformTable/           // Page-specific components
│       │   ├── CadetUniformTable.tsx
│       │   └── CadetUniformTableIssueModal.tsx
│       └── _materialTable/
│           └── CadetMaterialTable.tsx
```

### Forms & Validation

**Form Library**: react-hook-form with `@hookform/resolvers` for Zod integration

#### Custom Form Components
Located in `src/components/fields/`:
- `InputFormField.tsx` - Text/email/password inputs
- `NumberInputFormField.tsx` - Number inputs
- `SelectFormField.tsx` - Dropdowns
- `TextareaFormField.tsx` - Multi-line text
- `ToggleFormField.tsx` - Checkbox/switch
- `AutocompleteField.tsx` - Autocomplete input
- `InlineEditInputFormField.tsx` - Inline editable fields

All integrate with react-hook-form and include:
- Automatic error display with i18n
- Bootstrap styling
- Validation support via Zod

#### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputFormField } from '@/components/fields/InputFormField';

const MyForm = () => {
    const form = useForm<MyFormType>({
        resolver: zodResolver(myZodSchema),
        defaultValues: {...}
    });

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <InputFormField
                name="username"
                label="Username"
                control={form.control}
                required
            />
        </form>
    );
};
```

---

## Validation with Zod

### Zod Schema Location

**Global schemas** (used by both frontend and backend): `src/zod/`
- `auth.ts` - Authentication schemas
- `uniform.ts` - Uniform-related schemas
- `material.ts` - Material schemas
- `deficiency.ts` - Deficiency/inspection schemas
- `storage.ts` - Storage unit schemas
- `redirect.ts` - Redirect schemas
- `global.ts` - Shared/common schemas

**Principle**: Ideally ALL Zod schemas should be in `src/zod/` for reusability.

### Usage Pattern

#### Server Actions
```typescript
import { uniformCreateSchema } from '@/zod/uniform';

export const createUniform = async (data: unknown) => 
    genericSAValidator(
        AuthRole.inspector,
        data,
        uniformCreateSchema,  // Validates and types data
        { uniformTypeId: data.typeId }
    ).then(([user, validatedData]) => {
        // validatedData is now type-safe
    });
```

#### Frontend Forms
```typescript
import { uniformCreateSchema } from '@/zod/uniform';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
    resolver: zodResolver(uniformCreateSchema),
});
```

---

## Testing Strategy

### Overview

Three test types with separate Jest configurations:
1. **Component Tests** - UI component testing with React Testing Library
2. **DAL Unit Tests** - Fast tests with mocked Prisma (~1000x faster)
3. **DAL Integration Tests** - Real database tests with test data
4. **E2E Tests** - Full workflow tests with Playwright

### Jest Configuration

#### Component Tests (`jest.frontend.config.ts`)
- **Command**: `npm run test:components`
- **Environment**: jsdom (browser simulation)
- **Location**: `src/components/**/*.test.tsx`, `src/app/**/*.test.tsx`
- **Setup**: `jest/setup-components.tsx`

#### DAL Unit Tests (`jest.dal-unit.config.ts`)
- **Command**: `npm run test:dal:unit`
- **Environment**: node
- **Location**: `src/dal/**/*.test.ts` (excludes `.integration.test.ts`)
- **Setup**: `jest/setup-dal-unit.ts` (mocks Prisma, iron-session)
- **Performance**: Runs with 50% max workers (parallel execution)
- **Use**: Test business logic within DAL functions

#### DAL Integration Tests (`jest.dal-integration.config.ts`)
- **Command**: `npm run test:dal:integration`
- **Environment**: node
- **Location**: `src/dal/**/*.integration.test.ts`
- **Setup**: `jest/setup-dal-integration.ts` (real database, static test data)
- **Performance**: maxWorkers: 1 (sequential, database integrity)
- **Use**: Test actual Prisma queries and database interactions

### Testing Philosophy

#### When to Write Each Test Type

**Component Tests**:
- Test UI rendering and user interactions
- Test form validation behavior
- Test conditional rendering logic
- Mock Server Actions

**DAL Unit Tests** (Preferred for logic):
- Fast execution (~1000x faster than integration)
- Test business logic, transformations, calculations
- Test conditional logic within DAL functions
- Test error handling
- Mock Prisma responses

**DAL Integration Tests** (For database operations):
- Test actual Prisma query behavior
- Test complex joins and relations
- Test transaction behavior
- Test database constraints
- Verify organization scoping works correctly

**Ideal Strategy**: 
- Unit test all logic within DAL functions
- Integration test the Prisma function calls and database interactions
- Simple CRUD functions with no business logic may only need integration tests

### Test Data (Static Data System)

For integration and E2E tests, use `StaticData` system:

**Location**: `tests/_playwrightConfig/testData/`
- `staticDataGenerator.ts` - Generates test data with known IDs
- `staticDataLoader.ts` - Loads data into database (contains `StaticDataLoader` class)

**Usage in Integration Tests**:
```typescript
import { StaticData } from '../tests/_playwrightConfig/testData/staticDataLoader';

const staticData = new StaticData(0); // Organization index 0-99

beforeAll(async () => {
    await staticData.resetData(); // Loads full dataset
});

afterAll(async () => {
    await staticData.cleanup.removeOrganisation();
});

test('my test', async () => {
    const cadetId = staticData.ids.cadetIds[0];
    // Use known IDs from static data
});
```

**Playwright Workers**: Each Playwright worker gets its own complete dataset (organization) for parallel execution without conflicts.

### E2E Tests (Playwright)

**Location**: `tests/e2e/`
**Command**: `npm run test:e2e`
**Setup**: Requires production build (`npm run build`)

Each worker has:
- Separate organization in database (via `StaticData`)
- Isolated test environment
- Full application context

---

## Naming Conventions

### File Naming

**Components**:
- PascalCase: `UniformOffcanvas.tsx`, `CadetUniformTable.tsx`
- Test files: `ComponentName.test.tsx`

**DAL/Actions**:
- camelCase: `create.ts`, `update.ts`, `get.ts`
- Unit tests: `create.test.ts`
- Integration tests: `get.integration.test.ts`

**Exports**:
- Use `index.ts` (not `_index.ts`) for new code
- `_index.ts` is deprecated pattern

**Page-Specific Component Folders**:
- Always use underscore prefix: `_uniformTable/`, `_filterPanel/`
- Prevents Next.js from treating as routes

### Database Fields

**Organization Reference**:
- **Preferred**: `organisationId` (use for new code)
- **Legacy**: `fk_assosiation`, `assosiationId` (migrating away)
- Database column: `organisation_id`

**Foreign Keys**:
- **Legacy pattern**: `fk_` prefix (e.g., `fk_cadet`, `fk_uniformType`)
- **New pattern**: `objectId` suffix (e.g., `cadetId`, `uniformTypeId`)
- Gradually migrating to new pattern

**Soft Delete**:
- Field: `recdelete` (DateTime?)
- Companion: `recdeleteUser` (string?)

### Function Naming

**DAL Functions**:
- Exported with domain prefix: `createUniformItem`, `getUniformItemList`
- Internal: `create`, `get`, `update`, `delete`

**Unsecured Helpers**:
- Prefix: `__unsecured` or `unsecured`
- Example: `__unsecuredGetUniformList`

---

## Code Quality & Best Practices

### Security Checklist
- ✅ All Server Actions use genericSAValidator/V2/NoData
- ✅ All database queries filter by organisationId
- ✅ All IDs validated to belong to user's organization
- ✅ Soft-deleted records excluded (where `recdelete: null`)
- ✅ User role checked against required permission level

### Performance
- Use `unsecured` helper functions for nested DAL calls
- Leverage Prisma transactions for multi-step operations
- Use `include` judiciously (avoid over-fetching)

### Type Safety
- Define complex Prisma types in `src/types/`
- Use Zod schemas for all input validation
- Export type-safe DAL functions

### Testing
- Write unit tests for business logic
- Write integration tests for database operations
- Mock external dependencies
- Use static test data for consistency

---

## Common Patterns

### Creating a New DAL Module

1. Create domain folder: `src/dal/myDomain/`
2. Create function files: `create.ts`, `get.ts`, `update.ts`, `delete.ts`
3. Each function uses `"use server"` and genericSAValidator
4. Create `index.ts` to export functions with prefixed names
5. Write `.test.ts` for unit tests (business logic)
6. Write `.integration.test.ts` for database tests

### Creating a New Zod Schema

1. Add schema to appropriate file in `src/zod/`
2. Export schema and infer type:
```typescript
export const mySchema = z.object({...});
export type MyType = z.infer<typeof mySchema>;
```
3. Use in both frontend forms and Server Actions

### Creating a New Page Component

1. Create page: `src/app/[locale]/[acronym]/myPage/page.tsx`
2. Create page-specific components in: `src/app/[locale]/[acronym]/myPage/_components/`
3. Use underscore prefix for component folders
4. Import global components from `src/components/`

---

## Migration Notes

### Legacy Code
Much of the codebase contains older patterns that don't follow these guidelines:
- `src/actions/` folder (deprecated - use `src/dal/`)
- `_index.ts` exports (use `index.ts`)
- `fk_` prefixes (migrating to `Id` suffixes)
- `fk_assosiation` (migrating to `organisationId`)

**When modifying legacy code**: Refactor to new patterns when practical, or add a TODO comment for future migration.

---

## Additional Resources

- **README.md**: Setup instructions, environment variables, database commands
- **Prisma Schema**: `prisma/schema.prisma` - Full database structure
- **Type Definitions**: `src/types/` - Complex Prisma types
- **Validation Schemas**: `src/zod/` - All Zod schemas
- **Test Helpers**: `jest/` - Test setup and utilities
- **Static Test Data**: `tests/_playwrightConfig/testData/` - Test data generation

---

## Quick Reference

### Key Files
- `src/dal/` - Data Access Layer (NEW pattern)
- `src/actions/validations.ts` - Server Action validators
- `src/lib/db.ts` - Prisma client
- `src/lib/ironSession.ts` - Session management
- `src/lib/AuthRoles.ts` - Role definitions
- `src/zod/` - Validation schemas
- `src/types/` - Complex type definitions
- `src/components/fields/` - Custom form components

### Commands
```bash
# Development
npm run dev                          # Start dev server (port 3021)
npm run build                        # Production build
npm start                           # Start production server

# Testing
npm run test:components             # Component tests
npm run test:dal:unit              # DAL unit tests (fast)
npm run test:dal:integration       # DAL integration tests (with DB)
npm run test:e2e                   # Playwright E2E tests
npm run test:coverage:dal          # Unit test coverage

# Database
npx prisma db push                 # Update database schema
npx prisma db seed                 # Seed test data
npx prisma migrate dev             # Create migration
npx prisma migrate deploy          # Deploy migrations (production)
npx prisma studio                  # Open Prisma Studio

# Linting
npm run lint                       # Run ESLint
```
