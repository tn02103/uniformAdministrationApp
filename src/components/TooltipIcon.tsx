import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OverlayTrigger, Tooltip } from "react-bootstrap";


export const TooltipIcon = ({ icon, tooltipText, className }: { icon: IconProp; tooltipText: string, className: string }) => {
    return (
        <OverlayTrigger
            overlay={<Tooltip id={`tooltip-${tooltipText}`}>{tooltipText}</Tooltip>}
             delay={{ show: 500, hide: 150 }}
        >
            <FontAwesomeIcon icon={icon} className={className} />
        </OverlayTrigger>
    );
}