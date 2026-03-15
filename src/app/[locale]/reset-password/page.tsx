"use server";

import { getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./_ResetPasswordForm";
import styles from "../login/Page.module.css";


const ResetPasswordPage = async ({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ token?: string }>;
}) => {
    const [{ locale }, { token }] = await Promise.all([params, searchParams]);
    setStaticParamsLocale(locale);

    if (!token) {
        redirect(`/${locale}/forgot-password`);
    }

    const t = await getScopedI18n("resetPassword");

    return (
        <div className={styles.loginCard}>
            <div className="bg-body-secondary p-3 rounded">
                <h2>{t("header")}</h2>
                <ResetPasswordForm token={token} locale={locale} />
            </div>
        </div>
    );
};

export default ResetPasswordPage;
