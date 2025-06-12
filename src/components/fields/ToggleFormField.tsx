import { FieldValue, FieldValues, Path, useController } from "react-hook-form";
import { Field } from "./Field";
import { useFormContext } from "./Form";

export type ToggleFormFieldProps<FormType extends FieldValues> = {
    label: string;
    name: Path<FormType>;
    formName?: string;
    disabled?: boolean;
    className?: string;
    hideToggle?: boolean;
    toggleText?: string;
}

export const ToggleFormField = <FormType extends FieldValues>(props: ToggleFormFieldProps<FormType>) => {
    const { label, name, disabled: disabledProp, formName: formNameProp, hideToggle, toggleText, ...inputProps } = props;
    const { field, fieldState } = useController({
        name,
        defaultValue: false as FieldValue<FormType>,
    });

    const formContext = useFormContext();
    const disabled = formContext?.disabled || disabledProp;
    const formName = formContext?.formName || formNameProp || "unnamedForm";

    return (
        <Field
            label={label}
            formName={formName}
            name={name}
            errorMessage={fieldState.error?.message}
            fieldName="toggle"
        >
            {(hideToggle && toggleText)
                ? <p className="mt-2" aria-label={label} aria-readonly>{toggleText}</p>
                : (
                    <div className="form-check form-switch px-0 my-auto">
                        <input
                            {...inputProps}
                            {...field}
                            id={`${formName}_toggle-${name}`}
                            type="checkbox"
                            role="switch"
                            className="form-check-input ms-0 my-2"
                            checked={field.value}
                            tabIndex={disabled ? -1 : 0}
                            style={disabled ? { pointerEvents: "none", opacity: 0.5 } : { cursor: "pointer" }}
                            aria-disabled={disabled}
                            aria-checked={field.value}
                            aria-describedby={toggleText ? `${formName}_${name}_toggleText` : undefined}
                            onChange={() => disabled ? undefined : field.onChange(!field.value)}
                        />
                        {toggleText && (
                            <label id={`${formName}_${name}_toggleText`} className="form-check-label ms-2">{toggleText}</label>
                        )}
                    </div>
                )
            }
        </Field>
    );
}