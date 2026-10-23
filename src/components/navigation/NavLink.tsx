import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useParams } from "next/navigation";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useGlobalData } from "../globalDataProvider";
import { useSidebarContext } from "./Sidebar";
import { NavbarLink } from "./SidebarLinks";
import Link from "next/link";

type NavLinkProps = {
    item: Omit<NavbarLink, "icon"> & { icon?: IconProp };
    text: string;
    level?: 1 | 2;
    onNavigation?: (key: string) => void;
}
const NavLink = ({ item, text, level, onNavigation }: NavLinkProps) => {
    const { userRole } = useGlobalData();
    const { collapsed, isSidebarFixed, isMobile, setCollapsed } = useSidebarContext();
    const pathname = usePathname();
    const { locale } = useParams<{ locale: string }>();

    if (userRole < item.requiredRole) {
        return <></>;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!isMobile && collapsed && !isSidebarFixed) {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(false);
        } else {
            onNavigation?.(item.key);
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
                    ${item.isRoute(pathname) ? "fw-bold bg-primary" : ""} 
                    ${collapsed ? "d-flex justify-content-between" : ""}
                    ${(level === 2) ? "fs-6 fw-light" : "fs-6 my-1 "}`}
            >
                <Link
                    data-testid={`lnk_nav_${item.key}`}
                    href={`/${locale}/app/${item.href}`}
                    className="stretched-link d-flex flex-row"
                    style={{ overflow: "hidden" }}
                    onClick={handleClick}
                >
                    {item.icon &&
                        <FontAwesomeIcon size="xl" icon={item.icon} width={20} className={collapsed ? "" : "pe-2"} />
                    }
                    <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.0s" }} className="p-0 m-0">
                        {!collapsed && text}
                    </p>
                </Link>
            </li>
        </OverlayTrigger>
    )
}

export default NavLink;
