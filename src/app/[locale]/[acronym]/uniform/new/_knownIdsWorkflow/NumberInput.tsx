import { validateUniformNumberAvaiability } from "@/actions/controllers/UniformIdController";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { t } from "@/lib/test";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";

type FormType = {
    numberStart: number,
    numberEnd: number,
}
type PropType = {
    stepBack: () => void;
    createItems: (numbers: number[]) => void;
    uniformTypeId: string;
}

export type AvailableNumbers = {
    value: number;
    used: boolean;
}

const NumberInput = ({ stepBack, createItems, uniformTypeId }: PropType) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormType>();
    const [numbers, setNumbers] = useState<AvailableNumbers[]>([]);

    function addIds(data: FormType) {
        const newNumberList: number[] = [];
        const numberEnd = data.numberEnd ? +data.numberEnd : +data.numberStart;
        const numberStart = +data.numberStart;

        if (numberStart > numberEnd) {
            toast.error(t('error.uniform.create.endBiggerStart'));
            return;
        }
        if ((numberEnd - numberStart + numbers.length) >= 99) {
            toast.error(t('error.uniform.create.maxItems'));
            return;
        }
        reset(undefined);

        for (let i = numberStart; i <= numberEnd; i++) {
            if (!numbers.find(number => number.value === i)) {
                newNumberList.push(i);
            }
        }

        if (newNumberList.length === 0) {
            return;
        }

        validateUniformNumberAvaiability(uniformTypeId, newNumberList).then((result) => {
            setNumbers(prevState => { return [...prevState, ...result] });
        }).catch((error) => {
            toast.error(t('label.error.unknown'));
            console.error(error);
        });
    }

    function removeId(number: number) {
        setNumbers(prevState => prevState.filter(num => num.value !== number));
    }

    function onFinish() {
        createItems(numbers.filter(n => !n.used).map(n => n.value));
    }

    return (
        <Card id="numberInput">
            <CardHeader>
                {t('label.uniform.create.input.header')}
            </CardHeader>
            <CardBody>
                <Form onSubmit={handleSubmit(addIds)}>
                    <Row className="p-3">
                        <Col>
                            <Form.Label>{t('label.uniform.create.input.numberStart')}:</Form.Label>
                            <Form.Control
                                isInvalid={!!errors.numberStart}
                                {...register("numberStart", {
                                    required: {
                                        value: true,
                                        message: t('error.number.required')
                                    },
                                    min: {
                                        value: 1,
                                        message: t('error.number.min', { value: 0 })
                                    },
                                    max: {
                                        value: 99999999,
                                        message: t('error.number.maxLength', { value: 8 })
                                    },
                                    validate: (value) => Number.isInteger(+value) || t('error.number.pattern'),
                                })}
                            />
                            <div className="text-danger fs-7" data-testid="err_numStart">
                                {errors?.numberStart?.message}
                            </div>
                        </Col>
                        <Col>
                            <Form.Label>{t('label.until')}:</Form.Label>
                            <Form.Control
                                isInvalid={!!errors.numberEnd}
                                {...register("numberEnd", {
                                    min: {
                                        value: 1,
                                        message: t('error.number.min', { value: 0 })
                                    },
                                    max: {
                                        value: 99999999,
                                        message: t('error.number.maxLength', { value: 8 })
                                    },
                                    validate: (value) => Number.isInteger(+value) || t('error.number.pattern'),
                                })}
                            />
                            <div className="text-danger fs-7" data-testid="err_numEnd">
                                {errors.numberEnd?.message}
                            </div>
                        </Col>
                        <Col className="d-flex">
                            <Button variant="outline-secondary mt-auto" type="submit" data-testid="btn_numAdd">
                                {t('label.add')}
                            </Button>
                        </Col>
                    </Row>
                    <Row className="p-4 g-3 gx-2">
                        {numbers?.sort((a, b) => (a.value - b.value))?.map(number =>
                            <Col xs={"2"} key={number.value} className="rounded border border-1 border-gray bg-light hoverCol m-2" data-testid={`div_number_${number.value}`}>
                                <Row className="justify-content-between" >
                                    <Col
                                        xs="auto"
                                        data-tooltip-id={`tooltip-numberused-${number.value}`}
                                        className={number.used ? "text-danger text-decoration-line-through text-center" : "text-center"}
                                    >
                                        {number.value}
                                    </Col>
                                    {number.used &&
                                        <Tooltip
                                            id={`tooltip-numberused-${number.value}`}
                                            className="bg-danger fs-8 p-1 fw-bold rounded"
                                            delayShow={500}
                                        >
                                            {t('label.uniform.create.input.alreadyUsed')}
                                        </Tooltip>
                                    }
                                    <Col className="p-0 justify-content-end hoverColHidden" xs="auto">
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="border-0 px-2 py-1"
                                            onClick={() => removeId(number.value)}
                                        >
                                            <FontAwesomeIcon size="sm" icon={faTrash} />
                                        </Button>
                                    </Col>
                                </Row>
                            </Col>
                        )}
                    </Row>
                </Form>
            </CardBody>
            <CardFooter>
                <Col>
                    <Button variant="outline-secondary" onClick={stepBack} data-testid="btn_back">
                        {t('label.prevStep')}
                    </Button>
                </Col>
                <Col xs={"auto"}>
                    <Button
                        variant="outline-primary"
                        onClick={onFinish}
                        disabled={(numbers.filter(n => !n.used).length === 0)}
                        data-testid="btn_create"
                    >
                        {t('label.uniform.create.createAction', { count: numbers.filter(n => !n.used).length })}
                    </Button>
                </Col>
            </CardFooter>
        </Card>
    )
}

export default NumberInput;
