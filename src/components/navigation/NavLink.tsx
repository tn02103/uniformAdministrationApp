import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { AuthRole } from "../../lib/AuthRoles";
import { useGlobalData } from "../globalDataProvider";

type NavLinkProps = {
    requiredRole: AuthRole;
    text: string;
    icon?: IconProp;
    href: string;
    isRoute: boolean;
    collapsed: boolean;
    level?: 1 | 2;
    testId: string;
}
const NavLink = ({ text, icon, isRoute, href, level, collapsed, requiredRole, testId }: NavLinkProps) => {
    const { userRole } = useGlobalData();

    if (userRole < requiredRole) {
        return <></>;
    }

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
                    ${collapsed ? "d-flex justify-content-center" : ""}
                    ${level ? (level == 2) ? "fs-6 fw-light" : "fs-6 my-1 " : "fs-6 my-1 "}`}>
                <Link data-testid={testId} href={href} className="stretched-link">
                    {icon &&
                        <FontAwesomeIcon size="xl" icon={icon} width={20} className={collapsed ? "" : "pe-2"} />
                    }
                    {!collapsed && text}
                </Link>
            </li>
        </OverlayTrigger>
    )
}

export default NavLink;
