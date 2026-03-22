"use server";

import { RateLimiterMemory } from "rate-limiter-flexible";
import { getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getIPAddress } from "@/dal/auth/helper";
import { validatePasswordResetToken } from "@/dal/auth/passwordReset/validateResetToken";
import Link from "next/link";
import ResetPasswordForm from "./_ResetPasswordForm";
import styles from "../login/Page.module.css";

const ipLimiter = new RateLimiterMemory({
    points: 10,
    duration: 15 * 60, // 15 minutes
});

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

    const headerList = await headers();
    const ipAddress = getIPAddress(headerList);
    const agent = userAgent({ headers: headerList });

    // Rate-limit page loads by IP to prevent brute-forcing tokens via repeated page requests
    try {
        await ipLimiter.consume(ipAddress, 1);
    } catch {
        console.warn("reset-password page: rate limit exceeded", { ipAddress });
        return (
            <div className={styles.loginCard}>
                <div className="bg-body-secondary p-3 rounded">
                    <p className="text-danger">{t("error.tooManyRequests")}</p>
                </div>
            </div>
        );
    }

    const validation = await validatePasswordResetToken(token, { ipAddress, userAgent: agent });
    if (!validation.valid) {
        return (
            <div className={styles.loginCard}>
                <div className="bg-body-secondary p-3 rounded">
                    <p className="text-danger">{t("error.tokenInvalid")}</p>
                    <Link href={`/${locale}/forgot-password`}>{t("label.requestNewLink")}</Link>
                </div>
            </div>
        );
    }

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
