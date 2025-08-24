import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AuthRole } from "../../lib/AuthRoles";
import { useGlobalData } from "../globalDataProvider";
import { useSidebarContext } from "./Sidebar";

type NavLinkProps = {
    requiredRole: AuthRole;
    text: string;
    icon?: IconProp;
    href: string;
    isRoute: boolean;
    level?: 1 | 2;
    testId: string;
}
const NavLink = ({ text, icon, isRoute, href, level, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const { collapsed, isSidebarFixed, isMobile, setCollapsed } = useSidebarContext();

    if (userRole < requiredRole) {
        return <></>;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!isMobile && collapsed && !isSidebarFixed) {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(false);
        }
    };

    return (
        <OverlayTrigger
            show={collapsed ? undefined : false}
            delay={{ show: 250, hide: 0 }}
            overlay={
                <Tooltip>{text}</Tooltip>
            }
        >
            <li className={`list-group-item rounded px-2 py-1 w-100 fs-5 
                    ${isRoute ? "fw-bold bg-primary" : ""} 
                    ${collapsed ? "d-flex justify-content-between" : ""}
                    ${(level === 2) ? "fs-6 fw-light" : "fs-6 my-1 "}`}
                style={{ transition: "1s ease-in-out" }}
            >
                <Link data-testid={testId} href={href} className="stretched-link d-flex flex-row" style={{ overflow: "hidden" }} onClick={handleClick}>
                    {icon &&
                        <FontAwesomeIcon size="xl" icon={icon} width={20} className={collapsed ? "" : "pe-2"} />
                    }
                    <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.3s" }} className="p-0 m-0">
                        {!collapsed && text}
                    </p>
                </Link>
            </li>
        </OverlayTrigger>
    )
}

export default NavLink;
