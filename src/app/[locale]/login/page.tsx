import { prisma } from "@/lib/db"
import Head from "next/head";
import { Col, Row } from "react-bootstrap";
import LoginForm from "./loginForm";


const LoginPage = async () => {
    const assosiations = await prisma.assosiation.findMany();

    return (
        <div>
            <Head>
                <title>Login</title>
            </Head>
            <Row className="justify-content-center">
                <Col xs={"auto"} className="bg-body-secondary p-3 rounded">
                    <h2>Login</h2>
                    <LoginForm assosiations={assosiations} />
                </Col>
            </Row>
        </div>
    )
}

export default LoginPage;
