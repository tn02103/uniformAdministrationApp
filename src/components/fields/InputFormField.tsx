import { useScopedI18n } from "@/lib/locales/client"
import React from "react"
import { Form, FormControlProps } from "react-bootstrap"
import { FieldError, FieldValues, Path, useController } from "react-hook-form"
import { Field } from "./Field"
import { useFormContext } from "./Form"

type Props<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    placeholder?: string,
    plaintext?: boolean,
    maxLength?: number,
    hookFormValidation?: boolean,
    onValueChange?: (value: string | null, e:React.ChangeEvent) => void,
    customErrorMessage?: (error: FieldError | undefined) => string | React.ReactElement | undefined,
} & Pick<FormControlProps, 'type' | 'autoComplete'>

export const InputFormField = <FormType extends FieldValues>(props: Props<FormType>) => {
    const { label, name, required, placeholder, className, hookFormValidation, maxLength, customErrorMessage, type = "text", onValueChange, ...inputProps } = props;

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
    const formName = formContext?.formName || inputProps.formName || "unnamedForm";

    const errorMessage = customErrorMessage
        ? customErrorMessage(fieldState.error)
        : fieldState.error?.message;

    return (
        <Field
            formName={formName}
            name={name}
            label={label}
            required={required}
            errorMessage={errorMessage}
        >
            <Form.Control
                {...field}
                {...inputProps}
                className={className}
                disabled={disabled}
                plaintext={plaintext}
                id={`${formName}_input-${name}`}
                isInvalid={!!fieldState.error}
                placeholder={placeholder}
                type={type}
                width={"auto"}
                value={field.value ?? ""}
                aria-errormessage={fieldState.error ? `${formName}_err_${name}` : undefined}
                aria-invalid={!!fieldState.error}
                aria-required={required}
                onChange={(e) => {field.onChange(e); onValueChange?.(e.target.value, e); }}
            />
        </Field>
    );
}
