import { AuthRole } from "@/lib/AuthRoles";
import { getIronSession } from "@/lib/ironSession";
import { getScopedI18n } from "@/lib/locales/config";
import { ReactNode } from "react";

/**
 * Generates metadata for the admin settings page.
 */
export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('admin.settings'),
    };
}

export default async function Layout({ children }: { children: ReactNode }) {
    const { user } = await getIronSession();
    if (!user || user.role < AuthRole.admin) {
        // TODO rewrite to 403 Page
        return (
            <div data-testid="div_403Page">
                403 Not Authorized
            </div>
        );
    }

    return children;
}
