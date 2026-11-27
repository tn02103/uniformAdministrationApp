import { AuthRole } from "@/lib/AuthRoles";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

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