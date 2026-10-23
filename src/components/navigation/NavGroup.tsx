import { useScopedI18n } from "@/lib/locales/client";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import { useGlobalData } from "../globalDataProvider";
import NavLink from "./NavLink";
import { useSidebarContext } from "./Sidebar";
import { NavbarGroup } from "./SidebarLinks";
import styles from "./Sidebar.module.css";

type ItemConfig = {
    lastSelectedItem: string | null;
}
const defaultItemConfig: ItemConfig = {
    lastSelectedItem: null,
};

type NavGroupProps = {
    title: string;
    item: NavbarGroup;
}
const NavGroup = ({ title, item }: NavGroupProps) => {
    const t = (useScopedI18n as Function)(`sidebar.links.${item.key}`);
    const [showChildren, setShowChilden] = useState<boolean>();
    const dropdownArrow = useRef<HTMLDivElement>(null);
    const { userRole } = useGlobalData();
    const { collapsed, setCollapsed } = useSidebarContext();
    const [itemConfig, setItemConfig] = useSessionStorage<ItemConfig>(`"Navbar-Group"-${item.key}`, defaultItemConfig);
    const [isTouchEvent, setIsTouchEvent] = useState<boolean>(false);


    const router = useRouter();
    const pathname = usePathname();

    const { locale } = useParams();

    const isChildSelected = useMemo(() => item.links.some(subLink => subLink.isRoute(pathname)), [item.links, pathname]);

    useEffect(() => {
        if (!isChildSelected) {
            setShowChilden(false);
        }
    }, [isChildSelected, pathname]);

    useEffect(() => {
        if (collapsed) {
            setShowChilden(false);
        } else if (!collapsed && isChildSelected) {
            setShowChilden(true);
        }
    }, [collapsed, isChildSelected])

    const getTargetItem = useCallback(() => {
        const itemKeyToSelect = itemConfig.lastSelectedItem ?? item.links.find(subLink => subLink.defaultLink)?.key;
        if (itemKeyToSelect) {
            const itemToSelect = item.links.find(subLink => subLink.key === itemKeyToSelect);
            if (itemToSelect) {
                return itemToSelect;
            }
        }
        return item.links[0];
    }, [itemConfig, item.links]);

    const onHeaderMouseEnter = useCallback(() => {
        if (!isChildSelected) {
            const itemToSelect = getTargetItem();
            if (itemToSelect) {
                router.prefetch(`/${locale}/app/${itemToSelect.href}`);
            }
        }
    }, [isChildSelected, getTargetItem, router, locale]);

    const onHeaderClicked = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        if (showChildren) {
            setShowChilden(false);
        } else {
            setShowChilden(true);

            if (collapsed) {
                setCollapsed(false);
            }

            if (isTouchEvent)
                return;


            const relatedTarget = e.target;

            if ((relatedTarget instanceof Node) && dropdownArrow.current && !dropdownArrow.current.contains(relatedTarget)) {
                const itemToSelect = getTargetItem();
                if (itemToSelect) {
                    router.push(`/${locale}/app/${itemToSelect.href}`);
                }
            }
        }
    }, [showChildren, setShowChilden, collapsed, setCollapsed, isTouchEvent, itemConfig, getTargetItem, router, locale]);


    const onChildNavigation = useCallback((key: string) => {
        setItemConfig(prev => ({ ...prev, lastSelectedItem: key }));
    }, [setItemConfig]);

    if (userRole < item.requiredRole) {
        return <></>;
    }
    const backgroundColor = showChildren ? isChildSelected ? "#0347CE" : "#022874" : undefined;


    return (
        <OverlayTrigger
            show={collapsed ? undefined : false}
            delay={{ show: 250, hide: 0 }}
            overlay={
                <Tooltip>{title}</Tooltip>
            }
        >
            <li className="list-group-item rounded my-1 w-100" style={{ /*transition: "1s ease-in-out",*/ backgroundColor: backgroundColor }}>
                <button data-testid={`btn_nav_${item.key}_group`}
                    className={`btn text-white w-100 m-0 px-2 py-1 fs-6 overflow-hidden d-flex flex-row justify-content-between
                        ${isChildSelected ? (showChildren ? "fw-bold" : "fw-bold bg-primary") : ""}`}
                    onClick={onHeaderClicked}
                    onMouseEnter={onHeaderMouseEnter}
                    onTouchStart={() => setIsTouchEvent(true) }
                    onTouchEnd={() => setTimeout(() => setIsTouchEvent(false), 0)}
                    style={{ transition: "justify-content 1s ease-in-out", transitionDelay: "0.0s" }}
                    type="button"
                >
                    <div className="d-flex flex-row align-items-start">
                        <FontAwesomeIcon icon={item.icon} width={20} size="xl" className={` ${collapsed ? "" : "pe-2"}`} />
                        <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.0s" }} className="p-0 m-0">
                            {!collapsed && title}
                        </p>
                    </div>
                    <div ref={dropdownArrow} >
                        {!collapsed &&
                            <FontAwesomeIcon icon={showChildren ? faAngleUp : faAngleDown} size="sm" className={`align-end p-1 ${styles.navGroupArrow}`} />
                        }
                    </div>
                </button>
                <ul className={showChildren ? "d-block" : "d-none"}>
                    {item.links.map((subLink) => (
                        <NavLink
                            key={subLink.key}
                            item={subLink}
                            text={(t as Function)(subLink.key)}
                            level={2}
                            onNavigation={onChildNavigation} />
                    ))}
                </ul>
            </li>
        </OverlayTrigger>
    );
}

export default NavGroup;
