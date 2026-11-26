import { AuthRole } from "@/lib/AuthRoles";
import { faUser, faShirt, faClipboardCheck, faGear, faChartLine, faLink } from "@fortawesome/free-solid-svg-icons";
import { NavbarLink, NavbarGroup } from "./SidebarTypes";

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