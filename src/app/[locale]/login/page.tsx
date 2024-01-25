import { prisma } from "@/lib/db"
import Head from "next/head";
import { Col, Row } from "react-bootstrap";
import LoginForm from "./loginForm";
import { setStaticParamsLocale } from "next-international/server";
import { getI18n, getStaticParams } from "@/lib/locales/config";



const LoginPage = async () => {

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
