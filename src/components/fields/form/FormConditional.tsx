import { FieldPath, FieldPathValue, FieldValues, useWatch } from "react-hook-form";

type FormConditionalProps<TFieldValues extends FieldValues, TFieldName extends FieldPath<TFieldValues>> = {
    name: TFieldName;
    condition: (value: FieldPathValue<TFieldValues, TFieldName>) => boolean;
    children: React.ReactNode;
}

/**
 * Conditionally renders children based on a watched form field value.
 *
 * Must be used inside a `FormProvider`. Subscribes to `name` via `useWatch`
 * and renders `children` only when `condition(value)` returns `true`.
 */
export const FormConditional = <TFieldValues extends FieldValues, TFieldName extends FieldPath<TFieldValues>>({
    name,
    condition,
    children,
}: FormConditionalProps<TFieldValues, TFieldName>) => {
    const value = useWatch<TFieldValues, TFieldName>({ name });
    return condition(value) ? <>{children}</> : null;
}
