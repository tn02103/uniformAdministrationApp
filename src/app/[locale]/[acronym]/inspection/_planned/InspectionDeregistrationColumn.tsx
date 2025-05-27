import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import React from "react";
import { Col, OverlayTrigger } from "react-bootstrap";

export function InspectionDeregistrationColumn({ inspection, openOffcanvas }: { inspection: PlannedInspectionType, openOffcanvas: () => void }) {
    const t = useScopedI18n('inspection.planned.label')
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
            <Col xs={6} md={1} className="my-1">
                <a className="link-opacity-100 text-primary link-opacity-25-hover"
                    aria-label="open deregistration list"
                    role="button"
                    onClick={openOffcanvas}
                >
                    {inspection.deregistrations.length} <p className="m-0 d-inline d-md-none">{t('deregistrations')}</p>
                </a>
            </Col>
        </OverlayTrigger>
    )
}
