"use client";

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetLabel } from "@/types/globalCadetTypes";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { DeregistrationOffcanvas } from "./DeregistrationOffcanvas";
import { PlannedInspectionTableRow } from "./PlannedInspectionTableRow";

export function PlannedInspectionTable({
    ...props
}: {
    inspections: PlannedInspectionType[],
    cadets: CadetLabel[]
}) {
    const t = useScopedI18n('inspection.planned.label')

    const [showNewLine, setShowNewLine] = useState(false);
    const { inspectionList } = usePlannedInspectionList(props.inspections);

    const [deregistrationOCInspectionId, setDeregistrationOCInspectionId] = useState<string | null>(null);
    const deregistrationOCInspection = inspectionList?.find(i => i.id === deregistrationOCInspectionId);

    return (
        <div data-testid="div_plannedTable">
            <Row className="bg-white border-bottom border-1 border-dark p-2 position-relative" role="row" aria-label="header">
                <Col md={2} className="fs-bold d-none d-md-grid">{t('state')}</Col>
                <Col md={3} className="fs-bold d-none d-md-grid">{t('date')}</Col>
                <Col md={3} className="fs-bold d-none d-md-grid">{t('name')}</Col>
                <Col md={1} className="fs-bold d-none d-md-grid">{t('deregistrations')}</Col>
                <Col md={1} className="fs-bold position-md-absolute end-0 text-end">
                    <TooltipActionButton variantKey="create" disabled={showNewLine} onClick={() => { setShowNewLine(true) }} />

                </Col>
            </Row>
            {showNewLine &&
                <PlannedInspectionTableRow inspection={null} closeNewLine={() => setShowNewLine(false)} />
            }
            {(inspectionList && inspectionList.length > 0) && inspectionList?.map((insp) => (
                <PlannedInspectionTableRow inspection={insp} key={insp.id} openDeregistrationOffcanvas={setDeregistrationOCInspectionId} />
            ))}
            {(inspectionList?.length === 0) &&
                <Row data-testid="div_noData">
                    {t('noInspections')}
                </Row>
            }
            {deregistrationOCInspection &&
                <DeregistrationOffcanvas
                    inspection={deregistrationOCInspection}
                    cadetList={props.cadets}
                    onClose={() => setDeregistrationOCInspectionId(null)} />
            }
        </div >
    )
}
