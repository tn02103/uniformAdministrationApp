"use client";

import { PlannedInspectionType } from "@/actions/controllers/PlannedInspectionController";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTableRow from "./plannedRow";

export default function PlannedInspectionTable({
    ...props
}: {
    inspections: PlannedInspectionType[]
}) {

    const [showNewLine, setShowNewLine] = useState(false);
    const { inspectionList } = usePlannedInspectionList(props.inspections);


    return (
        <div data-testid="div_plannedTable">
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
            {(inspectionList && inspectionList.length > 0) && inspectionList?.map((insp) => (
                <PlannedInspectionTableRow inspection={insp} key={insp.id} />
            ))}
            {(inspectionList?.length === 0) &&
                <Row data-testid="div_noData">
                    Keine Inspektionen geplannt
                </Row>
            }
        </div >
    )
}