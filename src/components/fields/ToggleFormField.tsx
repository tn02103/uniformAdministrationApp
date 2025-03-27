import { Form } from "react-bootstrap";
import { FieldValues, Path, useController } from "react-hook-form"
import ErrorMessage from "../errorMessage";

export type ToggleFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    disabled?: boolean,
    className?: string,
}

export const ToggleFormField = <FormType extends FieldValues>({ label, name, disabled, ...inputProps }: ToggleFormFieldProps<FormType>) => {

    const { field, fieldState } = useController({
        name,
    });

    return (
        <Form.Group className="mb-3">
            <Form.Check
                {...inputProps}
                {...field}
                label={label}
                type="switch"
                className="fw-bold"
                checked={field.value}
                tabIndex={disabled ? -1 : 0}
                onClick={(e) => {
                    console.log("test");
                    e.preventDefault();
                }}
                onChange={() => disabled ? undefined : field.onChange(!field.value)}
            />
            <ErrorMessage error={fieldState.error?.message} testId={`err_${name}`} />
        </Form.Group>
    )
}