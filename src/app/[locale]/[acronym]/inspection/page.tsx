import { getPersonnelNameList } from "@/dal/cadet/getNameList";
import { getPlannedInspectionList } from "@/dal/inspection/planned/get";
import { getScopedI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTable from "./_planned/plannedTable";
import Title from "@/components/Title";

export async function generateMetadata() {
    const t = await getScopedI18n('pageTitles');
    return {
        title: t('inspection'),
    }
}
export default async function InspectionAdministrationPage() {
    const [nameList, plannedInspections, t] = await Promise.all([
        getPersonnelNameList(),
        getPlannedInspectionList(),
        getScopedI18n('inspection')
    ]);

    return (
        <div className="container-lg content-center rounded px-md-3 px-xl-5 p-0">
            <Title text={t('header.planned')} />
            <Row className="p-4 justify-content-center">
                <Col xs={12}>
                    <PlannedInspectionTable inspections={plannedInspections} cadets={nameList} />
                </Col>
            </Row>
        </div>
    );
}
