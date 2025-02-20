import { AuthRole } from "@/lib/AuthRoles";

declare global {
    var __ROLE__: AuthRole | undefined;
    var __ASSOSIATION__: string | undefined;
}
