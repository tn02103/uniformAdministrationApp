import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locales/config";
import { setStaticParamsLocale } from "next-international/server";
import Head from "next/head";
import { Col, Row } from "react-bootstrap";
import LoginForm from "./loginForm";


export const dynamic = "force-dynamic";
const LoginPage = async ({ params: { locale } }: { params: { locale: string } }) => {
    setStaticParamsLocale(locale);
    const t = await getI18n();
    const assosiations = await prisma.assosiation.findMany();

    return (
        <div>
            <Head>
                <title>{t('login.header')}</title>
            </Head>
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
