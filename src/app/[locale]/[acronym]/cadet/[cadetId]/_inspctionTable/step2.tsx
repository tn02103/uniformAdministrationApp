import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useCadetUniformComplete } from "@/dataFetcher/cadet";
import { useCadetInspection } from "@/dataFetcher/cadetInspection";
import { Deficiency } from "@/types/deficiencyTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { Button, Col, Row } from "react-bootstrap";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ParamType } from "../page";
import { FormType, NewDeficiencyFormType } from "./card";
import NewDeficiencyRow from "./newDeficiencyRow";
import OldDeficiencyRow from "./oldDeficiencyRow";
import { useI18n } from "@/lib/locales/client";


const initDeficiency: NewDeficiencyFormType = {
    typeId: "",
    typeName: "",
    description: "",
    comment: "",
    fk_uniform: "",
    materialId: "",
}

export default function CadetInspectionStep2({
    prevStep
}: {
    prevStep: () => void
}) {
    const t = useI18n();
    const { watch, control } = useFormContext<FormType>();
    const { fields, append, remove } = useFieldArray<FormType>({ control: control, name: "newDeficiencyList" });

    const { cadetId }: ParamType = useParams();
    const { cadetInspection } = useCadetInspection(cadetId);
    const uniformComplete = useCadetUniformComplete(cadetId);

    const { oldCadetDeficiencies } = cadetInspection!;
    const numberUnresolvedDeficiencies = Object.values(watch('oldDeficiencyList')).filter(v => v == false).length


    return (
        <>
            <div className="row p-0 bg-white border-top border-bottom border-1 border-dark">
                <Row className="border-bottom p-1 bg-body-secondary m-0">
                    <Col xs={"auto"}>
                        {t('cadetDetailPage.header.oldDeficiencies')}
                    </Col>
                    <Col data-testid={"div_step2_oldDefHeader"} xs={"auto"} className={`fst-italic ${(numberUnresolvedDeficiencies > 0) ? "text-danger" : "text-success"}`}>
                        {t('cadetDetailPage.header.amountUnresolved', { count: numberUnresolvedDeficiencies })}
                    </Col>
                </Row>
                {oldCadetDeficiencies?.map(def => {
                    if (!watch(`oldDeficiencyList.${def.id}`)) {
                        return <OldDeficiencyRow deficiency={def} step={2} key={def.id} />;
                    }
                })}
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
                        onClick={prevStep}
                        data-testid="btn_step2_back"
                    >
                        {(oldCadetDeficiencies && oldCadetDeficiencies[0])
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