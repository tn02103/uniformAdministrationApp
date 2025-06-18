import { useEffect, useState } from "react";
import { Form } from "react-bootstrap"

export type NumberFieldProps = {
    required?: boolean,
    onChange?: (value: number | null) => void;
    value?: number | null;
    allowNegative?: boolean;
    allowDecimal?: boolean;
    plaintext?: boolean;
    isInvalid?: boolean;
    id?: string;
    errorId?: string;
    disabled?: boolean;
}

export const NumberField = ({ allowDecimal, allowNegative, value, isInvalid, errorId, ...inputProps }: NumberFieldProps) => {
    const [innerValue, setInnerValue] = useState<string>(value?.toString() ?? "");

    useEffect(() => {
        if (value !== null && value !== undefined) {
            setInnerValue(value.toString());
        } else {
            setInnerValue("");
        }
    }, [value]);

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInnerValue(value);
        if ((value.length === 0 || !Number.isNaN(value)) && inputProps.onChange) {
            const newValue = value === "" ? null : parseFloat(value);
            inputProps.onChange(newValue);
        }
    }

    const onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Enter", "Tab"];
        if (allowDecimal) allowedKeys.push(".", ",");
        if (allowNegative) allowedKeys.push("-");

        if (!/[0-9]/.test(e.key) && allowedKeys.indexOf(e.key) === -1) {
            e.preventDefault();
        }
    }

    return (
        <Form.Control
            {...inputProps}
            type="number"
            value={innerValue ?? ""}
            isInvalid={isInvalid}
            onKeyDown={onKeyPress}
            onChange={handleOnChange}
            aria-errormessage={isInvalid ? errorId : undefined}
            aria-invalid={!isInvalid}
            aria-required={inputProps.required}
        />
    )
}
