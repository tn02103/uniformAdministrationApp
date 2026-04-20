import { FieldValues, Path, useController } from "react-hook-form";
import { AutocompleteField, AutocompleteOptionType } from "./AutocompleteField";

export type AutocompleteFormFieldProps<FormType extends FieldValues> = {
    /** Field label */
    label: string;
    /** Dot-path to the form field */
    name: Path<FormType>;
    /** List of options */
    options: AutocompleteOptionType[];
    required?: boolean;
    labelClassName?: string;
    placeholder?: string;
    /** When true, adds a required rule to react-hook-form validation */
    hookFormValidation?: boolean;
};

/**
 * react-hook-form Controller wrapper around AutocompleteField.
 *
 * Reads/writes a `string | null` form value. Displays validation errors from the form context.
 */
export const AutocompleteFormField = <FormType extends FieldValues>({
    label,
    name,
    required,
    options,
    labelClassName,
    placeholder,
    hookFormValidation,
}: AutocompleteFormFieldProps<FormType>) => {
    const { field, fieldState } = useController<FormType>({
        name,
        rules: hookFormValidation ? {
            required: required ? 'pleaseSelect' : false,
        } : {},
    });

    return (
        <AutocompleteField
            label={label}
            required={required}
            options={options}
            value={field.value ?? null}
            onChange={(value) => field.onChange(value)}
            errorMessage={fieldState.error?.message}
            labelClassName={labelClassName}
            placeholder={placeholder}
        />
    );
};
