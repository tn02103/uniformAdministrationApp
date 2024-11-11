import { getPersonnelNameList } from "@/dal/cadet/getNameList";
import { getPlannedInspectionList } from "@/dal/inspection/planned/get";
import { getScopedI18n } from "@/lib/locales/config";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTable from "./_planned/plannedTable";

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
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h2 data-testid="div_cadetListHeader" className="text-center">{t('header.planned')}</h2>
            </div>
            <Row className="p-4 justify-content-center">
                <Col xs={12}>
                    <PlannedInspectionTable inspections={plannedInspections} cadets={nameList} />
                </Col>
            </Row>
        </div>
    );
}
