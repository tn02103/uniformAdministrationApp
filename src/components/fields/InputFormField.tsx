import { Form, FormGroup } from "react-bootstrap"
import { FieldValues, Path, useController } from "react-hook-form"
import ErrorMessage from "../errorMessage"

type Props<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    placeholder?: string,
    plaintext?: boolean,
}

export const InputFormField = <FormType extends FieldValues>({ label, name, required, ...inputProps }: Props<FormType>) => {
    const { field, fieldState } = useController({
        name,
    })
    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={`input-${name}`} className="fw-bold m-0">{label}{required ? " *" : ""}</Form.Label>
            <Form.Control
                {...inputProps}
                {...field}
                id={`input-${name}`}
                type="text"
                isInvalid={!!fieldState.error}
                width={"auto"}
                value={field.value ?? ""}
                aria-errormessage={fieldState.error ? `err_${name}` : undefined}
                aria-invalid={!!fieldState.error}
                aria-required={required}
            />
            <ErrorMessage
                error={fieldState.error?.message}
                testId={`err_${name}`}
                id={`err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </Form.Group>
    )
}