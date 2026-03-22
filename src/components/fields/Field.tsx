import React from "react"
import { FormGroup, FormLabel } from "react-bootstrap"
import ErrorMessage from "../errorMessage"

export type FieldProps = {
    formName?: string,
    name: string,
    label?: string,
    required?: boolean,
    errorMessage?: string | React.ReactElement,
    children?: React.ReactNode,
    labelClassName?: string,
    fieldName?: string,
    fieldId?: string,
    fieldGroupTestId?: string,
}

export const Field = ({ formName = "", fieldId, name, label, required, errorMessage, children, labelClassName, fieldName = "input", fieldGroupTestId }: FieldProps) => {
    return (
        <FormGroup data-testid={fieldGroupTestId}>
            {label &&
                <FormLabel htmlFor={fieldId ?? `${formName}_${fieldName}-${name}`} className={`fw-bold m-0 ${labelClassName ?? ""}`}>
                    {label}{required ? " *" : ""}
                </FormLabel>
            }
            {children}
            {typeof errorMessage === 'string' || errorMessage === undefined
                ? <ErrorMessage
                    error={errorMessage}
                    testId={`err_${name}`}
                    id={`${formName}_err_${name}`}
                    ariaLabel={`error message ${name}`}
                />
                : (
                    <div
                        id={`${formName}_err_${name}`}
                        aria-label={`error message ${name}`}
                        data-testid={`err_${name}`}
                    >
                        {errorMessage}
                    </div>
                )
            }
        </FormGroup>
    )
}
