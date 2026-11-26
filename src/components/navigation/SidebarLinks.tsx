import { useI18n } from "@/lib/locales/client";
import NavGroup from "./NavGroup";
import NavLink from "./NavLink";
import { NavbarLinkConfig } from "./SidebarConfig";
import styles from "./SidebarLinks.module.css";

export const SidebarLinks = () => {
    const t = useI18n();

    return (
        <div className={styles.sidebarNavigation}>
            <ul className="flex-column w-100 px-2" style={{ marginTop: '1rem' }}>
                {NavbarLinkConfig.map((item) => {
                    if ('links' in item) {
                        return (
                            <NavGroup
                                key={item.key}
                                title={(t as Function)(`sidebar.links.${item.key}.group`)}
                                item={item}
                            />
                        );
                    } else {
                        return (
                            <NavLink
                                key={item.key}
                                text={(t as Function)(`sidebar.links.${item.key}`)}
                                item={item}
                                level={1} />
                        );
                    }
                })}
            </ul>
        </div>
    );
}
