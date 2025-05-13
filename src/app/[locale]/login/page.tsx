import { prisma } from "@/lib/db";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import LoginForm from "./loginForm";
import styles from "./Page.module.css";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('login'),
    }
}

export const dynamic = "force-dynamic";
const LoginPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;

    setStaticParamsLocale(locale);
    const t = await getI18n();
    const assosiations = await prisma.assosiation.findMany();

    return (
        <div className={styles.loginCard}>
            <div className={"bg-body-secondary p-3 rounded " }>
                <h2>{t('login.header')}</h2>
                <LoginForm assosiations={assosiations} />
            </div>
        </div>
    )
}

export default LoginPage;
