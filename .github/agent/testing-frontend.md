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
- Server Actions are called with correct arguments on submit

## What NOT to Test

- DAL / server-side logic (belongs in DAL tests)
- Prisma queries
- Auth logic

## Mocking Server Actions
DAL functions are Server Actions. Mock them at the module level:
```typescript
vi.mock('@/dal/uniform/item', () => ({
    getUniformItem: vi.fn(),
    createUniformItem: vi.fn(),
}));
```
Then configure mock return values per test:
```typescript
import { getUniformItem } from '@/dal/uniform/item';
(getUniformItem as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '...', number: 1 });
```

## Form Testing Pattern
Render the component, interact via `userEvent`, assert on DOM output:
```typescript
import { render, screen } from 'vitest/helpers/test-utils';
import userEvent from '@testing-library/user-event';

test('shows validation error for empty required field', async () => {
    render(<MyForm />);
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByText(/required/i)).toBeInTheDocument();
});
```

## Key Rules
- Use `vitest/helpers/test-utils.tsx` for `render` (wraps providers)
- Prefer `getByRole` and `getByLabelText` over `getByTestId` for resilient selectors
- Do not test implementation details; test observable behaviour
- Use `vi.fn()` / `vi.mock()` — not `jest.*` equivalents
