import { useScopedI18n } from "@/lib/locales/client";
import { Deficiency } from "@/types/deficiencyTypes";
import { format } from "date-fns";
import { Col, Form, Row } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { FormType } from "./card";

export default function OldDeficiencyRow({
    step,
    deficiency,
}: {
    step: number;
    deficiency: Deficiency,
}) {
    const tDef = useScopedI18n('common.deficiency');
    const tCom = useScopedI18n('common')
    const { register, watch } = useFormContext<FormType>();
    return (
        <Row
            className={`p-1 m-0 border-bottom border-1 ${(step == 2) ? "py-1" : "py-3"}`}
            key={`oldDefRow-${deficiency.id}`}
            data-testid={`div_olddef_${deficiency.id}`}
        >
            {(step == 1) &&
                <Col xs={12}
                    xl={12}
                    className={" justify-content-center " + (watch(`oldDeficiencyList.${deficiency.id}`) ? "text-success" : "text-danger")}
                >
                    <Form.Check
                        type="switch"
                        label={watch(`oldDeficiencyList.${deficiency.id}`)
                            ? tDef('resolved.true')
                            : tDef('resolved.false')}
                        {...register(`oldDeficiencyList.${deficiency.id}`)}
                        data-testid={`chk_resolved`}
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
                            {tCom('dates.created')}:
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid={`div_created`}>
                            {format(new Date(deficiency.dateCreated!), "dd.MM.yyyy")}
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
    )
}