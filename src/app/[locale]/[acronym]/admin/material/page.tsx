
import { getI18n, getScopedI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import MaterialConfigGroupDetail from "./groupDetail";
import MaterialConfigGroupList from "./groupList";
import MaterialConfigTypeList from "./typeList";
import { getMaterialAdministrationConfiguration } from "@/dal/material/type/_index";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('admin.material'),
    }
}
export default async function AdminMaterialPage() {
    const t = await getI18n();
    const config = await getMaterialAdministrationConfiguration();

    return (
        <div className="container-xxl content-center bg-light rounded">
            <h1 className="text-center">
                {t('admin.material.header.page')}
            </h1>
            {config?.filter(g => g.typeList.length === 0).map(group => (
                <div className="text-danger text-center" key={group.id}>
                    {t('admin.material.error.missingTypes', { group: group.description })}
                </div>
            ))}
            <Row className="justify-content-center">
                <Col xs={12} sm={8} md={6} lg={5} xl={3} className="p-0 my-2 px-md-2">
                    <MaterialConfigGroupList config={config} />
                </Col>
                <Col xs={12} sm={8} md={6} lg={5} xl={4} className="p-0 my-2 px-md-2">
                    <MaterialConfigGroupDetail config={config} />
                </Col>
                <Col xs={12} md={8} lg={6} xl={5} className="p-0 my-2 px-md-2">
                    <MaterialConfigTypeList config={config} />
                </Col>
            </Row>
        </div>
    )
};
