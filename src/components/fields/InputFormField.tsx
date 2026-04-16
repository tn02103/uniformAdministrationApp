import { useScopedI18n } from "@/lib/locales/client"
import { Form } from "react-bootstrap"
import { Control, FieldValues, Path, useController } from "react-hook-form"
import { Field } from "./Field"
import { useFormContext } from "./Form"

type Props<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    control?: Control<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    placeholder?: string,
    plaintext?: boolean,
    maxLength?: number,
    hookFormValidation?: boolean,
    hookFormValidationRules?: Parameters<typeof useController<FormType>>[0]['rules'],
}

export const InputFormField = <FormType extends FieldValues>(props: Props<FormType>) => {
    const { label, name, required, placeholder, className, hookFormValidation, maxLength, hookFormValidationRules, control, ...inputProps } = props;

    const t = useScopedI18n('common.error');
    const { field, fieldState } = useController({
        name,
        control,
        rules: hookFormValidation ? {
            required: required ? t('string.required') : false,
            maxLength: maxLength ? { value: maxLength, message: t('string.maxLength', { value: maxLength }) } : undefined,
            ...hookFormValidationRules,
        } : {},
    });

    const formContext = useFormContext();
    const disabled = formContext?.disabled || inputProps.disabled;
    const plaintext = formContext?.plaintext || inputProps.plaintext;
    const formName = formContext?.formName || inputProps.formName || "unnamedForm";

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
                className={className}
                disabled={disabled}
                plaintext={plaintext}
                id={`${formName}_input-${name}`}
                isInvalid={!!fieldState.error}
                placeholder={placeholder}
                type="text"
                width={"auto"}
                value={field.value ?? ""}
                aria-errormessage={fieldState.error ? `${formName}_err_${name}` : undefined}
                aria-invalid={!!fieldState.error}
                aria-required={required}
            />
        </Field>
    );
}
