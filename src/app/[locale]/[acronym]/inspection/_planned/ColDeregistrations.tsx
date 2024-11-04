import { PlannedInspectionType } from "@/types/inspectionTypes";
import React from "react";
import { Col, OverlayTrigger } from "react-bootstrap";

export function DeragistrationCol({ inspection, openDeregistrationModal }: { inspection: PlannedInspectionType, openDeregistrationModal: () => void }) {

    return (
        <OverlayTrigger
            placement="bottom-start"
            delay={{ show: 1000, hide: 150 }}
            overlay={
                <span className="bg-white p-2 border border-1 border-gray">
                    {inspection.deregistrations.map(c => <React.Fragment key={c.fk_cadet}>{c.cadet.firstname} {c.cadet.lastname} <br /></React.Fragment>)}
                </span>
            }
        >
            <Col>
                <a className="link-opacity-100 text-primary link-opacity-25-hover" role="button" onClick={openDeregistrationModal}>
                    {inspection.deregistrations.length} VK
                </a>
            </Col>
        </OverlayTrigger>
    )
}
