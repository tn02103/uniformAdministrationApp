import { Form } from "react-bootstrap"
import { FieldValues, Path, useController } from "react-hook-form"
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
}

export const InputFormField = <FormType extends FieldValues>({ label, name, required, placeholder, className, ...inputProps }: Props<FormType>) => {
    const { field, fieldState } = useController({
        name,
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
