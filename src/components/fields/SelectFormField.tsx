import { Form } from "react-bootstrap";
import { FieldValues, Path, useController } from "react-hook-form";
import ErrorMessage from "../errorMessage";

export type SelectOptionType = { value: string | number, label: string };

export type SelectFormFieldProps<FormType extends FieldValues> = {
    label: string,
    name: Path<FormType>,
    required?: boolean,
    disabled?: boolean,
    className?: string,
    options: SelectOptionType[],
    plaintext?: boolean,
}

export const SelectFormField = <FormType extends FieldValues>({ label, name, required, plaintext, options, ...inputProps }: SelectFormFieldProps<FormType>) => {

    const { field, fieldState } = useController({
        name,
    });
 
    return (
        <Form.Group className="mb-3">
            <Form.Label className="fw-bold m-0">{label}{required ? " *" : ""}</Form.Label>
            {plaintext ?
                <p className="py-2 m-0">
                    {options.find(option => option.value === field.value)?.label || field.value}
                </p>
                :
                <Form.Select
                    {...inputProps}
                    {...field}
                >
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>{option.label}</option>
                    ))}
                </Form.Select>
            }
            <ErrorMessage error={fieldState.error?.message} testId={`err_${name}`} />
        </Form.Group>
    );

}