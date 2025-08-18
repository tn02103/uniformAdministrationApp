import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useCadetUniformComplete } from "@/dataFetcher/cadet";
import { useI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema, NewCadetDeficiencyFormSchema, OldDeficiencyFormSchema } from "@/zod/deficiency";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Button, Col, Row } from "react-bootstrap";
import { useFieldArray, useWatch } from "react-hook-form";
import { ParamType } from "../page";
import NewDeficiencyRow from "./newDeficiencyRow";
import OldDeficiencyRow from "./oldDeficiencyRow";


const initDeficiency: NewCadetDeficiencyFormSchema = {
    typeId: "",
    description: "",
    comment: "",
    uniformId: null,
    materialId: null,
    otherMaterialGroupId: null,
    otherMaterialId: null,
}

export default function CadetInspectionStep2({
    setStep
}: {
    setStep: (step: number) => void
}) {
    const t = useI18n();
    const { fields, append, remove } = useFieldArray<CadetInspectionFormSchema>({ name: "newDeficiencyList" });

    const { cadetId }: ParamType = useParams();
    const uniformComplete = useCadetUniformComplete(cadetId);

    const oldDeficiencyList = useWatch<CadetInspectionFormSchema>({
        name: "oldDeficiencyList"
    }) as OldDeficiencyFormSchema[] | undefined;
    const unresolvedOldDeficiencyList = oldDeficiencyList?.filter(def => !def.resolved) || [];

    return (
        <>
            <div className="row p-0 bg-white border-top border-bottom border-1 border-dark">
                <Row className="border-bottom p-1 bg-body-secondary m-0">
                    <Col xs={"auto"}>
                        {t('cadetDetailPage.header.oldDeficiencies')}
                    </Col>
                    <Col data-testid={"div_step2_oldDefHeader"} xs={"auto"} className={`fst-italic ${(unresolvedOldDeficiencyList.length > 0) ? "text-danger" : "text-success"}`}>
                        {t('cadetDetailPage.header.amountUnresolved', { count: unresolvedOldDeficiencyList.length })}
                    </Col>
                </Row>
                {(unresolvedOldDeficiencyList)?.map((def, index) =>
                    <OldDeficiencyRow deficiency={def} step={2} key={def.id} index={index} />
                )}
                <Row className="border-bottom p-1 bg-body-secondary m-0">
                    <Col xs="auto">
                        {t('cadetDetailPage.header.newDeficiencies')}
                    </Col>
                    <Col>
                        <TooltipIconButton
                            variant="outline-success"
                            buttonSize="sm"
                            tooltipText={t('common.actions.addNew')}
                            icon={faPlus}
                            onClick={() => append(initDeficiency)}
                            testId="btn_step2_newDef"
                        />
                    </Col>
                </Row>
                <Row className="p-2 text-center">
                    <Col data-testid={"div_step2_unifComplete"} className={uniformComplete ? "text-success" : "text-danger"}>
                        {t(`common.cadet.uniformComplete.${uniformComplete ? "true" : "false"}`)}
                    </Col>
                </Row>
                {fields.map((item, index) => (
                    <NewDeficiencyRow key={item.id} index={index} remove={() => remove(index)} />
                ))}
            </div>
            <Row>
                <Col>
                    <Button
                        variant="outline-secondary"
                        className="border-0"
                        onClick={() => (oldDeficiencyList && oldDeficiencyList.length > 0) ? setStep(1) : setStep(0)}
                        data-testid="btn_step2_back"
                    >
                        {(oldDeficiencyList && oldDeficiencyList?.length > 0)
                            ? t('common.actions.prevStep')
                            : t('common.actions.cancel')}
                    </Button>
                </Col>
                <Col className="text-end">
                    <Button
                        type="submit"
                        variant="outline-primary"
                        className="border-0"
                        data-testid="btn_step2_submit"
                    >
                        {t('common.actions.save')}
                    </Button>
                </Col>
            </Row>
        </>
    )
}