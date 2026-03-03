"use client";

import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better-auth React client.
 *
 * Usage in client components:
 *   import { authClient } from "@/lib/authClient";
 *   await authClient.signIn.email({ email, password });
 *   await authClient.signOut();
 */
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    plugins: [
        organizationClient(),
        adminClient(),
    ],
});

export type AuthClientType = typeof authClient;
