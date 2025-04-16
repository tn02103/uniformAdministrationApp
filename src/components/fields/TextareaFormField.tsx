import { Form } from "react-bootstrap"
import { FieldValues, Path, useController } from "react-hook-form"
import ErrorMessage from "../errorMessage"

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
}

export const TextareaFormField = <FormType extends FieldValues>({ label, name, required, formName, rows, ...inputProps }: Props<FormType>) => {
    const { field, fieldState } = useController({
        name,
    });

    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={`${formName}_input-${name}`} className="fw-bold m-0">{label}{required ? " *" : ""}</Form.Label>
            <Form.Control
                {...inputProps}
                {...field}
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
            <ErrorMessage
                error={fieldState.error?.message}
                testId={`err_${name}`}
                id={`${formName}_err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </Form.Group>
    )
}