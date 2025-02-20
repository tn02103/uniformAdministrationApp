import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AuthRole } from "../../lib/AuthRoles";
import { useGlobalData } from "../globalDataProvider";

type NavGroupProps = {
    title: string;
    icon: IconProp;
    childSelected: boolean;
    collapsed: boolean;
    requiredRole: AuthRole;
    setCollapsed: (value: boolean) => void;
    children: ReactElement | ReactElement[];
    testId: string;
}
const NavGroup = ({ title, icon, childSelected, collapsed, setCollapsed, children, requiredRole, testId }: NavGroupProps) => {
    const [showChildren, setShowChilden] = useState<boolean>();
    const { userRole } = useGlobalData();

    useEffect(() => {
        if (collapsed && showChildren) {
            setShowChilden(false);
        }
    }, [collapsed])

    function onHeaderClicked() {
        if (showChildren) {
            setShowChilden(false);
        } else {
            setShowChilden(true);

            if (collapsed) {
                setCollapsed(false);
            }
        }
    }

    if (userRole < requiredRole) {
        return <></>;
    }

    return (
        <OverlayTrigger
            show={collapsed ? undefined : false}
            delay={{ show: 250, hide: 0 }}
            overlay={
                <Tooltip>{title}</Tooltip>
            }
        >
            <li className="list-group-item rounded mb-1 w-100">
                <button data-testid={testId}
                    className={`btn text-white d-flex w-100 px-2 py-1
                        ${collapsed ? "justify-content-center" : "justify-content-between"}
                        ${childSelected ? (showChildren ? "" : "bg-primary") : ""}`}
                    onClick={onHeaderClicked}>
                    <div>
                        <FontAwesomeIcon icon={icon} width={20} size="lg" className={` ${collapsed ? "" : "pe-2"}`} />
                        {!collapsed && title}
                    </div>
                    <div>
                        {!collapsed &&
                            < FontAwesomeIcon icon={showChildren ? faAngleUp : faAngleDown} size="sm" className="align-end me-1 ms-2" />
                        }
                    </div>
                </button>
                <ul className="p-0 mx-3">
                    {showChildren &&
                        children
                    }
                </ul>
            </li>
        </OverlayTrigger>
    );
}

export default NavGroup;
