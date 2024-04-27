"use client"

import { useI18n } from "@/lib/locales/client"
import { Row, Col, Button } from "react-bootstrap"
import OldDeficiencyRow from "./oldDeficiencyRow"
import { useCadetInspection } from "@/dataFetcher/cadetInspection"
import { useParams } from "next/navigation"
import { ParamType } from "../page"


export default function CadetInspectionStep1({
    cancel,
    stepState: [step, setStep]
}: {
    cancel: () => void;
    stepState: [number, (n: number) => void];
}) {
    const t = useI18n()
    const { cadetId }: ParamType = useParams();
    const { cadetInspection } = useCadetInspection(cadetId);
    if (!cadetInspection) {
        return (<div>no Inspection</div>);
    }
    const { oldCadetDeficiencies } = cadetInspection!

    return (
        <>
            <div className="row p-0 bg-white border-top border-bottom border-1 border-dark">
                <Row className="border-bottom p-1 bg-body-secondary m-0">
                    <Col xs={"auto"}>
                        {t('cadetDetailPage.header.oldDeficiencies')}
                    </Col>
                </Row>
                {oldCadetDeficiencies?.map(def =>
                    <OldDeficiencyRow deficiency={def} step={step} key={def.id} />
                )}
            </div>
            <Row className="p-0">
                <Col>
                    <Button
                        variant="outline-secondary"
                        className="border-0"
                        onClick={cancel}
                        data-testid={"btn_step1_back"}
                    >
                        {t('common.actions.cancel')}
                    </Button>
                </Col>
                <Col className="text-end">
                    <Button
                        variant="outline-primary"
                        className="border-0"
                        onClick={() => setStep(2)}
                        data-testid={"btn_step1_continue"}
                    >
                        {t('common.actions.nextStep')}
                    </Button>
                </Col>
            </Row>
        </>
    )
}