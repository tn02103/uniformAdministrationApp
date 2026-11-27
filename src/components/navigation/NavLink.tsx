import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useGlobalData } from "../globalDataProvider";
import styles from "./NavItems.module.css";
import { useSidebarContext } from "./Sidebar";
import { NavbarLink } from "./SidebarTypes";

export type NavLinkProps = {
    text: string;
    onNavigation?: (key: string) => void;
} & ({
    item: Omit<NavbarLink, "icon">;
    level: 2;
} | {
    item: NavbarLink;
    level?: 1;
})

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
                aria-label={collapsed ? "openNavbar" : text}
                aria-hidden={collapsed && level === 2}
            >
                <Link
                    data-testid={`lnk_nav_${item.key}`}
                    href={`/${locale}/app/${item.href}`}
                    className={"stretched-link " + styles.navLink}
                    style={{ overflow: "hidden" }}
                    onClick={handleClick}
                >
                    {level !== 2 && item.icon &&
                        <FontAwesomeIcon size="xl" icon={item.icon} width={20} className={collapsed ? "" : "pe-2"} />
                    }
                    <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.0s" }} className={styles.navLinkText}>
                        {text}
                    </p>
                </Link>
            </li>
        </OverlayTrigger>
    )
}

export default NavLink;
