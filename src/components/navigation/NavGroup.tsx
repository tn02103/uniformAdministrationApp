import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactElement, useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AuthRole } from "../../lib/AuthRoles";
import { useGlobalData } from "../globalDataProvider";
import { useSidebarContext } from "./Sidebar";

type NavGroupProps = {
    title: string;
    icon: IconProp;
    childSelected: boolean;
    requiredRole: AuthRole;
    children: ReactElement;
    testId: string;
}
const NavGroup = ({ title, icon, childSelected, children, requiredRole, testId }: NavGroupProps) => {
    const [showChildren, setShowChilden] = useState<boolean>();
    const { userRole } = useGlobalData();
    const { collapsed, setCollapsed } = useSidebarContext();

    useEffect(() => {
        if (collapsed) {
            setShowChilden(false);
        } else if (!collapsed && childSelected) {
            setShowChilden(true);
        }
    }, [collapsed, childSelected])

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
            <li className="list-group-item rounded my-1 w-100" style={{ transition: "1s ease-in-out" }}>
                <button data-testid={testId}
                    className={`btn text-white d-flex  w-100 m-0 px-2 py-1 fs-6 overflow-hidden d-flex flex-row 
                        ${collapsed ? "justify-content-between" : "justify-content-between"}
                        ${childSelected ? (showChildren ? "fw-bold" : "fw-bold bg-primary") : ""}`}
                    onClick={onHeaderClicked}
                    style={{ transition: "justify-content 1s ease-in-out", transitionDelay: "0.3s" }}
                    type="button"
                >
                    <div className="d-flex flex-row align-items-start">
                        <FontAwesomeIcon icon={icon} width={20} size="xl" className={` ${collapsed ? "" : "pe-2"}`} />
                        <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.3s" }} className="p-0 m-0">
                            {!collapsed && title}
                        </p>
                    </div>
                    <div>
                        {!collapsed &&
                            < FontAwesomeIcon icon={showChildren ? faAngleUp : faAngleDown} size="sm" className="align-end me-1 ms-3" />
                        }
                    </div>
                </button>
                {showChildren &&
                    children
                }
            </li>
        </OverlayTrigger>
    );
}

export default NavGroup;
