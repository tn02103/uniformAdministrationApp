
import { prisma } from "@/lib/db";
import { getIronSession } from "@/lib/ironSession";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTable from "./plannedTable";
import { PlannedInspectionType } from "@/actions/controllers/InspectionController";


export default async function InspectionAdministrationPage() {
    const session = await getIronSession();
    const plannedInspections = await prisma.inspection.findMany({
        where: {
            fk_assosiation: session.user?.assosiation,
            date: { gte: new Date() },
        },
        include: {
            deregistrations: true
        }
    });



    return (
        <div className="container-lg content-center bg-light rounded px-md-3 px-xl-5 p-0">
            <div className="row pt-2 pb-2 m-0">
                <h2 data-testid="div_cadetListHeader" className="text-center">Geplannte Kontrollen</h2>
            </div>
            <Row className="p-4 justify-content-center">
                <Col xs={10}>
                    <PlannedInspectionTable inspections={plannedInspections} />
                </Col>
            </Row>
        </div>
    )
}