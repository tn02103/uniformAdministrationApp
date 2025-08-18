import dayjs from "@/lib/dayjs";
import { useScopedI18n } from "@/lib/locales/client";
import { Deficiency } from "@/types/deficiencyTypes";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { Col, Form, Row } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";

export default function OldDeficiencyRow({
    index,
    step,
    deficiency,
}: {
    index: number;
    step: number;
    deficiency: Deficiency;
}) {
    const tDef = useScopedI18n('common.deficiency');
    const tCom = useScopedI18n('common');

    const checked = useWatch({ name: `oldDeficiencyList.${index}.resolved` });
    const { register } = useFormContext<CadetInspectionFormSchema>();
    return (
        <Row
            className={`p-1 m-0 border-bottom border-1 ${(step == 2) ? "py-1" : "py-3"}`}
            key={`oldDefRow-${deficiency.id}`}
            data-testid={`div_olddef_${deficiency.id}`}
        >
            {(step == 1) &&
                <Col xs={12}
                    xl={12}
                    className={"justify-content-center"}
                >
                    <Form.Check
                        type="switch"
                        id={`chk_resolved_${index}`}
                        label={checked ? tDef('resolved.true') : tDef('resolved.false')}
                        {...register(`oldDeficiencyList.${index}.resolved`)}
                        data-testid={`chk_resolved`}
                        className={checked ? "text-success" : "text-danger"}
                    />
                </Col>
            }
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic align-bottom">
                        {tCom('description')}
                    </Col>
                </Row>
                <Row className="align-top">
                    <Col data-testid={`div_description`} className="align-text-top">
                        {deficiency.description}
                    </Col>
                </Row>
            </Col>
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic">
                        {tCom('type')}
                    </Col>
                </Row>
                <Row>
                    <Col data-testid={`div_type`}>
                        {deficiency.typeName}
                    </Col>
                </Row>
            </Col>
            {(step < 2) &&
                <Col xs={6} sm={4} className="pt-1">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('dates.created')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid={`div_created`}>
                            {dayjs(deficiency.dateCreated).format('DD.MM.YYYY')}
                        </Col>
                    </Row>
                </Col>
            }
            {(step < 2) &&
                <Col xs={"12"} className="pt-2">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('comment')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid={`div_comment`}>
                            {deficiency.comment}
                        </Col>
                    </Row>
                </Col>
            }
        </Row>
    );
}
