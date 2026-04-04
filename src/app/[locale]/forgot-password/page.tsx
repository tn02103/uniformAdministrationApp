"use server";

import { prisma } from "@/lib/db";
import { getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import ForgotPasswordForm from "./_ForgotPasswordForm";
import styles from "../login/Page.module.css";


const ForgotPasswordPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    setStaticParamsLocale(locale);

    const [t, organisations] = await Promise.all([
        getScopedI18n("forgotPassword"),
        prisma.organisation.findMany(),
    ]);

    return (
        <div className={styles.loginCard}>
            <div className="bg-body-secondary p-3 rounded">
                <h2>{t("header")}</h2>
                <ForgotPasswordForm organisations={organisations} />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
