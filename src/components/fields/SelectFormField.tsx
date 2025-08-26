import { useI18n } from "@/lib/locales/client";
import { useMemo } from "react";
import { Form } from "react-bootstrap";
import { FieldValues, Path, useController } from "react-hook-form";
import { Field } from "./Field";
import { useFormContext } from "./Form";

export type SelectOptionType = { value: string | number, label: string };

export type SelectFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    options: SelectOptionType[],
    plaintext?: boolean,
    labelClassName?: string,
    selectClassName?: string,
    onValueChange?: (value: string | number) => void,
    hookFormValidation?: boolean,
}

export const SelectFormField = <FormType extends FieldValues>({ label, name, required, options, labelClassName, selectClassName, onValueChange, hookFormValidation, ...inputProps }: SelectFormFieldProps<FormType>) => {
    const t = useI18n();
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

    return (
        <Field
            formName={formName}
            name={name}
            label={label}
            required={required}
            errorMessage={error}
            labelClassName={labelClassName}
            fieldName="select"
        >
            {plaintext ?
                <p aria-label={label} aria-readonly className="py-2 m-0">
                    {options.find(option => option.value === field.value)?.label || field.value}
                </p>
                :
                <Form.Select
                    {...field}
                    onChange={(e) => { field.onChange(e); onValueChange?.(e.target.value) }}
                    disabled={disabled}
                    id={`${formName}_select-${name}`}
                    isInvalid={!!fieldState.error}
                    aria-errormessage={fieldState.error ? `${formName}_err_${name}` : undefined}
                    aria-invalid={!!fieldState.error}
                    className={`text-truncate ${selectClassName || ""}`}
                    value={field.value || ""} // Set the value prop to manage the selected option
                >
                    <option value="" disabled>{t('common.error.pleaseSelect')}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </Form.Select>
            }
        </Field>
    );
};
