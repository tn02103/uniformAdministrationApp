import { Form } from "react-bootstrap"
import { FieldValues, Path, useController } from "react-hook-form"
import { Field } from "./Field"

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

export const InputFormField = <FormType extends FieldValues>({ label, name, required, formName, ...inputProps }: Props<FormType>) => {
    const { field, fieldState } = useController({
        name,
    })
    return (
        <Field
            formName={formName}
            name={name}
            label={label}
            required={required}
            errorMessage={fieldState.error?.message}
        >
            <Form.Control
                {...inputProps}
                {...field}
                id={`${formName}_input-${name}`}
                type="text"
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