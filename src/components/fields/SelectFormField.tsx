import { useMemo } from "react";
import { FieldValues, Path, useController } from "react-hook-form";
import { SelectField } from "./SelectField";
import { useFormContext } from "./Form";

export type { SelectOptionType } from "./SelectField";

export type SelectFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    options: { value: string | number, label: string }[],
    plaintext?: boolean,
    labelClassName?: string,
    selectClassName?: string,
    onValueChange?: (value: string | number) => void,
    hookFormValidation?: boolean,
    valueAsNumber?: boolean;
}

export const SelectFormField = <FormType extends FieldValues>({ label, name, required, options, labelClassName, selectClassName, onValueChange, hookFormValidation, valueAsNumber, ...inputProps }: SelectFormFieldProps<FormType>) => {
    const { field, fieldState } = useController({
        name,
        rules: hookFormValidation ? {
            required: required ? 'pleaseSelect' : false,
        } : {},
    });
    const error = useMemo(() => {
        if (fieldState.error?.message === "string.required") {
            return "pleaseSelect";
        }
        return fieldState.error?.message;
    }, [fieldState.error?.message]);

    const formContext = useFormContext();
    const disabled = formContext?.disabled || inputProps.disabled;
    const plaintext = formContext?.plaintext || inputProps.plaintext;
    const formName = inputProps.formName || formContext?.formName || "unnamedForm";

    const handleChange = (value: string | number) => {
        field.onChange(value);
        onValueChange?.(value);
    };

    return (
        <SelectField
            {...field}
            label={label}
            name={String(name)}
            formName={formName}
            required={required}
            disabled={disabled}
            options={options}
            value={field.value ?? ""}
            onChange={handleChange}
            valueAsNumber={valueAsNumber}
            plaintext={plaintext}
            labelClassName={labelClassName}
            selectClassName={selectClassName}
            errorMessage={error}
        />
    );
};
