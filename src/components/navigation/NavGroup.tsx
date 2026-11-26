import { useScopedI18n } from "@/lib/locales/client";
import { faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLinkStatus } from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useSessionStorage } from "usehooks-ts";
import { useGlobalData } from "../globalDataProvider";
import styles from "./NavItems.module.css";
import NavLink from "./NavLink";
import { useSidebarContext } from "./Sidebar";
import { NavbarGroup } from "./SidebarTypes";

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
/**
 * Renders a navigation group with a title and child links.
 * The navigation group 
 * 
 * @param param0 The props object containing the title and item for the navigation group.
 * @returns The rendered navigation group component.
 */
const NavGroup = ({ title, item }: NavGroupProps) => {
    console.debug("🚀 ~ NavGroup ~ Render Start:", { title, item });
    const t = (useScopedI18n as Function)(`sidebar.links.${item.key}`);
    const dropdownArrow = useRef<HTMLButtonElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const { locale } = useParams();
    const { userRole } = useGlobalData();
    const { collapsed, setCollapsed } = useSidebarContext();
    const [itemConfig, setItemConfig] = useSessionStorage<ItemConfig>(`"Navbar-Group"-${item.key}`, defaultItemConfig);
    const linkStatus = useLinkStatus();
    console.debug("🚀 ~ NavGroup ~ linkStatus:", linkStatus);


    const [showChildren, setShowChilden] = useState<boolean>();
    console.debug("🚀 ~ NavGroup ~ showChildren:", showChildren);
    const [isTouchEvent, setIsTouchEvent] = useState<boolean>(false);
    console.debug("🚀 ~ NavGroup ~ isTouchEvent:", isTouchEvent);
    const isChildSelected = useMemo(() => item.links.some(subLink => subLink.isRoute(pathname)), [item.links, pathname]);
    console.debug("🚀 ~ NavGroup ~ isChildSelected:", isChildSelected)

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

    /**
     * Returns the target item to be navigated to based on the last selected item or the default link.
     * If neither last selected item nor default link is found, it returns the first link in the group.
     */
    const getTargetItem = useCallback(() => {
        const itemKeyToSelect = itemConfig.lastSelectedItem ?? item.links.find(subLink => subLink.defaultLink)?.key;
        console.debug("🚀 ~ NavGroup ~ itemConfig:", itemConfig)
        console.debug("🚀 ~ NavGroup ~ itemKeyToSelect:", itemKeyToSelect)
        if (itemKeyToSelect) {
            const itemToSelect = item.links.find(subLink => subLink.key === itemKeyToSelect);
            if (itemToSelect) {
                return itemToSelect;
            }
        }
        return item.links[0];
    }, [itemConfig, item.links]);

    /**
     * If no child is currently selected, prefetches the target item when the header group is hovered over.
     * This helps improve navigation performance by preloading the target page.
     * Without this some strange behaviour may occur when navigating to the target item. (jumping back to previous page)
     */
    const onHeaderGroupMouseEnter = useCallback(() => {
        console.debug("🚀 ~ NavGroup ~ onHeaderGroupMouseEnter ~ isChildSelected:", isChildSelected)
        if (!isChildSelected && !showChildren) {
            const itemToSelect = getTargetItem();
            if (itemToSelect) {
                router.prefetch(`/${locale}/app/${itemToSelect.href}`);
            }
        }
    }, [isChildSelected, showChildren, getTargetItem, router, locale]);

    /**
     * Handles the click event on the header group.
     * Toggles the visibility of child links and navigates to the target item if necessary.
     * Does not navigate for touch events (on mobile devices).
     */
    const onHeaderClicked = useCallback((onArrow: boolean) => {
        console.debug("🚀 ~ NavGroup ~ onHeaderClicked ~ showChildren:", showChildren)
        if (showChildren) {
            setShowChilden(false);
        } else {
            setShowChilden(true);

            console.debug("🚀 ~ NavGroup ~ onHeaderClicked ~ collapsed:", collapsed)
            if (collapsed) {
                setCollapsed(false);
            }

            if (isTouchEvent || isChildSelected)
                return;

            if (!onArrow) {
                const itemToSelect = getTargetItem();
                console.debug("🚀 ~ NavGroup ~ itemToSelect:", itemToSelect)
                if (itemToSelect) {
                    router.push(`/${locale}/app/${itemToSelect.href}`);
                }
            }
        }
    }, [showChildren, setShowChilden, collapsed, setCollapsed, isTouchEvent, itemConfig, getTargetItem, router, locale]);

    /**
     * Updates the last selected child item in the navigation group.
     */
    const onChildNavigation = useCallback((key: string) => {
        setItemConfig(prev => ({ ...prev, lastSelectedItem: key }));
    }, [setItemConfig]);

    if (userRole < item.requiredRole) {
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
            <li
                className={`list-group-item rounded my-1 w-100 ${styles.groupItem} ${isChildSelected ? styles.childSelected : ""} ${showChildren ? styles.showChildren : styles.hideChildren}`}
                aria-label={`Navigation Group - ${title}`}
            >
                <div className={`${styles.groupHeader} btn`}>
                    <button
                        className={" btn " + styles.headerBtn}
                        onClick={() => onHeaderClicked(false)}
                        onMouseEnter={onHeaderGroupMouseEnter}
                        onTouchStart={() => setIsTouchEvent(true)}
                        onTouchEnd={() => setTimeout(() => setIsTouchEvent(false), 0)}
                        type="button"
                        aria-label={`Navigation Group - ${title}`}
                    >
                        <FontAwesomeIcon icon={item.icon} width={20} size="xl" className={` ${collapsed ? "" : "pe-2"}`} />
                        <p style={{ visibility: collapsed ? "hidden" : "visible", transitionDelay: "0.0s" }} className="p-0 m-0">
                            {!collapsed && title}
                        </p>
                    </button>
                    <button
                        ref={dropdownArrow}
                        aria-label={showChildren ? "Collapse" : "Expand"}
                        aria-hidden={collapsed}
                        type="button"
                        className={`btn ${collapsed ? "d-none" : ""} ` + styles.navGroupArrow}
                        onClick={() => onHeaderClicked(true)}
                    >
                        {!collapsed &&
                            <FontAwesomeIcon icon={showChildren ? faAngleUp : faAngleDown} size="sm" className={`align-end p-1 `} />
                        }
                    </button>
                </div>
                <ul className={showChildren ? "d-block" : "d-none"} aria-label="Child Links" aria-hidden={!showChildren}>
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
