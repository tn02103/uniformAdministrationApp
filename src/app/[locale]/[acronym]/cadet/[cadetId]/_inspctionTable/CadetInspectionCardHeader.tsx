import { TooltipActionButton, TooltipIconButton } from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useInspectedCadetIdList, useInspectionState } from "@/dataFetcher/inspection";
import { useScopedI18n } from "@/lib/locales/client";
import { faClipboardCheck, faClipboardQuestion } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Row } from "react-bootstrap";
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

    return (
        <Row className="fs-5 fw-bold p-0">
            {(inspectionState?.active) ?
                <div data-testid="div_header" className="col-12 text-center p-0">
                    {(step == 0) ? t('header.inspection') : t('header.inspecting')}
                    <TooltipIconButton
                        variant={inspected ? "outline-success" : "outline-warning"}
                        disabled={step !== 0}
                        tooltipText={inspected
                            ? t('tooltip.inspected')
                            : t('tooltip.notInspected')}
                        icon={inspected ? faClipboardCheck : faClipboardQuestion}
                        iconClass="fa-xl"
                        onClick={startInspecting}
                        testId="btn_inspect"
                    />
                </div>
                :
                <div data-testid="div_header" className="col-12 d-flex align-items-center justify-content-center p-0">
                    <span>{t('header.noInspection')}</span>
                    {step === 0 && onNewDeficiency && (
                        <TooltipActionButton
                            variantKey="create"
                            testId="btn_new_deficiency"
                            disabled={showCreateCard}
                            onClick={onNewDeficiency}
                        />
                    )}
                </div>
            }
        </Row>
    );
}
