import { headers } from "next/headers";
import { AuthRole } from "./AuthRoles";
import { auth } from "./auth";

export type IronSessionUser = {
    name: string;
    username: string;
    assosiation: string;
    acronym: string;
    role: AuthRole;
}

/**
 * Reads the current better-auth session and returns it in the shape that
 * existing server actions expect (`{ user?: IronSessionUser }`).
 *
 * The username is recovered by stripping the "@assosiationId" suffix from the
 * synthetic email value stored in the better-auth user record.
 */
export const getIronSession = async (): Promise<{ user?: IronSessionUser; destroy: () => Promise<void> }> => {
    const session = await auth.api.getSession({ headers: await headers() });

    const destroy = async () => {
        // Sign-out is handled via the better-auth client; this is a no-op shim
        // so existing server-action code that calls session.destroy() continues
        // to compile.
    };

    if (!session?.user) {
        return { destroy };
    }

    const { user } = session;

    // Recover the short username from the synthetic email "username@assosiationId"
    const atIndex = user.email.indexOf("@");
    const username = atIndex > 0 ? user.email.slice(0, atIndex) : user.email;

    return {
        user: {
            name: user.name,
            username,
            assosiation: (user as unknown as { assosiationId: string }).assosiationId,
            acronym: (user as unknown as { acronym: string }).acronym,
            role: (user as unknown as { numericRole: number }).numericRole as AuthRole,
        },
        destroy,
    };
};

