# Frontend — Rules & Patterns

## App Structure
```
src/app/[locale]/[acronym]/   # All authenticated app pages live here
    <domain>/
        page.tsx              # Route entry point (server component)
        _<feature>/           # Page-specific components (underscore = not a route)
            MyComponent.tsx
```

### Global vs Page-Specific Components
- **Global** (`src/components/`): reusable across multiple pages. Subfolders for complex components (e.g. `UniformOffcanvas/`).
- **Page-specific** (`src/app/.../[page]/_<folder>/`): scoped to one page. Always use an underscore-prefixed folder name to prevent Next.js from treating them as routes.

## Forms

### Stack
react-hook-form + Zod via `@hookform/resolvers/zod`.

### Rules
- Always use a Zod schema from `src/zod/` as the resolver — never define schemas inline in components
- Input data to Server Actions (DAL calls) must match the same Zod schema used on the form
- Use the custom field components from `src/components/fields/` — do not use raw `<input>` elements

### Custom Field Components (`src/components/fields/`)
```
InputFormField.tsx            — text / email / password
NumberInputFormField.tsx      — numeric
SelectFormField.tsx           — dropdown
TextareaFormField.tsx         — multiline text
ToggleFormField.tsx           — checkbox / toggle switch
AutocompleteField.tsx         — autocomplete with suggestions
InlineEditInputFormField.tsx  — inline editable label → input
```
All components accept `control` from react-hook-form and render error messages automatically with i18n support.

### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mySchema, MySchemaType } from '@/zod/myDomain';
import { InputFormField } from '@/components/fields/InputFormField';

const MyForm = () => {
    const form = useForm<MySchemaType>({
        resolver: zodResolver(mySchema),
        defaultValues: { ... },
    });

    const onSubmit = async (data: MySchemaType) => {
        await myDalAction(data); // DAL server action, same schema
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <InputFormField name="fieldName" label="Label" control={form.control} required />
        </form>
    );
};
```

## Data Loading

### DataFetcher layer (`src/dataFetcher/`)
All SWR hooks (`use*` functions) live in `src/dataFetcher/`, organised by domain. **Components never call `useSWR` directly** — they always consume a hook from this layer. Each hook:
- Uses a DAL server action as the SWR fetcher
- Uses a human-readable dot-separated SWR key (e.g. `cadet.${cadetId}.uniform`)
- Accepts optional `initialData` as `fallbackData` so the client renders without a loading flash

```typescript
// src/dataFetcher/cadet.ts
export function useCadetUniformMap(cadetId: string, initialData?: CadetUniformMap) {
    const { data, mutate } = useSWR(
        `cadet.${cadetId}.uniform`,
        () => getCadetUniformMap(cadetId),
        { fallbackData: initialData },
    );
    return { map: data, mutate };
}
```

The page server component fetches initial data and passes it as a prop; the client component calls the hook:
```typescript
// page.tsx (server component)
const initialData = await getCadetUniformMap(cadetId);
return <CadetUniformTable cadetId={cadetId} initialData={initialData} />;

// CadetUniformTable.tsx (client component)
const { map, mutate } = useCadetUniformMap(cadetId, initialData);
```

After a mutation call `mutate()` from the hook. To revalidate multiple related keys use a predicate:
```typescript
mutate((key) => typeof key === 'string' && key.startsWith(`cadet.${cadetId}.`), data, options);
```

### Strategy 2: Server-only (rarely changed / admin pages)
Load data exclusively in the server component. The DAL action calls `revalidatePath` on mutation to invalidate the Next.js page cache:
```typescript
revalidatePath(`/[locale]/${acronym}/admin/uniform/sizes`, 'page');
```
Do NOT use SWR for these pages.

### Strategy 3: Global data via `GlobalDataProvider`
Application-wide reference data is loaded once in the layout server component and injected into `GlobalDataProvider` (`src/components/globalDataProvider.tsx`). It:
- Exposes data via `useGlobalData()` React context
- Pre-populates the SWR cache via `<SWRConfig fallback={...}>` so dataFetcher hooks for these keys resolve immediately from cache

Known global SWR keys (pre-seeded, no extra fetch needed):
- `uniform.type.list` — `UniformType[]`
- `uniform.sizelist.list` — `UniformSizelist[]`
- `inspection.status` — `InspectionStatus | null`

Do NOT re-fetch this data in child components — use `useGlobalData()` or a dataFetcher hook with the matching SWR key.

### Strategy selection
| Data type | Strategy |
|---|---|
| Interactive / user-specific data | DataFetcher `use*` hook + `fallbackData` from server |
| App-wide slowly-changing config | `GlobalDataProvider` + dataFetcher hook using shared key |
| Rarely changed, admin/settings pages | Server component only + `revalidatePath` on mutation |

## Naming Conventions

### Function names
| Prefix | Layer | Purpose |
|---|---|---|
| `use*` | `src/dataFetcher/` | SWR hooks that load/subscribe to data from the backend |
| `handle*` | Component files | Event handlers and action callbacks inside components (e.g. `handleSubmit`, `handleDelete`) |
| `get*` / `create*` / `update*` / `delete*` | `src/dal/` | DAL server actions — reserved, do NOT use these prefixes in components or dataFetcher hooks |

### Files
- Components: PascalCase (`UniformOffcanvas.tsx`)
- Page-specific folders: underscore prefix (`_uniformTable/`)
- Test files: `ComponentName.test.tsx`
- DataFetcher hooks: `src/dataFetcher/<domain>.ts`

## Routing
Pages are at `src/app/[locale]/[acronym]/<domain>/page.tsx`.
`[locale]` = i18n locale, `[acronym]` = organisation acronym (used as org identifier in URL).
