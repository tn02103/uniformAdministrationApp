import { FieldValues, Path, useController } from "react-hook-form"
import { Field } from "./Field"
import { useFormContext } from "./Form"
import { NumberField, NumberFieldProps } from "./NumberInput"

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

export const NumberInputFormField = <FormType extends FieldValues>(props: NumberInputFormFieldProps<FormType>) => {
    const { label, name, required, formName: formNameProp, disabled: disabledProp, plaintext: plaintextProp, ...inputProps } = props;
    const { field, fieldState } = useController({
        name,
    });

    const formContext = useFormContext();
    const disabled = formContext?.disabled || disabledProp;
    const plaintext = formContext?.plaintext || plaintextProp;
    const formName = formContext?.formName || formNameProp || "unnamedForm";

    return (
        <Field
            formName={formName}
            name={name}
            label={label}
            required={required}
            errorMessage={fieldState.error?.message}
            fieldName="numberInput"
        >
            <NumberField
                {...inputProps}
                {...field}
                disabled={disabled}
                plaintext={plaintext}
                isInvalid={!!fieldState.error}
                errorId={`${formName}_err_${name}`}
                id={`${formName}_numberInput-${name}`}
            />
        </Field>
    )
}
