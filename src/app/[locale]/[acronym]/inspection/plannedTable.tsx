"use client";
import { PlannedInspectionType } from "@/actions/controllers/InspectionController";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { Col, Row, Table } from "react-bootstrap";
import PlannedInspectionTableRow from "./plannedRow";
import { useState } from "react";

export default function PlannedInspectionTable({
    inspections
}: {
    inspections: PlannedInspectionType[]
}) {

    const [showNewLine, setShowNewLine] = useState(false);

    return (
        <div>
            <Row className="bg-white border-bottom border-1 border-dark p-2">
                <Col className="fs-bold">Status</Col>
                <Col className="fs-bold">Date</Col>
                <Col className="fs-bold">Name</Col>
                <Col className="fs-bold">Abgemeldet</Col>
                <Col className="fs-bold"><TooltipActionButton variantKey="create" onClick={() => { setShowNewLine(true) }} /></Col>
            </Row>
            {showNewLine &&
                <PlannedInspectionTableRow inspection={null} closeNewLine={() => setShowNewLine(false)} />
            }
            {inspections.map((insp) => (
                <PlannedInspectionTableRow inspection={insp} />
            ))}
        </div >
    )
}