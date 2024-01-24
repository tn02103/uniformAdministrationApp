"use client"
import { IconProp } from "@fortawesome/fontawesome-svg-core";
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
}

const TooltipIconButton = ({ icon, variant, tooltipText, testId, onClick, buttonSize, buttonClass, disabled, iconClass, buttonType }: PropType) => (
    <OverlayTrigger
        delay={{ show: 1000, hide: 150 }}
        overlay={
            <Tooltip>{tooltipText}</Tooltip>
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
        >
            <FontAwesomeIcon
                icon={icon}
                className={iconClass} />
        </Button>
    </OverlayTrigger>
)

export default TooltipIconButton;
