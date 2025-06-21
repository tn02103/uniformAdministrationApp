import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Button, FormControl } from "react-bootstrap";
import { useController, useForm } from "react-hook-form";
import { ZodTypeAny } from "zod";
import { TooltipActionButton } from "../Buttons/TooltipIconButton";
import { Field, FieldProps } from "./Field";

export type InlineEditInputFormFieldProps = {
    name: string;
    value: string | null;
    ariaLabel?: string;
    label?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    plaintext?: boolean;
    textClassName?: string;
    inputClassName?: string;
    onSave?: (value: string) => void;
    onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    zodSchema?: ZodTypeAny;
} & Omit<FieldProps, "label">

export const InlineEditInputFormField = (props: InlineEditInputFormFieldProps) => {
    const [isEditable, setIsEditable] = useState(false);

    if (!isEditable) {
        return (
            <div className="d-flex align-items-left">
                <p className={"my-auto " + props.textClassName} >
                    {props.value}
                </p>
                <TooltipActionButton
                    variantKey="edit"
                    onClick={() => setIsEditable(true)} />
            </div>
        )
    }

    return (
        <FormComponent
            {...props}
            closeEditable={() => setIsEditable(false)}
        />
    );
}


type FormComponentProps = InlineEditInputFormFieldProps & {
    closeEditable: () => void;
};
const FormComponent = (props: FormComponentProps) => {
    const {
        name,
        ariaLabel,
        value: propValue,
        required = false,
        placeholder,
        disabled = false,
        plaintext = false,
        inputClassName,
        onSave,
        onValueChange,
        closeEditable,
        zodSchema,
        ...fieldProps
    } = props;

    type FormType = { [name]: string };
    const { handleSubmit, control } = useForm<FormType>({
        mode: 'onTouched',
        reValidateMode: 'onChange',
        defaultValues: {
            [name]: propValue || ''
        },
        resolver: zodSchema ? zodResolver(zodSchema) : undefined,
    });

    const { field, fieldState } = useController({
        name,
        control,
        rules: { required: required ? "string.required" : undefined }
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        field.onChange(event);
        onValueChange?.(event.target.value, event);
    }

    const handleSave = (data: FormType) => {
        onSave?.(data[name]);
        closeEditable();
    }

    return (
        <form noValidate autoComplete="off" onSubmit={handleSubmit(handleSave)} >
            <Field
                name={name}
                {...fieldProps}
                errorMessage={fieldState.error?.message}
            >
                <div className="d-flex ">
                    <FormControl
                        {...field}
                        onChange={handleChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        plaintext={plaintext}
                        className={"w-auto " + inputClassName}
                        id={`_input-${name}`}
                        aria-label={ariaLabel}
                        isInvalid={!!fieldState.error}
                    />
                    <Button
                        variant="outline-primary"
                        type="submit"
                        className={`border-0 align-self-center`}
                        size={"sm"}
                        aria-label={"save changes"}
                    >
                        <FontAwesomeIcon icon={faCheck} />
                    </Button>
                    <TooltipActionButton
                        variantKey="cancel"
                        onClick={closeEditable}
                    />
                </div>
            </Field>
        </form>
    );
}
