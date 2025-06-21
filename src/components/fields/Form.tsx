import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useMemo } from "react";
import { FieldErrors, FieldValues, FormProvider, useForm, UseFormProps } from "react-hook-form";
import { ZodTypeAny } from "zod";


type FormContextType = {
    disabled: boolean;
    plaintext: boolean;
    formName: string;
}

export const FormContext = createContext<FormContextType | null>(null);
export const useFormContext = () => useContext(FormContext);

type FormProps<TFieldValue extends FieldValues> = {
    onSubmit: (data: TFieldValue) => void;
    onSubmitError?: (errors: FieldErrors<TFieldValue>) => void;
    children: React.ReactNode;
    disabled?: boolean;
    plaintext?: boolean;
    formName?: string;
    zodSchema?: ZodTypeAny;
} & UseFormProps<TFieldValue>;

export const Form = <TFieldValue extends FieldValues>({
    onSubmit,
    onSubmitError,
    disabled = false,
    plaintext = false,
    formName = 'unnamedForm',
    mode = 'onTouched',
    reValidateMode = 'onChange',
    children,
    ...props
}: FormProps<TFieldValue>) => {
    const form = useForm<TFieldValue>({
        mode,
        reValidateMode,
        resolver: props.zodSchema ? zodResolver(props.zodSchema) : undefined,
        ...props,
    });

    const formContextValue = useMemo(() => ({
        disabled,
        plaintext,
        formName,
    }), [disabled, plaintext, formName]);

    return (
        <form noValidate autoComplete="off" onSubmit={form.handleSubmit(onSubmit, onSubmitError)} className="form">
            <FormContext.Provider value={formContextValue}>
                <FormProvider {...form}>
                    {children}
                </FormProvider>
            </FormContext.Provider>
        </form>
    );
};
