"use client";

import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetLabel } from "@/types/globalCadetTypes";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { useState } from "react";
import { Col, Row } from "react-bootstrap";
import DeregistrationModal from "./deregistrationModal";
import PlannedInspectionTableRow from "./plannedRow";

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
            <Row className="bg-white border-bottom border-1 border-dark p-2">
                <Col className="fs-bold">{t('state')}</Col>
                <Col className="fs-bold">{t('date')}</Col>
                <Col className="fs-bold">{t('name')}</Col>
                <Col className="fs-bold">{t('deregistrations')}</Col>
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
