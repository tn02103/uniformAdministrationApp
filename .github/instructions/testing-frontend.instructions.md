---
applyTo: src/app/**/*.test.tsx, src/components/**/*.test.tsx, src/dataFetcher/**/*.test.ts
---

# Frontend / Component Testing

## Setup
- **Config**: `vitest.frontend.config.ts`
- **Command**: `npm run test:components`
- **Environment**: jsdom (browser simulation)
- **Setup file**: `vitest/setup-components.tsx`
- **Test helpers**: `vitest/helpers/test-utils.tsx`

## File Location
Tests live alongside the component:
```
src/components/MyComponent/
    MyComponent.tsx
    MyComponent.test.tsx

src/app/[locale]/[acronym]/myPage/_myFeature/
    MyFeatureComponent.tsx
    MyFeatureComponent.test.tsx
```

## What to Test
- UI renders correctly for different prop combinations
- Conditional rendering (show/hide based on state or props)
- User interactions: clicks, input changes, form submissions
- Form validation messages appear for invalid input
- Server Actions are called with correct arguments on submit and handle responses correctly
- New features: each acceptance criterion has at least one component-level test
- Changed requirements: existing tests updated to reflect new expected behaviour

## What NOT to Test
- DAL / server-side logic (belongs in DAL tests)
- Prisma queries
- Auth logic

## Bug Fix Tests
Every bug fix MUST include a new test that would have failed before the fix. Name it to describe the bug scenario.

## Mocking Server Actions
DAL functions are Server Actions. Mock them at the module level:
```typescript
vi.mock('@/dal/uniform/item', () => ({
    getUniformItem: vi.fn(),
    createUniformItem: vi.fn(),
}));
```
Configure default mock return values in `beforeEach`. Overwrite in specific tests only when a different return value is needed:
```typescript
import { getUniformItem } from '@/dal/uniform/item';

beforeEach(() => {
    vi.mocked(getUniformItem).mockResolvedValue({ id: '...', number: 1 });
});

test('shows error state', async () => {
    vi.mocked(getUniformItem).mockRejectedValue(new Error('not found'));
    // ...
});
```

## Form Testing Pattern
Set up `userEvent` once per describe block, then use the returned instance in each test:
```typescript
import { render, screen } from 'vitest/helpers/test-utils';
import userEvent from '@testing-library/user-event';

describe('MyForm', () => {
    const user = userEvent.setup();

    test('shows validation error for empty required field', async () => {
        render(<MyForm />);
        await user.click(screen.getByRole('button', { name: /submit/i }));
        expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
});
```

## Key Rules
- Use `vitest/helpers/test-utils.tsx` for `render` (wraps providers)
- Prefer `getByRole` and `getByLabelText` over `getByTestId` for resilient selectors
- Do not test implementation details; test observable behaviour
- Use `vi.fn()` / `vi.mock()` — **never** `jest.*` equivalents
- No `console.log` in test files
