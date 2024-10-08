"use client"

import { updateUniformType } from "@/actions/controllers/UniformConfigController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useUniformSizelists, useUniformType } from "@/dataFetcher/uniformAdmin";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { acronymValidationPattern, nameValidationPattern } from "@/lib/validations";
import { UniformType } from "@/types/globalUniformTypes";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
import { Button, Col, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

export default function UniformConfigTypeDetails({
    editableState: [editable, setEditable],
    selectedTypeId,
}: {
    editableState: [boolean, (b: boolean) => void];
    selectedTypeId: string;

}) {
    const t = useI18n();
    const tType = useScopedI18n('common.uniform.type');
    const { handleSubmit, register, reset, watch, formState: { errors } } = useForm<UniformType>();


    const { type, mutate } = useUniformType(selectedTypeId);
    const { sizelistList } = useUniformSizelists();

    async function save(data: UniformType) {
        if (!data.usingSizes) data.fk_defaultSizelist = null;
        mutate(updateUniformType(data)).then(() => {
            setEditable(false);
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }

    useEffect(() => {
        if (type) {
            reset(type);
        }
    }, [editable]);

    if (!type) return (<></>);
    return (
        <Card data-testid="div_typeDetail">
            <CardHeader
                title={type.name}
                testId="div_header"
                tooltipIconButton={editable ? undefined :
                    <TooltipIconButton
                        icon={faEdit}
                        buttonSize="sm"
                        variant="outline-primary"
                        onClick={() => setEditable(true)}
                        buttonClass="ms-2"
                        tooltipText={t('common.actions.edit')}
                        testId="btn_edit" />
                }
            />
            <form onSubmit={handleSubmit(save)}>
                <CardBody>
                    {editable ?
                        <Row className="m-4">
                            <FormGroup>
                                <FormLabel className="mb-0">
                                    {tType('name')}:
                                </FormLabel>
                                <FormControl
                                    className="w-auto"
                                    isInvalid={!!(errors?.name)}
                                    {...register("name", {
                                        required: {
                                            value: true,
                                            message: t('common.error.string.required'),
                                        },
                                        pattern: {
                                            value: nameValidationPattern,
                                            message: t('common.error.string.noSpecialChars'),
                                        },
                                        maxLength: {
                                            value: 10,
                                            message: t('common.error.string.maxLength', { value: 10 }),
                                        }
                                    })}
                                />
                                <div data-testid="err_name" className="text-danger fs-7">
                                    {errors?.name?.message}
                                </div>
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('acronym')}:
                                </FormLabel>
                                <FormControl
                                    className="w-25"
                                    isInvalid={!!(errors?.acronym)}
                                    {...register("acronym", {
                                        required: {
                                            value: true,
                                            message: t('common.error.string.required'),
                                        },
                                        pattern: {
                                            value: acronymValidationPattern,
                                            message: t('common.error.uniform.acronym.pattern'),
                                        },
                                        maxLength: {
                                            value: 2,
                                            message: t('common.error.uniform.acronym.length'),
                                        }
                                    })}
                                />
                                <div data-testid="err_acronym" className="text-danger fs-7">
                                    {errors?.acronym?.message}
                                </div>
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('issuedDefault')}:
                                </FormLabel>
                                <FormControl
                                    className="w-25"
                                    isInvalid={!!(errors.issuedDefault)}
                                    inputMode="numeric"
                                    {...register("issuedDefault", {
                                        valueAsNumber: true,
                                        required: {
                                            value: true,
                                            message: t('common.error.amount.required')
                                        },
                                        validate: (value) => (Number.isInteger(value) && value >= 0) || t('common.error.number.patternPositive'),
                                        max: {
                                            value: 10,
                                            message: t('common.error.amount.max', { value: 10 }),
                                        },
                                    })}
                                />
                                <div data-testid="err_issuedDefault" className="text-danger fs-7">
                                    {errors.issuedDefault?.message}
                                </div>
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('usingGenerations')}:
                                </FormLabel>
                                <FormCheck
                                    type="switch"
                                    {...register("usingGenerations")}
                                />
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('usingSizes')}:
                                </FormLabel>
                                <FormCheck
                                    type="switch"
                                    disabled={!sizelistList}
                                    {...register("usingSizes")}
                                />
                            </FormGroup>
                            {watch("usingSizes") &&
                                <FormGroup className="mt-2">
                                    <FormLabel className="mb-0">
                                        {tType('defaultSizelist')}:
                                    </FormLabel>
                                    <FormSelect
                                        className="w-auto"
                                        isInvalid={!!(errors?.fk_defaultSizelist)}
                                        {...register("fk_defaultSizelist", {
                                            required: {
                                                value: true,
                                                message: t('common.error.pleaseSelect'),
                                            }
                                        })}
                                    >
                                        {sizelistList?.map(sizelist =>
                                            <option key={sizelist.id} value={sizelist.id}>{sizelist.name}</option>
                                        )}
                                    </FormSelect>
                                    <div data-testid="err_defaultSL" className="text-danger fs-7">
                                        {errors.fk_defaultSizelist?.message}
                                    </div>
                                </FormGroup>
                            }
                        </Row>
                        :
                        <Row className="my-3 mx-0">
                            <Col xs={6} className="text-end p-0">
                                {tType('name')}:
                            </Col>
                            <Col data-testid="div_name" xs={6}>
                                {type.name}
                            </Col>
                            <Col xs={6} className="text-end p-0">
                                {tType('acronym')}:
                            </Col>
                            <Col data-testid="div_acronym" xs={6}>
                                {type.acronym}
                            </Col>
                            <Col xs={6} className="text-end p-0">
                                {tType('issuedDefault')}:
                            </Col>
                            <Col data-testid="div_issuedDefault" xs={6}>
                                {type.issuedDefault}
                            </Col>
                            <Col xs={6} className="text-end p-0">
                                {tType('usingGenerations')}:
                            </Col>
                            <Col data-testid="div_usingGenerations" xs={6}>
                                {type.usingGenerations ? t('common.yes') : t('common.no')}
                            </Col>
                            <Col xs={6} className="text-end p-0">
                                {tType('usingSizes')}:
                            </Col>
                            <Col data-testid="div_usingSizes" xs={6}>
                                {type.usingSizes ? t('common.yes') : t('common.no')}
                            </Col>
                            {type.usingSizes &&
                                <Col xs={6} className="text-end p-0">
                                    {tType('defaultSizelist')}:
                                </Col>
                            }
                            {type.usingSizes &&
                                <Col data-testid="div_defaultSL" xs={6}>
                                    {type.fk_defaultSizelist
                                        ? (sizelistList?.find(sl => sl.id === type.fk_defaultSizelist)?.name)
                                        : "-"}
                                </Col>
                            }
                        </Row>
                    }
                </CardBody>
                {
                    editable &&
                    <CardFooter>
                        <Col xs={"auto"} className="m-1">
                            <Button data-testid="btn_cancel" variant="outline-danger" size="sm" onClick={() => setEditable(false)}>
                                {t('common.actions.cancel')}
                            </Button>
                        </Col >
                        <Col xs={"auto"} className="m-1">
                            <Button data-testid="btn_save" variant="outline-primary" size="sm" type="submit">
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </CardFooter>
                }
            </form>
        </Card>
    );
}
