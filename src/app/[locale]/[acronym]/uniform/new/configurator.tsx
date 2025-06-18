import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useUniformSizelists, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { getUniformSizelist } from "@/lib/uniformHelper";
import { uuidValidationPattern } from "@/lib/validations";
import { UniformSizelist, UniformType } from "@/types/globalUniformTypes";
import { useCallback, useEffect, useState } from "react";
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
    onSubmit: (data: ConfiguratorFormType, usedSizelist?: UniformSizelist) => void,
    withSizes: boolean,
}) => {
    const t = useI18n();
    const { register, watch, handleSubmit, setValue, formState: { errors }, getValues } =
        useForm<ConfiguratorFormType>({ defaultValues: { active: true }, mode: "onChange" });

    const { typeList } = useUniformTypeList();
    const { sizelistList } = useUniformSizelists();
    const [selectedType, setSelectedType] = useState<UniformType | null>(null);
    const [sizelist, setSizelist] = useState<UniformSizelist>();

    const selectedTypeId = watch("typeId");
    const selectedGenerationId = watch("generationId");

    const generationChanged = useCallback(async (genId: string) => {
        if (!selectedType || !sizelistList) return;

        const newSizelist = getUniformSizelist({ generationId: genId, sizelists: sizelistList, type: selectedType });

        // no sizelist
        if (!newSizelist) {
            setSizelist(undefined);
            setValue("sizeId", "null", { shouldValidate: true });
            return;
        }
        // same sizelist
        if (sizelist && newSizelist.id === sizelist.id) {
            return;
        }

        // different sizelist
        await setSizelist(newSizelist);
        const oldSize = getValues("sizeId");

        if (newSizelist.uniformSizes.find(s => s.id == oldSize)) {
            setValue("sizeId", oldSize, { shouldValidate: true });
        } else {
            setValue("sizeId", "null", { shouldValidate: true });
        }
        return newSizelist;
    }, [getValues, setValue, sizelist, sizelistList, selectedType]);

    // update selected Values
    useEffect(() => {
        if (selectedTypeId !== selectedType?.id) {
            setValue("generationId", "null");
            setValue("sizeId", "null");
            if (selectedTypeId) {
                const type = typeList?.find(t => t.id === selectedTypeId);
                if (type && type != selectedType) {
                    setSelectedType(type);
                }
            } else {
                setSelectedType(null);
            }
        }
    }, [selectedType, selectedTypeId, setValue, typeList]);

    useEffect(() => {
        const generationId = selectedGenerationId;
        if (generationId) {
            generationChanged(generationId);
        }
    }, [generationChanged, selectedGenerationId, selectedType]);

    return (
        <Card id="uniformConfigurator" data-testid="div_configurator">
            <CardHeader>
                <p className={`fs-5 fw-bold text-center align-middle m-0 ${(step == 0) ? "" : "text-secondary"}`}>
                    {t('createUniform.header.configurator')}
                </p>
            </CardHeader>
            <Form onSubmit={handleSubmit((data) => onSubmit(data, sizelist))}>
                <CardBody>
                    <Row className="bg-white border-top border-1 border-dark p-2 m-0">
                        <Col xs="12">
                            <Row className="mt-2">
                                <Col xs="4" sm="5" className="text-end p-0">
                                    <Form.Label className="align-middle m-0">{t('common.uniform.type.type', { count: 1 })}:</Form.Label>
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
                                        <option disabled value={"null"}>{t('common.error.pleaseSelect')}</option>
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
                                        {t('common.uniform.generation.label', { count: 1 })}:
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
                                        <option disabled value={"null"}>{t('common.error.pleaseSelect')}</option>
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
                                            {t('common.uniform.size')}:
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
                                            <option value={"null"} disabled>{t('common.error.pleaseSelect')}</option>
                                            {sizelist?.uniformSizes.map(size => {
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
                                        {t('common.uniform.state.active')}:
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
                                        {t('common.comment')}:
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
                                {t('common.actions.nextStep')}
                            </Button>
                        </Col>
                    </CardFooter>
                }
            </Form>
        </Card>
    );
}

export default NewUniformConfigurator;
