import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { t } from "@/lib/test";
import { UniformSizeList } from "@/types/globalUniformTypes";
import { Button, Col, Form, FormCheck, FormGroup, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Tooltip } from "react-tooltip";

export type Step1FormType = {
    continuous: boolean;
    values: {
        [key in string]: number;
    };
};
const Step1 = ({
    usedSizeList, stepBack, onSubmit, initialMap
}: {
    usedSizeList?: UniformSizeList;
    stepBack: () => void;
    onSubmit: (data: Step1FormType) => void;
    initialMap: Step1FormType;
}) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm<Step1FormType>({ defaultValues: initialMap, mode: "onChange" });
    const itemCount = Object.values(watch('values'))
        .filter((value) => Number.isInteger(value) && (+value > 0))
        .reduce((sum, value) => (sum + value), 0)

    return (
        <Card id="step1">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>{t('label.uniform.create.generateStep1.header')}</CardHeader>
                <CardBody>
                    <Row className="m-0 p-0 overflow-x-hidden" style={{ maxHeight: "300px", }}>
                        <Col xs={12} className="mt-3 mb-1">
                            <FormGroup className="d-flex justify-content-center">
                                <FormCheck
                                    type="switch"
                                    label={t('label.uniform.create.generateStep1.continuousNumbers')}
                                    data-tooltip-id="tooltip-numbers"
                                    {...register('continuous')} />
                            </FormGroup>
                            <Tooltip id="tooltip-numbers" className="rounded" delayShow={1000}>
                                {t('label.uniform.create.continuousTooltip.line1')} <br />
                                {t('label.uniform.create.continuousTooltip.line2')}
                            </Tooltip>
                        </Col>
                        <Col xs={12} className="fs-7 text-danger text-center mb-3" data-testid="err_itemCount">
                            {(itemCount > 99) &&
                                t('error.uniform.create.maxItems')
                            }
                            {(itemCount < 1) &&
                                t('error.uniform.create.minNumbers')
                            }
                        </Col>
                        {!usedSizeList
                            ?
                            <Col xs={"4"}>
                                <Form.Group as={Row} className="mb-3" controlId="formPlaintextEmail">
                                    <Form.Label column xs="4">
                                        {t('label.amount')}
                                    </Form.Label>
                                    <Col xs="8">
                                        <Form.Control
                                            isInvalid={!!errors.values?.amount}
                                            defaultValue={0}
                                            {...register('values.amount', {
                                                valueAsNumber: true,
                                                min: {
                                                    value: 1,
                                                    message: t('error.uniform.create.generateNumbers.nullValue')
                                                },
                                                validate: (value) => !isNaN(value) || t('error.number.pattern')
                                            })} />
                                    </Col>
                                    <div className="text-danger fs-7" data-testid="err_amount">
                                        {errors.values?.amount?.message}
                                    </div>
                                </Form.Group>
                            </Col>
                            : usedSizeList?.uniformSizes.map(size => (
                                <Col key={size.id} xs={"4"}>
                                    <Form.Group as={Row} className="mb-3" controlId="formPlaintextEmail">
                                        <Form.Label column xs="4" className="fw-bold text-end px-0">
                                            {size.name}:
                                        </Form.Label>
                                        <Col sm="8">
                                            <Form.Control
                                                isInvalid={!!errors.values?.[size.id]}
                                                defaultValue={0}
                                                {...register(`values.${size.id}`, {
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 0,
                                                        message: t('error.uniform.create.generateNumbers.nullValue')
                                                    },
                                                    validate: (value) => !isNaN(value) || t('error.number.pattern')
                                                })} />
                                            <div className="text-danger fs-7" data-testid={`err_${size.id}`}>
                                                {errors.values?.[size.id]?.message}
                                            </div>
                                        </Col>
                                    </Form.Group>
                                </Col>
                            ))}
                    </Row>
                </CardBody>
                <CardFooter>
                    <Col xs="auto">
                        <Button variant="secondary" onClick={stepBack} data-testid="btn_back">
                            {t('label.prevStep')}
                        </Button>
                    </Col>
                    <Col xs="auto">
                        <Button type="submit" data-testid="btn_continue" disabled={(itemCount > 99) || (itemCount <= 0)}>
                            {t('label.nextStep')}
                        </Button>
                    </Col>
                </CardFooter>
            </Form>
        </Card >
    )
}

export default Step1;
