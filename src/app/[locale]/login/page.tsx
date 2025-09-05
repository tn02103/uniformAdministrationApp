import { getDeviceAccountFromCookies } from "@/dal/auth/helper";
import { prisma } from "@/lib/db";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import { cookies } from "next/headers";
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
    const { accountCookie } = getDeviceAccountFromCookies({ cookieList: await cookies() });
    const account = accountCookie?.lastUsed;

    setStaticParamsLocale(locale);
    const t = await getI18n();
    const organisations = await prisma.organisation.findMany();

    return (
        <div className={styles.loginCard}>
            <div className={"bg-body-secondary p-3 rounded "}>
                <h2>{t('login.header')}</h2>
                <LoginForm organisations={organisations} lastUsedOrganisationId={account?.organisationId} />
            </div>
        </div>
    )
}

export default LoginPage;
