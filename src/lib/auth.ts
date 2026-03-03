import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { organization } from "better-auth/plugins/organization";
import { AuthRole } from "./AuthRoles";
import { prisma } from "./db";

/**
 * Better-auth server configuration.
 *
 * Key design decisions:
 * - `disableSignUp` is set to `true` – users can only be created by an
 *   organisation admin, never through public self-registration.
 * - The `user.email` field stores a synthetic value in the form
 *   `{username}@{assosiationId}` so that usernames remain unique within an
 *   organisation while satisfying better-auth's global-uniqueness requirement.
 * - `additionalFields` expose the organisation context and application role in
 *   every session, removing the need for extra database round-trips in server
 *   actions.
 * - The organisation plugin ensures users can only operate within their own
 *   organisation; the admin plugin lets organisation admins manage all users.
 */
export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),

    /** Secret used to sign session tokens.  Must be ≥ 32 chars. */
    secret: process.env.BETTER_AUTH_SECRET,

    /** Base URL of the application (e.g. https://example.com) */
    baseURL: process.env.BETTER_AUTH_URL,

    // ── Custom model names (Prisma models prefixed with "Ba" to avoid
    //    clashing with the existing application User / Session tables) ──────
    user: {
        modelName: "BaUser",
        additionalFields: {
            assosiationId: {
                type: "string",
                required: true,
                returned: true,
            },
            acronym: {
                type: "string",
                required: true,
                returned: true,
            },
            numericRole: {
                type: "number",
                required: true,
                defaultValue: AuthRole.user,
                returned: true,
            },
            active: {
                type: "boolean",
                required: true,
                defaultValue: true,
                returned: true,
            },
        },
    },
    session: {
        modelName: "BaSession",
        /** 6 hours – matches the existing iron-session TTL */
        expiresIn: 6 * 60 * 60,
    },
    account: {
        modelName: "BaAccount",
    },
    verification: {
        modelName: "BaVerification",
    },

    // ── Email / password auth ──────────────────────────────────────────────
    emailAndPassword: {
        enabled: true,
        /**
         * Disabling public sign-up enforces the requirement that every user
         * must be created by an organisation admin.  The admin plugin's
         * createUser endpoint is the only way to provision new accounts.
         */
        disableSignUp: true,
        autoSignIn: false,
    },

    // ── Plugins ───────────────────────────────────────────────────────────
    plugins: [
        /**
         * Organisation plugin – each Assosiation maps to one Better-Auth
         * organisation.  This ensures complete data isolation between
         * organisations and provides the membership/role infrastructure.
         */
        organization({
            schema: {
                organization: { modelName: "BaOrganization" },
                member: { modelName: "BaMember" },
                invitation: { modelName: "BaInvitation" },
            },
        }),
        /**
         * Admin plugin – grants organisation admins (role = "admin") the
         * ability to create, update, ban and delete users.  Combined with
         * `disableSignUp`, this fully satisfies the requirement that user
         * administration is organisation-centric.
         */
        admin({
            adminRoles: ["admin"],
            defaultRole: "user",
        }),
    ],

    // ── Security ──────────────────────────────────────────────────────────
    rateLimit: {
        enabled: true,
        window: 60,
        max: 10,
    },
});

export type Session = typeof auth.$Infer.Session;

