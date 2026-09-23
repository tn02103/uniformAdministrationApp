import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faArrowUpRightFromSquare, faCheck, faCircleDown, faCirclePlay, faCircleUp, faEdit, faEye, faEyeSlash, faPlus, faRightToBracket, faTrash, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";

export type ActionButtonVariants = keyof typeof Variants;
type SimplePropType = {
    onClick?: () => void,
    type?: "button" | "submit" | "reset",
    size?: "sm" | "md" | "lg",
    variantKey: ActionButtonVariants;
    variantOverride?: string;
    disabled?: boolean,
    testId?: string;
    iconClass?: string,
    buttonClass?: string,
    title?: string;
}
const Variants: {
    [key in string]: {
        icon: IconProp,
        variant: string,
        testId: string,
        ariaLabel: string,
    }
} = {
    create: {
        icon: faPlus,
        variant: "outline-success",
        testId: "btn_create",
        ariaLabel: "create",
    },
    add: {
        icon: faPlus,
        variant: "outline-primary",
        testId: "btn_add",
        ariaLabel: "add",
    },
    cancel: {
        icon: faX,
        variant: "outline-secondary",
        testId: "btn_cancel",
        ariaLabel: "cancel",
    },
    edit: {
        icon: faEdit,
        variant: "outline-primary",
        testId: "btn_edit",
        ariaLabel: "edit",
    },
    moveUp: {
        icon: faCircleUp,
        variant: "outline-secondary",
        testId: "btn_moveUp",
        ariaLabel: "move up",
    },
    moveDown: {
        icon: faCircleDown,
        variant: "outline-secondary ",
        testId: "btn_moveDown",
        ariaLabel: "move down",
    },
    open: {
        icon: faArrowUpRightFromSquare,
        variant: "outline-secondary",
        testId: "btn_open",
        ariaLabel: "open",
    },
    delete: {
        icon: faTrash,
        variant: "outline-danger",
        testId: "btn_delete",
        ariaLabel: "delete",
    },
    reactivate: {
        icon: faEye,
        variant: "outline-secondary",
        testId: "btn_reactivate",
        ariaLabel: "reactivate",
    },
    deactivate: {
        icon: faEyeSlash,
        variant: "outline-secondary",
        testId: "btn_deactivate",
        ariaLabel: "deactivate",
    },
    save: {
        icon: faCheck,
        variant: "outline-success",
        testId: "btn_save",
        ariaLabel: "save",
    },
    startInspection: {
        icon: faCirclePlay,
        variant: "outline-success",
        testId: "btn_start",
        ariaLabel: "start inspection",
    },
    withdraw: {
        icon: faRightToBracket,
        variant: "outline-danger",
        testId: "btn_withdraw",
        ariaLabel: "withdraw item",
    }
}
export const ActionButton = ({
    onClick,
    disabled,
    variantKey,
    testId,
    buttonClass,
    iconClass,
    size = "sm",
    type = "button",
    title,
}: SimplePropType) => {
    const variant = Variants[variantKey];
    if (!variant) {
        throw new Error(`Variant ${variantKey} not found`);
    }

    return (

        <Button
            data-testid={testId ?? variant.testId}
            type={type}
            title={title}
            variant={variant.variant}
            className={`border-0 align-self-center ${buttonClass}`}
            onClick={onClick}
            disabled={disabled}
            size={size === "md" ? undefined : size}
            aria-label={variant.ariaLabel}
        >
            <FontAwesomeIcon icon={variant.icon} className={iconClass} size={size === "md" ? undefined : size} />
        </Button>
    )
}
