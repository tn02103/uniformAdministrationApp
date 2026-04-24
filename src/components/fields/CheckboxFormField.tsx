import { FieldValue, FieldValues, Path, useController } from "react-hook-form";
import { useFormContext } from "./Form";
import ErrorMessage from "../errorMessage";

export type CheckboxFormFieldProps<FormType extends FieldValues> = {
    /** Label displayed to the right of the checkbox. */
    label: string;
    name: Path<FormType>;
    formName?: string;
    disabled?: boolean;
}

/**
 * A checkbox field with the label positioned to the right.
 * Integrates with react-hook-form via FormContext.
 */
export const CheckboxFormField = <FormType extends FieldValues>({
    label,
    name,
    disabled: disabledProp,
    formName: formNameProp,
}: CheckboxFormFieldProps<FormType>) => {
    const { field, fieldState } = useController({
        name,
        defaultValue: false as FieldValue<FormType>,
    });

    const formContext = useFormContext();
    const disabled = formContext?.disabled || disabledProp;
    const formName = formContext?.formName || formNameProp || "unnamedForm";
    const inputId = `${formName}_checkbox-${name}`;

    return (
        <div className="mb-2">
            <div className="form-check">
                <input
                    {...field}
                    id={inputId}
                    type="checkbox"
                    className="form-check-input"
                    checked={field.value}
                    tabIndex={disabled ? -1 : 0}
                    style={disabled ? { pointerEvents: "none", opacity: 0.5 } : { cursor: "pointer" }}
                    aria-disabled={disabled}
                    aria-checked={field.value}
                    onChange={() => (disabled ? undefined : field.onChange(!field.value))}
                />
                <label htmlFor={inputId} className="form-check-label">
                    {label}
                </label>
            </div>
            <ErrorMessage
                error={fieldState.error?.message}
                testId={`err_${name}`}
                id={`${formName}_err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </div>
    );
};
