import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useI18n } from "@/lib/locales/client";
import { UniformNumbersSizeMap, UniformSizelist } from "@/types/globalUniformTypes";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

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
    const form = useForm<FormType>();
    const { handleSubmit, watch, reset } = form;

    useEffect(() => {
        const formData: Record<number, boolean> = {}
        uniformNumberMap.forEach(x => x.numbers.forEach(n => formData[n] = true));
        reset(formData);

    }, [uniformNumberMap, reset]);

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
                <FormProvider {...form}>
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
                                            <SizeSelect key={String(uNumber)} uNumber={String(uNumber)} />
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
                </FormProvider>
            </Form>
        </Card >
    );
}

const SizeSelect = ({ uNumber }: {
    uNumber: string;
}) => {
    const [selected, setSelected] = useState<boolean>(false);
    const checked = useWatch<FormType>({ name: uNumber });

    return (
        <Col xs="auto" className={`rounded border border-1 border-gray m-1 ${selected ? "bg-primary-subtle" : "bg-light"}`} >
            <Form.Check >
                <Controller
                    name={uNumber}
                    render={({ field }) =>
                        <Form.Check.Input type={"checkbox"} {...field} checked={field.value} />
                    }
                />
                <Form.Check.Label
                    className={checked ? "" : "text-secondary text-decoration-line-through"}
                    onClick={() => setSelected(prev => !prev)}>
                    {+uNumber}
                </Form.Check.Label>
            </Form.Check>
        </Col>
    )
}
