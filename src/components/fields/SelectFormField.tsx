import { Form } from "react-bootstrap";
import { FieldValues, Path, useController } from "react-hook-form";
import ErrorMessage from "../errorMessage";
import { useI18n } from "@/lib/locales/client";
import { useMemo } from "react";

export type SelectOptionType = { value: string | number, label: string };

export type SelectFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    options: SelectOptionType[],
    plaintext?: boolean,
    labelClassName?: string,
    selectClassName?: string,
}

export const SelectFormField = <FormType extends FieldValues>({ label, name, required, plaintext, options, labelClassName,formName, ...inputProps }: SelectFormFieldProps<FormType>) => {
    const t = useI18n();
    const { field, fieldState } = useController({
        name,
    });
    const error = useMemo(() => {
        if (fieldState.error?.message === "string.required") {
            return "pleaseSelect";
        }
        return fieldState.error?.message;
    }, [fieldState.error?.message]);

    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={`${formName}_select-${name}`} className={"fw-bold m-0 " + labelClassName}>
                {label}{required ? " *" : ""}
            </Form.Label>
            {plaintext ?
                <p aria-label={label} aria-readonly className="py-2 m-0">
                    {options.find(option => option.value === field.value)?.label || field.value}
                </p>
                :
                <Form.Select
                    {...inputProps}
                    {...field}
                    id={`${formName}_select-${name}`}
                    isInvalid={!!fieldState.error}
                    aria-errormessage={fieldState.error ? `${formName}_err_${name}` : undefined}
                    aria-invalid={!!fieldState.error}
                    className="text-truncate"
                    value={field.value || ""} // Set the value prop to manage the selected option
                >
                    <option value="" disabled>{t('common.error.pleaseSelect')}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </Form.Select>
            }
            <ErrorMessage
                error={error}
                testId={`err_${name}`}
                id={`${formName}_err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </Form.Group>
    );

}