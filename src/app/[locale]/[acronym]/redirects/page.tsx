import { getRedirectsByOrganisation } from "@/dal/redirects";
import { getI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import { RedirectTable } from "./RedirectTable";

export default async function RedirectPage() {
    const t = await getI18n();
    const redirects = await getRedirectsByOrganisation();

    return (
        <div className="container-xl content-center bg-light rounded">
            <h1 className="text-center">
                {t('redirects.title')}
            </h1>
            <hr />
            <Row>
                <Col xs={12} md={11}>
                    <RedirectTable redirects={redirects} />
                </Col>
            </Row>
        </div>
    )
}
