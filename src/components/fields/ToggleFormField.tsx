import { Form, FormLabel } from "react-bootstrap";
import { FieldValue, FieldValues, Path, useController } from "react-hook-form"
import ErrorMessage from "../errorMessage";

export type ToggleFormFieldProps<FormType extends FieldValues> = {
    label: string;
    name: Path<FormType>;
    disabled?: boolean;
    className?: string;
}

export const ToggleFormField = <FormType extends FieldValues>({ label, name, disabled, ...inputProps }: ToggleFormFieldProps<FormType>) => {

    const { field, fieldState } = useController({
        name,
        defaultValue: false as FieldValue<FormType>,
    });

    return (
        <Form.Group className="mb-3">
            <Form.Label className="fw-bold m-0" htmlFor={`toggle-${name}`}>{label}</Form.Label>
            <div className="form-check form-switch">
                <input
                    {...inputProps}
                    {...field}
                    id={`toggle-${name}`}
                    type="checkbox"
                    role="switch"
                    className="form-check-input fw-bold"
                    checked={field.value}
                    tabIndex={disabled ? -1 : 0}
                    style={disabled ? { pointerEvents: "none", opacity: 0.5 } : { cursor: "pointer" }}
                    onChange={() => disabled ? undefined : field.onChange(!field.value)}
                />
            </div>
            <ErrorMessage error={fieldState.error?.message} testId={`err_${name}`} />
        </Form.Group>
    );
}