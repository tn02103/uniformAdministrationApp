"use client";

import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetLabel } from "@/types/globalCadetTypes";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import PlannedInspectionTableRow from "./plannedRow";
import DeregistrationModal from "./DeregistrationModal";

export default function PlannedInspectionTable({
    ...props
}: {
    inspections: PlannedInspectionType[],
    cadets: CadetLabel[]
}) {
    const t = useScopedI18n('inspection.planned.label')
    const [deragistrationModalInspectionId, setDeregistrationModalInspectionId] = useState<string | null>(null);

    const [showNewLine, setShowNewLine] = useState(false);
    const { inspectionList } = usePlannedInspectionList(props.inspections);


    return (
        <div data-testid="div_plannedTable">
            <Row className="bg-white border-bottom border-1 border-dark p-2 position-relative">
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
                <PlannedInspectionTableRow inspection={insp} key={insp.id} openDeregistrationModal={setDeregistrationModalInspectionId} />
            ))}
            {(inspectionList?.length === 0) &&
                <Row data-testid="div_noData">
                    {t('noInspections')}
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
