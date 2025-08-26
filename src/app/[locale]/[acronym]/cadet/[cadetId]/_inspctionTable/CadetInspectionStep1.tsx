import { useI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema, OldDeficiencyFormSchema } from "@/zod/deficiency";
import { Button, Col, Row } from "react-bootstrap";
import { useWatch } from "react-hook-form";
import { OldDeficiencyRow } from "./OldDeficiencyRow";

export type CadetInspectionStep1Props = {
    cancel: () => void;
    setNextStep: () => void;
};

export function CadetInspectionStep1({
    cancel,
    setNextStep
}: CadetInspectionStep1Props) {
    const t = useI18n()

    const oldDeficiencyList = useWatch<CadetInspectionFormSchema>({
        name: "oldDeficiencyList"
    }) as OldDeficiencyFormSchema[] | undefined;

    return (
        <>
            <div className="row p-0 bg-white border-top border-bottom border-1 border-dark">
                <Row className="border-bottom p-1 bg-body-secondary m-0">
                    <Col xs={"auto"}>
                        {t('cadetDetailPage.inspection.label.oldDeficiencies')}
                    </Col>
                </Row>
                {oldDeficiencyList?.map((def, index) =>
                    <OldDeficiencyRow deficiency={def} step={1} key={def.id} index={index} />
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
                        onClick={setNextStep}
                        data-testid={"btn_step1_continue"}
                    >
                        {t('common.actions.nextStep')}
                    </Button>
                </Col>
            </Row>
        </>
    )
}