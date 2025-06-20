import { useScopedI18n } from "@/lib/locales/client";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faArrowUpRightFromSquare, faCheck, faCircleDown, faCirclePlay, faCircleUp, faEdit, faEye, faEyeSlash, faPlus, faTrash, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

type PropType = {
    icon: IconProp,
    variant: string,
    onClick: () => void,
    tooltipText: ReactNode,
    testId: string,
    iconClass?: string,
    buttonSize?: "sm" | "lg",
    buttonClass?: string,
    disabled?: boolean,
    buttonType?: "button" | "submit";
    "aria-label"?: string,
}


const TooltipIconButton = (props: PropType) => {
    const { icon, variant, tooltipText, testId, onClick, buttonSize, buttonClass, disabled, iconClass, buttonType, "aria-label": ariaLabel } = props;
    return (
        <OverlayTrigger
            delay={{ show: 500, hide: 150 }}
            overlay={
                <Tooltip className="d-none d-lg-inline">{tooltipText}</Tooltip>
            }
            rootClose={disabled}
        >
            <Button
                data-testid={testId}
                type={buttonType ?? "button"}
                variant={variant}
                className={`border-0 align-self-center ${buttonClass}`}
                onClick={onClick}
                disabled={disabled}
                size={buttonSize}
                aria-label={ariaLabel}
            >
                <FontAwesomeIcon
                    icon={icon}
                    className={iconClass} />
            </Button>
        </OverlayTrigger>
    )
}
type SimplePropType = {
    onClick: () => void,
    variantKey: keyof typeof Variants;
    disabled?: boolean,
    testId?: string;
    iconClass?: string,
    buttonClass?: string,
    buttonSize?: "md" | "lg",
}
const Variants: {
    [key in string]: {
        icon: IconProp,
        variant: string,
        tooltipKey: "edit" | "create" | "moveUp" | "moveDown" | "open" | "delete" | "reactivate" | "deactivate" | "startInspection" | "save" | "cancel",
        testId: string,
        ariaLabel: string,
    }
} = {
    create: {
        icon: faPlus,
        variant: "outline-success",
        tooltipKey: "create",
        testId: "btn_create",
        ariaLabel: "create",
    },
    cancel: {
        icon: faX,
        variant: "outline-secondary",
        tooltipKey: "cancel",
        testId: "btn_cancel",
        ariaLabel: "cancel",
    },
    edit: {
        icon: faEdit,
        variant: "outline-primary",
        tooltipKey: "edit",
        testId: "btn_edit",
        ariaLabel: "edit",
    },
    moveUp: {
        icon: faCircleUp,
        variant: "outline-secondary",
        tooltipKey: "moveUp",
        testId: "btn_moveUp",
        ariaLabel: "move up",
    },
    moveDown: {
        icon: faCircleDown,
        variant: "outline-secondary ",
        tooltipKey: "moveDown",
        testId: "btn_moveDown",
        ariaLabel: "move down",
    },
    open: {
        icon: faArrowUpRightFromSquare,
        variant: "outline-secondary",
        tooltipKey: "open",
        testId: "btn_open",
        ariaLabel: "open",
    },
    delete: {
        icon: faTrash,
        variant: "outline-danger",
        tooltipKey: "delete",
        testId: "btn_delete",
        ariaLabel: "delete",
    },
    reactivate: {
        icon: faEye,
        variant: "outline-secondary",
        tooltipKey: "reactivate",
        testId: "btn_reactivate",
        ariaLabel: "reactivate",
    },
    deactivate: {
        icon: faEyeSlash,
        variant: "outline-secondary",
        tooltipKey: "deactivate",
        testId: "btn_deactivate",
        ariaLabel: "deactivate",
    },
    save: {
        icon: faCheck,
        variant: "outline-success",
        tooltipKey: "save",
        testId: "btn_save",
        ariaLabel: "save",
    },
    startInspection: {
        icon: faCirclePlay,
        variant: "outline-success",
        tooltipKey: "startInspection",
        testId: "btn_start",
        ariaLabel: "start inspection",
    },
}
export const TooltipActionButton = ({ onClick, disabled, variantKey, testId, buttonClass, iconClass, buttonSize }: SimplePropType) => {
    const t = useScopedI18n("common.actions");
    const variant = Variants[variantKey];
    if (!variant) {
        throw new Error(`Variant ${variantKey} not found`);
    }

    const translation = t(variant.tooltipKey);
    const isMobile = false;

    return (
        <OverlayTrigger
            delay={{ show: 500, hide: 150 }}
            overlay={
                <Tooltip className="d-none d-lg-inline">{translation}</Tooltip>
            }
            rootClose={disabled}
        >
            <Button
                data-testid={testId ?? variant.testId}
                type={"button"}
                variant={variant.variant}
                className={`border-0 align-self-center ${buttonClass}`}
                onClick={onClick}
                disabled={disabled}
                size={(!buttonSize) ? "sm" : buttonSize == "lg" ? "lg" : undefined}
                aria-label={variant.ariaLabel}
            >
                <FontAwesomeIcon icon={variant.icon} className={iconClass} size={isMobile ? "lg" : undefined} />
            </Button>
        </OverlayTrigger>
    )
}
export default TooltipIconButton;
