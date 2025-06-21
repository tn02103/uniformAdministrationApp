import { Autocomplete, AutocompleteOptionType, AutocompleteProps } from "./Autocomplete"
import { Field, FieldProps } from "./Field"

type AutocompleteFieldProps<TOption extends AutocompleteOptionType> =
    AutocompleteProps<TOption> & Omit<FieldProps, "fieldName" | "formName" | "name">

export type { AutocompleteOptionType, RenderOptionProps } from "./Autocomplete";
export const AutocompleteField = <TOption extends AutocompleteOptionType>(props: AutocompleteFieldProps<TOption>) => {
    const { label, required, errorMessage, labelClassName, ...autocompleteProps } = props;

    return (
        <Field
            name={"autocomplete"}
            fieldId="autocomplete"
            label={label}
            required={required}
            errorMessage={errorMessage}
            labelClassName={labelClassName}
            fieldGroupTestId="autocomplete-field-group"
        >
            <Autocomplete<TOption>
                {...autocompleteProps}
                invalid={!!errorMessage}
            />
        </Field>
    )
}
