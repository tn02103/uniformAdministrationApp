import { FormGroup, FormLabel } from "react-bootstrap"
import ErrorMessage from "../errorMessage"

export type FieldProps = {
    formName?: string,
    name: string,
    label?: string,
    required?: boolean,
    errorMessage?: string,
    children?: React.ReactNode,
    labelClassName?: string,
    fieldName?: string,
    fieldId?: string,
}

export const Field = ({ formName = "", fieldId, name, label, required, errorMessage, children, labelClassName, fieldName = "input" }: FieldProps) => {
    return (
        <FormGroup>
            {label &&
                <FormLabel htmlFor={fieldId ?? `${formName}_${fieldName}-${name}`} className={`fw-bold m-0 ${labelClassName ?? ""}`}>
                    {label}{required ? " *" : ""}
                </FormLabel>
            }
            {children}
            <ErrorMessage
                error={errorMessage}
                testId={`err_${name}`}
                id={`${formName}_err_${name}`}
                ariaLabel={`error message ${name}`}
            />
        </FormGroup>
    )
}
