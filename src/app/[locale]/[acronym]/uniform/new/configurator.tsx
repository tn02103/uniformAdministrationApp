import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useUniformSizeLists, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { t } from "@/lib/test";
import { getUniformSizeList } from "@/lib/uniformHelper";
import { uuidValidationPattern } from "@/lib/validations";
import { UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";

export type ConfiguratorFormType = {
    typeId: string,
    generationId?: string,
    sizeId?: string,
    active: boolean,
    comment: string,
}

const NewUniformConfigurator = ({
    onSubmit, step, withSizes
}: {
    step: number,
    onSubmit: (data: ConfiguratorFormType, usedSizeList?: UniformSizeList) => void,
    withSizes: boolean,
}) => {
    const { register, watch, handleSubmit, setValue, formState: { errors }, getValues } =
        useForm<ConfiguratorFormType>({ defaultValues: { active: true }, mode: "onChange" });

    const { typeList } = useUniformTypeList();
    const { sizelistList } = useUniformSizeLists();
    const [selectedType, setSelectedType] = useState<UniformType | null>(null);
    const [sizeList, setSizeList] = useState<UniformSizeList>();


    // update selected Values
    useEffect(() => {
        const typeId = watch("typeId");
        if (typeId !== selectedType?.id) {
            setValue("generationId", "null");
            setValue("sizeId", "null");
            if (typeId) {
                const type = typeList?.find(t => t.id === typeId);
                if (type && type != selectedType) {
                    setSelectedType(type);
                }
            } else {
                setSelectedType(null);
            }
        }
    }, [watch("typeId"), typeList]);

    useEffect(() => {
        const generationId = watch("generationId");
        if (generationId) {
            generationChanged(generationId);
        }
    }, [watch("generationId"), selectedType]);

    const generationChanged = async (genId: string) => {
        if (!selectedType || !sizelistList) return;

        const newSizeList = getUniformSizeList({ generationId: genId, sizeLists: sizelistList, type: selectedType });

        // no sizeList
        if (!newSizeList) {
            setSizeList(undefined);
            setValue("sizeId", "null", { shouldValidate: true });
            return;
        }
        // same sizeList
        if (sizeList && newSizeList.id === sizeList.id) {
            return;
        }

        // different sizeList
        await setSizeList(newSizeList);
        const oldSize = getValues("sizeId");

        if (newSizeList.uniformSizes.find(s => s.id == oldSize)) {
            setValue("sizeId", oldSize, { shouldValidate: true });
        } else {
            setValue("sizeId", "null", { shouldValidate: true });
        }
        return newSizeList;
    }

    return (
        <Card id="uniformConfigurator" data-testid="div_configurator">
            <CardHeader>
                <p className={`fs-5 fw-bold text-center align-middle m-0 ${(step == 0) ? "" : "text-secondary"}`}>
                    {t('label.uniform.create.configurator.header')}
                </p>
            </CardHeader>
            <Form onSubmit={handleSubmit((data) => onSubmit(data, sizeList))}>
                <CardBody>
                    <Row className="bg-white border-top border-1 border-dark p-2 m-0">
                        <Col xs="12">
                            <Row className="mt-2">
                                <Col xs="4" sm="5" className="text-end p-0">
                                    <Form.Label className="align-middle m-0">{t('label.uniform.type.type_one')}:</Form.Label>
                                </Col>
                                <Col xs="8" sm="5">
                                    <Form.Select
                                        defaultValue={"null"}
                                        isInvalid={!!(errors?.typeId)}
                                        disabled={step > 0}
                                        {...register("typeId",
                                            {
                                                pattern: uuidValidationPattern,
                                            }
                                        )}
                                    >
                                        <option disabled value={"null"}>{t('error.pleaseSelect')}</option>
                                        {typeList?.map(type =>
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        )}
                                    </Form.Select>
                                </Col>
                            </Row>
                            <Row className="mt-2">
                                <Col xs="4" sm="5" className="text-end p-0">
                                    <Form.Label
                                        className={`align-middle m-0 ${selectedType?.usingGenerations ? "" : "text-secondary"}`}>
                                        {t('label.uniform.generation_one')}:
                                    </Form.Label>
                                </Col>
                                <Col xs="8" sm="5">
                                    <Form.Select
                                        defaultValue={undefined}
                                        disabled={(!(selectedType && selectedType.usingGenerations) || (step > 0))}
                                        className={selectedType?.usingGenerations ? "" : "text-secondary"}
                                        isInvalid={!!(errors?.generationId)}
                                        {...register("generationId", {
                                            pattern: selectedType?.usingGenerations ? uuidValidationPattern : undefined,
                                        })}
                                    >
                                        <option disabled value={"null"}>{t('error.pleaseSelect')}</option>
                                        {selectedType?.uniformGenerationList.map(gen =>
                                            <option key={gen.id} value={gen.id}>{gen.name}</option>
                                        )}
                                    </Form.Select>
                                </Col>
                            </Row>
                            {withSizes &&
                                <Row className="mt-2">
                                    <Col xs="4" sm="5" className="text-end p-0 ">
                                        <Form.Label className={`align-middle m-0 ${selectedType?.usingSizes ? "" : "text-secondary"}`}>
                                            {t('label.uniform.size_one')}:
                                        </Form.Label>
                                    </Col>
                                    <Col xs="8" sm="5">
                                        <Form.Select
                                            disabled={!(selectedType && selectedType.usingSizes) || (step > 0)}
                                            className={selectedType?.usingSizes ? "" : "text-secondary"}
                                            isInvalid={!!(errors?.sizeId)}
                                            {...register("sizeId", {
                                                pattern: selectedType?.usingSizes ? uuidValidationPattern : undefined,
                                            })}>
                                            <option value={"null"} disabled>{t('error.pleaseSelect')}</option>
                                            {sizeList?.uniformSizes.map(size => {
                                                return (
                                                    <option key={size.id} value={size.id} className="text-dark">{size.name}</option>
                                                );
                                            })}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            }
                            <Row className="mt-2">
                                <Col xs="4" sm="5" className="text-end p-0">
                                    <Form.Label
                                        className={`align-middle m-0`}>
                                        {t('label.uniform.active.true')}:
                                    </Form.Label>
                                </Col>
                                <Col xs="8" sm="5">
                                    <Form.Check
                                        disabled={(step > 0)}
                                        {...register("active")} />
                                </Col>
                            </Row>
                            <Row className="mt-2">
                                <Col xs="4" sm="5" className="text-end p-0">
                                    <Form.Label
                                        className={`align-middle m-0`}>
                                        {t('label.comment')}:
                                    </Form.Label>
                                </Col>
                                <Col sm="7"></Col>
                                <Col sm="2"></Col>
                                <Col xs="12" sm="8">
                                    <Form.Control
                                        as="textarea"
                                        disabled={(step > 0)}
                                        {...register("comment")} />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </CardBody>
                {(step === 0) &&
                    <CardFooter>
                        <Col xs={"auto"}></Col>
                        <Col xs={"auto"}>
                            <Button variant="outline-primary" className="border-2" type="submit" data-testid="btn_continue">
                                {t('label.nextStep')}
                            </Button>
                        </Col>
                    </CardFooter>
                }
            </Form>
        </Card>
    );
}

export default NewUniformConfigurator;
