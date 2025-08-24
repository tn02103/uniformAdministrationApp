import { TooltipIconButton } from "@/components/Buttons/TooltipIconButton";
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
}: {
    step: number;
    startInspecting: () => void;
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
                <div data-testid="div_header" className="col-12 text-center p-0">
                    {t('header.noInspection')}
                </div>
            }
        </Row>
    );
}
