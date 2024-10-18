
import { getPlannedInspectionList } from "@/actions/controllers/PlannedInspectionController";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTable from "./_planned/plannedTable";
import { getPersonnelNameList } from "@/actions/controllers/CadetController";


export default async function InspectionAdministrationPage() {
    const plannedInspections = await getPlannedInspectionList();

    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h2 data-testid="div_cadetListHeader" className="text-center">Geplannte Kontrollen</h2>
            </div>
            <Row className="p-4 justify-content-center">
                <Col xs={10}>
                    <PlannedInspectionTable inspections={plannedInspections} cadets={await getPersonnelNameList()} />
                </Col>
            </Row>
        </div>
    );
}