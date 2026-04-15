import { forwardRef } from "react";
import { useI18n } from "@/lib/locales/client";
import { Form } from "react-bootstrap";
import { Field } from "./Field";

export type SelectOptionType = { value: string | number, label: string };

type OmittedFromSelect = 'value' | 'onChange' | 'id' | 'isInvalid' | 'aria-errormessage' | 'aria-invalid' | 'options' | 'size';

export type SelectFieldProps = {
    label: string,
    name: string,
    formName?: string,
    required?: boolean,
    disabled?: boolean,
    options: SelectOptionType[],
    value: string | number,
    onChange: (value: string | number) => void,
    valueAsNumber?: boolean,
    plaintext?: boolean,
    labelClassName?: string,
    selectClassName?: string,
    errorMessage?: string,
} & Omit<React.ComponentPropsWithoutRef<'select'>, OmittedFromSelect>;

/**
 * Standalone select field with label and error display. No form context required.
 *
 * @param label - Visible label text.
 * @param name - Field name, used for id generation.
 * @param value - Controlled selected value.
 * @param onChange - Called with the new value when selection changes.
 * @param options - Array of `{ value, label }` options.
 * @param disabled - Disables the select when `true`.
 * @param plaintext - Renders a read-only text paragraph instead of the select.
 * @param errorMessage - Validation error to display below the field.
 * @param ref - Forwarded ref to the Form.Select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>((
    props,
    ref,
) => {
    const { label, name, formName = "unnamedForm", required, options, disabled, plaintext, labelClassName, selectClassName, errorMessage, valueAsNumber, onChange, value, ...selectProps } = props;
    const t = useI18n();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let newValue: string | number = e.target.value;
        if (valueAsNumber) {
            newValue = +newValue;
        }
        onChange(newValue);
    };

    return (
        <Field
            formName={formName}
            name={name}
            label={label}
            required={required}
            errorMessage={errorMessage}
            labelClassName={labelClassName}
            fieldName="select"
        >
            {plaintext ? (
                <p aria-label={label} aria-readonly className="py-2 m-0">
                    {options.find((o) => o.value === value)?.label || value}
                </p>
            ) : (
                <Form.Select
                    ref={ref}
                    {...selectProps}
                    name={name}
                    value={value || ""}
                    onChange={handleChange}
                    disabled={disabled}
                    id={`${formName}_select-${name}`}
                    isInvalid={!!errorMessage}
                    aria-errormessage={errorMessage ? `${formName}_err_${name}` : undefined}
                    aria-invalid={!!errorMessage}
                    className={`text-truncate ${selectProps.className || selectClassName || ""}`}
                >
                    <option value="" disabled>{t("common.error.pleaseSelect")}</option>
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </Form.Select>
            )}
        </Field>
    );
});
SelectField.displayName = "SelectField";