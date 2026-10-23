import { startInspection, stopInspection } from "@/dal/inspection";
import { useInspectionState } from "@/dataFetcher/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import dayjs from "@/lib/dayjs";
import { useI18n } from "@/lib/locales/client";
import { faChartLine, faClipboardCheck, faGear, faLink, faShirt, faUser, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { useModal } from "../modals/modalProvider";
import NavGroup from "./NavGroup";
import NavLink from "./NavLink";
import styles from "./SidebarLinks.module.css";
import { Button } from "react-bootstrap";
import { devLogger } from "@/dal/_helper/devLogger";

export type NavbarLink = {
    key: string,
    href: string,
    icon: IconDefinition,
    requiredRole: AuthRole,
    isRoute: (pathname: string) => boolean,
    defaultLink?: boolean;
}
export type NavbarGroup = {
    key: string,
    icon: IconDefinition,
    childSelected?: (pathname: string) => boolean,
    requiredRole: AuthRole,
    links: Omit<NavbarLink, "icon">[],
}

export const NavbarLinkConfig: (NavbarLink | NavbarGroup)[] = [
    {
        key: "members",
        icon: faUser,
        requiredRole: AuthRole.user,
        links: [
            {
                key: "overview",
                href: "/cadet",
                requiredRole: AuthRole.user,
                isRoute: (pathname) => /^\/\w{2}\/app\/cadet(\/)*(?!resignation)(?!new)([\w\d-]+)?$/.test(pathname),
            },
            {
                key: "create",
                href: "/cadet/new",
                requiredRole: AuthRole.inspector,
                isRoute: (pathname) => (/^\/\w{2}\/app\/cadet\/new/.test(pathname)),
            },
            {
                key: "resignation",
                href: "/cadet/resignation",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/cadet\/resignation.*/.test(pathname)),
            },
        ],
    },
    {
        key: "uniform",
        icon: faShirt,
        requiredRole: AuthRole.user,
        links: [
            {
                key: "overview",
                href: "/uniform/list",
                requiredRole: AuthRole.user,
                isRoute: (pathname) => (/^\/\w{2}\/app\/uniform\/list/.test(pathname)),
            },
            {
                key: "create",
                href: "/uniform/new",
                requiredRole: AuthRole.inspector,
                isRoute: (pathname) => (/^\/\w{2}\/app\/uniform\/new/.test(pathname)),
            },
            {
                key: "storage",
                href: "/uniform/storage",
                requiredRole: AuthRole.inspector,
                isRoute: (pathname) => (/^\/\w{2}\/app\/uniform\/storage/.test(pathname)),
            },
        ]
    },
    {
        key: "inspection",
        icon: faClipboardCheck,
        requiredRole: AuthRole.inspector,
        links: [
            {
                key: "inspection",
                href: "/inspection",
                requiredRole: AuthRole.inspector,
                isRoute: (pathname) => (/^\/\w{2}\/app\/inspection(\/)*$/.test(pathname)),
            },
            {
                key: "deficiencyType",
                href: "/inspection/deficiencyType",
                requiredRole: AuthRole.inspector,
                isRoute: (pathname) => (/^\/\w{2}\/app\/inspection\/deficiencyType/.test(pathname)),
            },
        ]
    },
    {
        key: "admin",
        icon: faGear,
        requiredRole: AuthRole.materialManager,
        links: [
            {
                key: "uniform",
                href: "/admin/uniform",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/admin\/uniform/.test(pathname)),
            },
            {
                key: "uniformSizes",
                href: "/admin/uniform/sizes",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/admin\/uniform\/sizes/.test(pathname)),
            },
            {
                key: "material",
                href: "/admin/material",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/admin\/material/.test(pathname)),
            },
            {
                key: "user",
                href: "/admin/user",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/admin\/user/.test(pathname)),
            },
            {
                key: "orgSettings",
                href: "/admin/settings",
                requiredRole: AuthRole.materialManager,
                isRoute: (pathname) => (/^\/\w{2}\/app\/admin\/settings/.test(pathname)),
            }
        ]
    },
    {
        key: "dashboard",
        icon: faChartLine,
        href: "/dashboard",
        requiredRole: AuthRole.materialManager,
        isRoute: (pathname) => (/^\/\w{2}\/app\/dashboard/.test(pathname)),
    },
    {
        key: "redirects",
        icon: faLink,
        href: "/redirects",
        requiredRole: AuthRole.materialManager,
        isRoute: (pathname) => (/^\/\w{2}\/app\/redirects/.test(pathname)),
    }
];


export const SidebarLinks = () => {
    const t = useI18n();
    const modal = useModal();
    const { inspectionState } = useInspectionState();

    const startStopInspection = useCallback(() => {
        const inspectionMutation = () => mutate((key: object | string) => ((typeof key === "string") && /^(\/api\/inspection\/status)|(\/api\/cadet\/[\w\d-]+\/inspection)$/));

        if (inspectionState?.active || inspectionState?.state === "unfinished") {
            modal?.simpleFormModal({
                header: t("sidebar.labels.stopInspection.header"),
                elementLabel: t("sidebar.labels.stopInspection.elementLabel"),
                inputPlaceholder: "13:05",
                elementValidation: {},
                defaultValue: {
                    input: inspectionState.active ? dayjs().format('HH:mm') : "",
                },
                type: "time",
                async save({ input }) {
                    stopInspection({
                        time: input,
                        id: inspectionState.id,
                    }).then(() => {
                        toast.success(t('sidebar.message.inspection.stop'));
                        inspectionMutation();
                    }).catch(() => {
                        toast.error(t('sidebar.message.inspection.stopError'));
                    });
                },
                abort() { },
            });
        } else {
            if (inspectionState?.state === "planned") {
                startInspection().then(() => {
                    toast.success(t("sidebar.message.inspection.start"));
                    inspectionMutation();
                }).catch(() => {
                    toast.error(t("sidebar.message.inspection.startError"));
                });
            }
        }
    }, [inspectionState, modal, t]);

    /*
    const navLog: any[] = [];
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = function (...args) {
        const entry = { type: 'push', url: args[2], time: new Date().toISOString(), stack: new Error().stack };
        navLog.push(entry);
        console.group('[nav] push → ' + args[2]);
        console.trace();
        console.groupEnd();
        return origPush(...args);
    };

    history.replaceState = function (...args) {
        const entry = { type: 'replace', url: args[2], time: new Date().toISOString(), stack: new Error().stack };
        navLog.push(entry);
        console.group('[nav] replace → ' + args[2]);
        console.trace();
        console.groupEnd();
        return origReplace(...args);
    };

    window.addEventListener('popstate', (e) => {
        navLog.push({ type: 'popstate', url: location.pathname, time: new Date().toISOString(), stack: new Error().stack });
        console.group('[nav] popstate → ' + location.pathname);
        console.trace();
        console.groupEnd();
    });
    // To dump the full log at any point: navLog
*/
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
