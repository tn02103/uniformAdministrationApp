/* eslint-disable no-var */
import { AuthRole } from "@/lib/AuthRoles";

declare global {
    var __ROLE__: AuthRole | undefined;
    var __ASSOSIATION__: string | undefined;
    var __USERNAME__: string | undefined;
}
