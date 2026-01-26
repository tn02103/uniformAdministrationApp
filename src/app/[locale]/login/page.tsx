"use server";

import { getDeviceAccountFromCookies } from "@/dal/auth/helper";
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./loginForm";
import styles from "./Page.module.css";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('login'),
    }
}

const LoginPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    setStaticParamsLocale(locale);

    const session = await getIronSession();
    if (session.user) {
        // User is already logged in, redirect to their app home
        return redirect(`/${locale}/app/`);
    }

    const [t, organisations, cookieList] = await Promise.all([
        getI18n(),
        prisma.organisation.findMany(),
        cookies()
    ]);

    const { accountCookie } = getDeviceAccountFromCookies({ cookieList });
    const accountOrganisationId = accountCookie?.lastUsed?.organisationId;
    const lastUsedOrganisationId = (accountOrganisationId && organisations.find(o => o.id === accountOrganisationId))
        ? accountOrganisationId : undefined;
    const tryRefreshToken = !!(lastUsedOrganisationId && await prisma.refreshToken.findFirst({
        where: {
            deviceId: accountCookie?.lastUsed.deviceId,
            status: "active",
            endOfLife: { gt: new Date() }
        }
    }));

    return (
        <div className={styles.loginCard}>
            <div className={"bg-body-secondary p-3 rounded "}>
                <h2>{t('login.header')}</h2>
                <LoginForm
                    organisations={organisations}
                    lastUsedOrganisationId={lastUsedOrganisationId}
                    tryRefreshToken={tryRefreshToken}
                />
            </div>
        </div>
    );
}

export default LoginPage;
