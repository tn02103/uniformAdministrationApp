
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import DefTypeAdminTable from "./table";
import { getDeficiencyAdmintypeList } from "@/actions/controllers/DeficiencyTypeController";
import Title from "@/components/Title";


export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('admin.deficiency'),
    }
}
export default async function DeficiencyAdministrationPage() {
    const t = await getI18n();


    return (
        <div className="container-lg content-center rounded p-0 position-relative">
            <Title text={t('admin.deficiency.header.page')}/>
            <Row className="justify-content-center m-0">
                <Col xs={12} xl={10} xxl={8} className="p-0 p-md-4">
                    <div className="overflow-x-auto">
                        <DefTypeAdminTable typeList={await getDeficiencyAdmintypeList()} />
                    </div>
                </Col>
            </Row>
        </div>
    )
}