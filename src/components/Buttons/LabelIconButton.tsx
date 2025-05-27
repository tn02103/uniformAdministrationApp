import { useScopedI18n } from "@/lib/locales/client";
import { faPen, faPlus, faTrash, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, ButtonProps } from "react-bootstrap";

type Variant = {
    label: "create" | "edit" | "delete";
    icon: IconDefinition;
    buttonVariant: ButtonProps["variant"];
}
const variants: { [key in string]: Variant } = {
    create: {
        label: "create",
        icon: faPlus,
        buttonVariant: "outline-success",
    },
    edit: {
        label: "edit",
        icon: faPen,
        buttonVariant: "outline-secondary",
    },
    delete: {
        label: "delete",
        icon: faTrash,
        buttonVariant: "outline-danger",
    }
}


type LabelIconButtonProp = Omit<ButtonProps, "varaint" | "onClick"> & ({
    variantKey?: undefined;
    label: string;
    icon: IconDefinition;
    buttonVariant: ButtonProps["variant"];
} | {
    variantKey: keyof typeof variants;
    label?: undefined;
    icon?: undefined;
    buttonVariant?: undefined
}) & {
    onClick: () => void;
}
export const LabelIconButton = ({ variantKey, label, icon, buttonVariant, ...buttonProps }: LabelIconButtonProp) => {
    const t = useScopedI18n("common.actions");
    if (variantKey !== undefined) {
        const variant = variants[variantKey];
        return (
            <Button
                className="col-auto border-0"
                {...buttonProps}
                variant={variant.buttonVariant}
            >
                {t(variant.label)} <FontAwesomeIcon icon={variant.icon} size="sm" />
            </Button>
        )
    } else {
        return (
            <Button
                className="col-auto border-0"
                {...buttonProps}
                variant={buttonVariant}
            >
                {label} <FontAwesomeIcon icon={icon} size="sm" />
            </Button>
        )
    }
}