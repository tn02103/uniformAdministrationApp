import { TooltipActionButton, TooltipIconButton } from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useInspectedCadetIdList, useInspectionState } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { faClipboardCheck, faClipboardQuestion } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import { ParamType } from "../page";


export default function CadetInspectionCardHeader({
    step,
    startInspecting,
    showCreateCard,
    onNewDeficiency,
}: {
    step: number;
    startInspecting: () => void;
    showCreateCard?: boolean;
    onNewDeficiency?: () => void;
}) {
    const t = useScopedI18n('cadetDetailPage.inspection');
    const { inspectionState } = useInspectionState();
    const { userRole } = useGlobalData();
    const { cadetId }: ParamType = useParams();
    const { inspectedIdList } = useInspectedCadetIdList(userRole, inspectionState?.active);

    const inspected = inspectionState?.active && inspectedIdList?.includes(cadetId);

    const headerLabel = inspectionState?.active
        ? (step === 0 ? t('header.inspection') : t('header.inspecting'))
        : t('header.noInspection');

    return (
        <Row data-testid="div_header" className="fs-5 fw-bold p-0 justify-content-between">
            <Col xs={1}/>
            <Col xs={"auto"}className="text-center">
                {headerLabel}
            </Col>
            <Col className="ms-auto text-end">
                {step === 0 && onNewDeficiency && !inspectionState?.active && (
                    <TooltipActionButton
                        variantKey="create"
                        testId="btn_new_deficiency"
                        disabled={showCreateCard}
                        onClick={onNewDeficiency}
                    />
                )}
                {inspectionState?.active && (
                    <TooltipIconButton
                        variant={inspected ? "outline-success" : "outline-warning"}
                        disabled={step !== 0}
                        tooltipText={inspected
                            ? t('tooltip.inspected')
                            : t('tooltip.notInspected')}
                        icon={inspected ? faClipboardCheck : faClipboardQuestion}
                        iconClass="fa-lg"
                        onClick={startInspecting}
                        testId="btn_inspect"
                        buttonClass="p-1"
                    />
                )}
            </Col>
        </Row>
    );
}
