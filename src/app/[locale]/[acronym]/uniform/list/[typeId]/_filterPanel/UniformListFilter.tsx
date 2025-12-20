"use client"

import { useI18n } from "@/lib/locales/client";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Accordion, Button, Col, Form, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { useSessionStorage } from "usehooks-ts";
import { FilterType } from "./UniformListSidePanel";
import { UniformListFilterAccordionBody } from "./UniformListFilterAccordionBody";

export function UniformListFilter({
    uniformType, sizeList
}: {
    uniformType: UniformType;
    sizeList: UniformSize[];
}) {
    const t = useI18n();
    const form = useForm<FilterType>();
    const { handleSubmit, register, watch, reset, formState: { isLoading } } = form;
    const [filter, setFilter] = useSessionStorage<FilterType | null>(`filter_${uniformType.id}`, null);

    const activeReserveError = (!watch("isActive") && !watch("isReserve"));
    const ownerError = (!watch("notIssued") && !watch("issued")) && !watch("inStorageUnit");

    function filterSubmit(data: FilterType) {
        setFilter(data);
    }

    useEffect(() => {
        if (!uniformType)
            return;

        if (filter) {
            reset(filter);
        } else {
            const options: FilterType = {
                isActive: true,
                isReserve: true,
                issued: true,
                notIssued: true,
                inStorageUnit: true,
                all: {
                    generations: true,
                    sizes: true,
                },
                generations: {
                    'null': true,
                },
                sizes: {
                    'null': true,
                }
            }
            uniformType.uniformGenerationList.forEach((gen) => options.generations[gen.id] = true);
            sizeList.forEach((s) => options.sizes[s.id] = true);
            reset(options);
        }
    }, [uniformType, sizeList, reset, filter]);

    return (
        <>
            <Col>
                <Row className="fw-bold fs-5 pt-2 text-center">
                    <Col className="text-center">
                        {t('uniformList.filter')}
                    </Col>
                </Row>
                <Form onSubmit={handleSubmit(filterSubmit)}>
                    <FormProvider {...form}>
                        <Row>
                            <Accordion className="mt-3">
                                {uniformType.usingGenerations &&
                                    <Accordion.Item data-testid={"div_genAccordion"} eventKey="0" >
                                        <Accordion.Button className="p-2">{t('common.uniform.generation.label', { count: 2 })}</Accordion.Button>
                                        <UniformListFilterAccordionBody
                                            itemList={uniformType.uniformGenerationList}
                                            name={"generations"}
                                        />
                                    </Accordion.Item>
                                } {uniformType.usingSizes &&
                                    <Accordion.Item data-testid={"div_sizeAccordion"} eventKey="1" >
                                        <Accordion.Button className="p-2">{t('common.uniform.size_other')}</Accordion.Button>
                                        <UniformListFilterAccordionBody
                                            itemList={sizeList}
                                            name={"sizes"}
                                        />
                                    </Accordion.Item>
                                }
                                <Accordion.Item data-testid="div_othersAccordion" eventKey="2">
                                    <Accordion.Button className="p-2">
                                        {t('uniformList.other')}
                                    </Accordion.Button>
                                    <Accordion.Body>
                                        <Form.Check
                                            label={t('common.uniform.state.active')}
                                            id="uniformListFilter-active"
                                            isInvalid={activeReserveError}
                                            {...register(`isActive`)} />
                                        <Form.Check
                                            label={t('common.uniform.state.isReserve')}
                                            id="uniformListFilter-isReserve"
                                            isInvalid={activeReserveError}
                                            {...register(`isReserve`)} />
                                        <hr />
                                        <Form.Check
                                            label={t('uniformList.issued')}
                                            id="uniformListFilter-issued"
                                            isInvalid={ownerError}
                                            {...register(`issued`)} />
                                        <Form.Check
                                            label={t('uniformList.notIssued')}
                                            id="uniformListFilter-notIssued"
                                            isInvalid={ownerError}
                                            {...register(`notIssued`)} />
                                        <Form.Check
                                            label={t('uniformList.inStorageUnit')}
                                            id="uniformListFilter-inStorageUnit"
                                            isInvalid={ownerError}
                                            {...register(`inStorageUnit`)} />
                                        <div data-testid="err_filterError" className="fs-7 text-danger">
                                            {activeReserveError && t('uniformList.error.activ')}
                                            {ownerError && t('uniformList.error.owner')}
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </Row>
                        <Row>
                            <Col className="pb-2 pt-2  pb-xl-4 pt-xl-3">
                                <Button data-testid={"btn_load"} type="submit" disabled={activeReserveError || ownerError}>
                                    {t('common.actions.load')}
                                    {isLoading && <FontAwesomeIcon icon={faSpinner} className="fa-spin ms-2 " />}
                                </Button>
                            </Col>
                        </Row>
                    </FormProvider>
                </Form>
            </Col >
        </>
    );
}
