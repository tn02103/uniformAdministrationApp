import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useI18n } from "@/lib/locales/client";
import { UniformNumbersSizeMap, UniformSizelist } from "@/types/globalUniformTypes";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { UseFormRegister, UseFormWatch, useForm } from "react-hook-form";

type FormType = {
    [key in string]: boolean
}

export default function Step2({ uniformNumberMap, usedSizelist, stepBack, onCreate }: {
    uniformNumberMap: UniformNumbersSizeMap,
    usedSizelist?: UniformSizelist,
    stepBack: () => void,
    onCreate: (data: UniformNumbersSizeMap) => void;
}) {
    const t = useI18n();
    const { register, handleSubmit, watch, reset } = useForm<FormType>();

    useEffect(() => {
        const formData: any = {}
        uniformNumberMap.forEach(x => x.numbers.forEach(n => formData[n] = true));
        reset(formData);

    }, [uniformNumberMap])

    const onSubmit = (data: FormType) => {
        onCreate(uniformNumberMap.map(map => {
            return {
                sizeId: map.sizeId,
                numbers: map.numbers.filter(number => data[number])
            }
        }));
    }

    return (
        <Card id="step2">
            <Form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                    {t('createUniform.header.revalidteNumbers')}
                </CardHeader>
                <CardBody>
                    <Row className="m-0">
                        {usedSizelist &&
                            <Col className="fw-bold p-2" xs={2}>
                                {t('common.uniform.size')}
                            </Col>
                        }
                        <Col className="fw-bold p-2" xs={10}>
                            {t('common.uniform.number')}
                        </Col>
                    </Row>
                    {uniformNumberMap?.map((generated) => (
                        <Row
                            key={generated.sizeId}
                            className="m-0 border-top border-2 py-3"
                            data-testid={`div_size_${generated.sizeId}`}
                        >
                            {usedSizelist &&
                                <Col className="fw-bold text-right" xs={2}>
                                    {usedSizelist.uniformSizes.find(s => s.id === generated.sizeId)?.name}
                                </Col>
                            }
                            <Col className="" xs={usedSizelist ? 10 : 12}>
                                <Row>
                                    {generated.numbers.map((uNumber) => (
                                        <SizeSelect key={String(uNumber)} uNumber={uNumber} register={register} watch={watch} />
                                    ))}
                                </Row>
                            </Col>
                        </Row>
                    ))}
                </CardBody>
                <CardFooter>
                    <Col xs="auto">
                        <Button variant="secondary" onClick={stepBack} data-testid="btn_back">
                            {t('common.actions.prevStep')}
                        </Button>
                    </Col>
                    <Col xs="auto">
                        <Button type="submit" data-testid="btn_create">
                            {t('createUniform.create.label', { count: Object.values(watch()).filter(v => v).length })}
                        </Button>
                    </Col>
                </CardFooter>
            </Form>
        </Card >
    );
}

const SizeSelect = ({ uNumber, register, watch }: {
    uNumber: number;
    register: UseFormRegister<FormType>;
    watch: UseFormWatch<FormType>;
}) => {
    const [selected, setSelected] = useState<boolean>(false);

    return (
        <Col xs="auto" className={`rounded border border-1 border-gray m-1 ${selected ? "bg-primary-subtle" : "bg-light"}`} >
            <Form.Check >
                <Form.Check.Input type={"checkbox"} {...register(String(uNumber))} />
                <Form.Check.Label
                    className={watch(String(uNumber)) ? "" : "text-secondary text-decoration-line-through"}
                    onClick={() => setSelected(prev => !prev)}>
                    {+uNumber}
                </Form.Check.Label>
            </Form.Check>
        </Col>
    )
}
