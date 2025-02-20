import { getUserList } from "@/actions/controllers/UserController";
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import UserAdminTable from "./table";

export const dynamic = 'auto';
export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('admin.user'),
    }
}

export default async function UserAdminPage() {
    const t = await getI18n();
    const users = await getUserList();

    return (
        <div className="container-lg content-center rounded p-0 pt-2 position-relative">
            <h1 className="text-center">{t('admin.user.header.page')}</h1>
            <Row className="justify-content-center m-0">
                <Col xs={12} xl={10} className="p-0 p-md-4">
                    <UserAdminTable userList={users} />
                </Col>
            </Row>
        </div>
    )
}
