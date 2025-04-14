import { FieldValues, Path, useController } from "react-hook-form"
import { NumberField, NumberFieldProps } from "./NumberField"
import { Form } from "react-bootstrap"
import ErrorMessage from "../errorMessage"

export type NumberInputFormFieldProps<FormType extends FieldValues> = NumberFieldProps & {
    label: string,
    name: Path<FormType>,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    placeholder?: string,
    plaintext?: boolean,
}

export const NumberInputFormField = <FormType extends FieldValues>({ label, name, required, formName, ...inputProps }: NumberInputFormFieldProps<FormType>) => {

    const { field, fieldState } = useController({
        name,
    });
    return (
        <Form.Group className="mb-3">
            <Form.Label htmlFor={`${formName}_numberInput-${name}`} className="fw-bold m-0">
                {label}{required ? " *" : ""}
            </Form.Label>
            <NumberField
                {...inputProps}
                {...field}
                isInvalid={!!fieldState.error}
                id={`${formName}_numberInput-${name}`}
                errorId={`${formName}_err_${name}`}
            />
            <ErrorMessage error={fieldState.error?.message} testId={`err_${name}`} id={`${formName}_err_${name}`} />
        </Form.Group>
    )
}