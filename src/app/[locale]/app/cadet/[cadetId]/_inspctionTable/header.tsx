import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useCadetInspection } from "@/dataFetcher/cadetInspection";
import { useScopedI18n } from "@/lib/locales/client";
import { faClipboardCheck, faClipboardQuestion } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Row } from "react-bootstrap";




export default function CadetInspectionCardHeader({
    stepState: [step, setStep]
}: {
    stepState: [number, (n: number) => void]
}) {
    const t = useScopedI18n('cadetDetailPage');
    const { inspectionState } = useGlobalData();
    const { cadetId } = useParams();
    const { cadetInspection } = useCadetInspection(cadetId as string);
    const inspected = (!!cadetInspection && !!cadetInspection.id)

    console.log(inspectionState);
    function startInspectingCadet() {
        if (step !== 0) return;

        if (cadetInspection && cadetInspection.oldCadetDeficiencies.length == 0) {
            setStep(2);
        } else {
            setStep(1);
        }
    }

    return (
        <Row className="fs-5 fw-bold p-0">
            {(inspectionState.active) ?
                <div data-testid="div_header" className="col-12 text-center p-0">
                    {(step == 0) ? t('header.inspection') : t('header.inspecting')}
                    <TooltipIconButton
                        variant={inspected ? "outline-success" : "outline-warning"}
                        disabled={step !== 0}
                        tooltipText={inspected
                            ? t('tooltips.inspection.inspected')
                            : t('tooltips.inspection.notInspected')}
                        icon={inspected ? faClipboardCheck : faClipboardQuestion}
                        iconClass="fa-xl"
                        onClick={startInspectingCadet}
                        testId="btn_inspect"
                    />
                </div>
                :
                <div data-testid="div_header" className="col-12 text-center p-0">
                    {t('header.deficiencies')}
                </div>
            }
        </Row>
    )
}
