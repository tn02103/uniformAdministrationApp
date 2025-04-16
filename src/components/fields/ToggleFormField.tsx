import { Form, FormLabel } from "react-bootstrap";
import { FieldValue, FieldValues, Path, useController } from "react-hook-form"
import ErrorMessage from "../errorMessage";

export type ToggleFormFieldProps<FormType extends FieldValues> = {
    label: string;
    name: Path<FormType>;
    formName?: string;
    disabled?: boolean;
    className?: string;
    hideToggle?: boolean;
    toggleText?: string;
}

export const ToggleFormField = <FormType extends FieldValues>({ label, name, disabled, formName, hideToggle, toggleText, ...inputProps }: ToggleFormFieldProps<FormType>) => {

    const { field, fieldState } = useController({
        name,
        defaultValue: false as FieldValue<FormType>,
    });

    return (
        <Form.Group className="mb-3">
            <Form.Label className="fw-bold m-0" htmlFor={`${formName}_toggle-${name}`}>{label}</Form.Label>
            <div className="form-check form-switch px-0 my-auto">
                {(hideToggle && toggleText)
                    ? <p aria-label={label} aria-readonly>{toggleText}</p>
                    : (
                        <input
                            {...inputProps}
                            {...field}
                            id={`${formName}_toggle-${name}`}
                            type="checkbox"
                            role="switch"
                            className="form-check-input fw-bold mx-0 my-2"
                            checked={field.value}
                            tabIndex={disabled ? -1 : 0}
                            style={disabled ? { pointerEvents: "none", opacity: 0.5 } : { cursor: "pointer" }}
                            aria-disabled={disabled}
                            aria-checked={field.value}
                            onChange={() => disabled ? undefined : field.onChange(!field.value)}
                        />
                    )
                }
            </div>
            <ErrorMessage error={fieldState.error?.message} testId={`err_${name}`} />
        </Form.Group>
    );
}