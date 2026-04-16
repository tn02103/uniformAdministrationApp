"use server";

import { getIronSession } from "@/lib/ironSession";
import { getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";
import styles from "../login/Page.module.css";

/**
 * Server page that enforces a required password change.
 *
 * Guards:
 * - No session / no user → redirect to `/{locale}/login`
 * - `changePasswordOnLogin` is not set → redirect to `/{locale}/app` (nothing to do)
 *
 * @param params - Route params containing `locale`.
 */
const ChangePasswordPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale } = await params;
    setStaticParamsLocale(locale);

    const session = await getIronSession();

    if (!session.user) {
        redirect(`/${locale}/login`);
    }

    if (session.user.changePasswordOnLogin !== true) {
        redirect(`/${locale}/app`);
    }

    const t = await getScopedI18n("forcedPasswordChange");

    return (
        <div className={styles.loginCard}>
            <div className="bg-body-secondary p-3 rounded">
                <h2>{t("header")}</h2>
                <p>{t("description")}</p>
                <ChangePasswordForm locale={locale} />
            </div>
        </div>
    );
};

export default ChangePasswordPage;
