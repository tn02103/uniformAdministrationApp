import { Form } from "react-bootstrap"
import { FieldValues, Path, useController } from "react-hook-form"
import { Field } from "./Field"
import { useFormContext } from "./Form"
import { useScopedI18n } from "@/lib/locales/client"

type Props<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    rows?: number,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    placeholder?: string,
    plaintext?: boolean,
    hookFormValidation?: boolean,
    maxLength?: number,
}

export const TextareaFormField = <FormType extends FieldValues>(props: Props<FormType>) => {
    const { label, name, rows, required, placeholder, className, hookFormValidation, maxLength, ...inputProps } = props;

    const t = useScopedI18n('common.error');
    const { field, fieldState } = useController({
        name,
        rules: hookFormValidation ? {
            required: required ? t('string.required') : false,
            maxLength: maxLength ? { value: maxLength, message: t('string.maxLength', { value: maxLength }) } : undefined,
        } : {},
    });

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
            errorMessage={fieldState.error?.message}
        >
            <Form.Control
                {...field}
                disabled={disabled}
                plaintext={plaintext}
                className={className}
                placeholder={placeholder}
                as="textarea"
                rows={rows ?? 3}
                id={`${formName}_input-${name}`}
                isInvalid={!!fieldState.error}
                width={"auto"}
                value={field.value ?? ""}
                aria-errormessage={fieldState.error ? `${formName}_err_${name}` : undefined}
                aria-invalid={!!fieldState.error}
                aria-required={required}
            />
        </Field>
    )
}
