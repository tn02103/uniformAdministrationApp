"use client"

import { useI18n } from "@/lib/locales/client";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import { Accordion, Button, Col, Form, Row } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { useSessionStorage } from "usehooks-ts";
import { FilterType } from ".";
import FilterAccordionBody from "./filterAccordionBody";

export default function Filter({
    uniformType, sizeList
}: {
    uniformType: UniformType;
    sizeList: UniformSize[];
}) {
    const { handleSubmit, register, watch, reset, formState: { isLoading } } = useFormContext<FilterType>();
    const [filter, setFilter] = useSessionStorage<FilterType | null>(`filter_${uniformType.id}`, null);
    const t = useI18n();

    const activPassivError = (!watch("active") && !watch("passive"));
    const ownerError = (!watch("withOwner") && !watch("withoutOwner"));

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
                active: true,
                passive: false,
                withOwner: true,
                withoutOwner: true,
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
    }, [uniformType, sizeList]);

    return (
        <>
            <Col>
                <Row className="fw-bold fs-5 pt-2 text-center">
                    <Col className="text-center">
                        {t('uniformList.filter')}
                    </Col>
                </Row>

                <Form onSubmit={handleSubmit(filterSubmit)}>
                    <Row>
                        <Accordion className="mt-3">
                            {uniformType.usingGenerations &&
                                <Accordion.Item data-testid={"div_genAccordion"} eventKey="0" >
                                    <Accordion.Button className="p-2">{t('common.uniform.generation_other')}</Accordion.Button>
                                    <FilterAccordionBody
                                        itemList={uniformType.uniformGenerationList}
                                        name={"generations"}
                                    />
                                </Accordion.Item>
                            } {uniformType.usingSizes &&
                                <Accordion.Item data-testid={"div_sizeAccordion"} eventKey="1" >
                                    <Accordion.Button className="p-2">{t('common.uniform.size_other')}</Accordion.Button>
                                    <FilterAccordionBody
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
                                        label={t('common.active.true')}
                                        isInvalid={activPassivError}
                                        {...register(`active`)} />
                                    <Form.Check
                                        label={t('common.active.false')}
                                        isInvalid={activPassivError}
                                        {...register(`passive`)} />
                                    <Form.Check
                                        label={t('uniformList.withOwner')}
                                        isInvalid={ownerError}
                                        {...register(`withOwner`)} />
                                    <Form.Check
                                        label={t('uniformList.withoutOwner')}
                                        isInvalid={ownerError}
                                        {...register(`withoutOwner`)} />
                                    <div data-testid="err_filterError" className="fs-7 text-danger">
                                        {activPassivError && t('uniformList.error.activ')}
                                        {ownerError && t('uniformList.error.owner')}
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Row>
                    <Row>
                        <Col className="pb-2 pt-2  pb-xl-4 pt-xl-3">
                            <Button data-testid={"btn_load"} type="submit" disabled={activPassivError || ownerError}>
                                {t('common.actions.load')}
                                {isLoading && <FontAwesomeIcon icon={faSpinner} className="fa-spin ms-2 " />}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Col >
        </>
    )
}