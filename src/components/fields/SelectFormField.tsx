import { Form } from "react-bootstrap";
import { FieldValues, Path, useController } from "react-hook-form";
import ErrorMessage from "../errorMessage";
import { useI18n } from "@/lib/locales/client";

export type SelectOptionType = { value: string | number, label: string };

export type SelectFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    options: SelectOptionType[],
    plaintext?: boolean,
    labelClassName?: string,
    selectClassName?: string,
}

export const SelectFormField = <FormType extends FieldValues>({ label, name, required, plaintext, options, labelClassName, ...inputProps }: SelectFormFieldProps<FormType>) => {
    const t = useI18n();
    const { field, fieldState } = useController({
        name,
    });

    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={`select-${name}`} className={"fw-bold m-0 " + labelClassName}>
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
                    id={`select-${name}`}
                    isInvalid={!!fieldState.error}
                    aria-errormessage={`err_${name}`}	
                    aria-invalid={!!fieldState.error}
                >
                    <option value={undefined} selected={!field.value} disabled>{t('common.error.pleaseSelect')}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </Form.Select>
            }
            <ErrorMessage
                error={fieldState.error?.message}
                testId={`err_${name}`}
                id={`err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </Form.Group>
    );

}