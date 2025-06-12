import { Control, FieldValue, FieldValues, Path, useController } from "react-hook-form";
import AutocompleteField, { AutocompleteFieldProps } from "./AutocompleteField";

export type AutocompleteFormFieldProps<FormType extends FieldValues> = {
    name: Path<FormType>;
    control?: Control<FormType>;
} & Omit<AutocompleteFieldProps, 'value' | 'onChange'>;


export default function AutocompleteFormField<FormType extends FieldValues>(props: AutocompleteFormFieldProps<FormType>) {
    const { name, ...rest } = props;

    const { field } = useController({
        name,
        defaultValue: null as FieldValue<FormType>,
        control: props.control,
    });

    return (
        <div>
            <AutocompleteField {...rest} {...field} />
        </div>
    );

}