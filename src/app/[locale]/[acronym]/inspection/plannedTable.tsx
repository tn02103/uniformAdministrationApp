"use client";

import { PlannedInspectionType, updateCadetRegistrationForInspection } from "@/actions/controllers/PlannedInspectionController";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { CadetLabel } from "@/types/globalCadetTypes";
import { faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, Col, Form, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import PlannedInspectionTableRow from "./plannedRow";
import { format } from "path";
import { formatDate } from "date-fns";
import dayjs from "dayjs";
import DeregistrationModal from "./deregistrationModal";

export default function PlannedInspectionTable({
    ...props
}: {
    inspections: PlannedInspectionType[],
    cadets: CadetLabel[]
}) {
    const [deragistrationModalInspectionId, setDeregistrationModalInspectionId] = useState<string | null>(null);
    console.log("🚀 ~ deragistrationModalInspectionId:", deragistrationModalInspectionId)

    const [showNewLine, setShowNewLine] = useState(false);
    const { inspectionList } = usePlannedInspectionList(props.inspections);
    console.log("🚀 ~ inspectionList:", inspectionList)


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
                <PlannedInspectionTableRow inspection={insp} key={insp.id} openDeregistrationModal={setDeregistrationModalInspectionId} />
            ))}
            {(inspectionList?.length === 0) &&
                <Row data-testid="div_noData">
                    Keine Inspektionen geplannt
                </Row>
            }
            {deragistrationModalInspectionId && inspectionList?.find(i => i.id === deragistrationModalInspectionId) &&
                <DeregistrationModal
                    inspection={inspectionList?.find(i => i.id === deragistrationModalInspectionId)!}
                    cadetList={props.cadets}
                    onHide={() => setDeregistrationModalInspectionId(null)} />
            }
        </div >
    )
}
