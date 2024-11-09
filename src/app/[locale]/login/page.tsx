import { prisma } from "@/lib/db";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import { Col, Row } from "react-bootstrap";
import LoginForm from "./loginForm";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles')
    return {
        title: t('login'),
    }
}

export const dynamic = "force-dynamic";
const LoginPage = async ({ params: { locale } }: { params: { locale: string } }) => {
    setStaticParamsLocale(locale);
    const t = await getI18n();
    const assosiations = await prisma.assosiation.findMany();

    return (
        <div>
            <Row className="justify-content-center">
                <Col xs={"auto"} className="bg-body-secondary p-3 rounded">
                    <h2>{t('login.header')}</h2>
                    <LoginForm assosiations={assosiations} />
                </Col>
            </Row>
        </div>
    )
}

export default LoginPage;
