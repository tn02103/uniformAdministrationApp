"use client"

import { updateUniformType } from "@/actions/controllers/UniformConfigController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useUniformSizeLists, useUniformType } from "@/dataFetcher/uniformAdmin";
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
    const { sizelistList } = useUniformSizeLists();

    async function save(data: UniformType) {
        if (!data.usingSizes) data.fk_defaultSizeList = null;
        mutate(updateUniformType(data)).then(() => {
            setEditable(false);
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.save.unknown'));
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
                                            message: "Bitte einen Namen angeben"
                                        },
                                        pattern: {
                                            value: nameValidationPattern,
                                            message: "Der Name darf keine Sonderzeichen beinhalten"
                                        },
                                        maxLength: {
                                            value: 10,
                                            message: "Der Name darf nicht länger als 10 Zeichen sein"
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
                                            message: "Es muss ein Küzel angegeben werden"
                                        },
                                        pattern: {
                                            value: acronymValidationPattern,
                                            message: "Das Kürzel darf keine Sonderzeichen oder Zahlen Beinhalten"
                                        },
                                        maxLength: {
                                            value: 2,
                                            message: "Das Kürzel darf höchstens 2 Zeichen lang sein"
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
                                    {...register("issuedDefault", {
                                        valueAsNumber: true,
                                        required: {
                                            value: true,
                                            message: "Bitte eine Anzahl angeben"
                                        },
                                        validate: (value) => (Number.isInteger(value) && value >= 0) || "Bitte eine gültige positive Zahl eingeben",
                                        max: {
                                            value: 10,
                                            message: "Die Zahl darf nicht größer als 10 sein"
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
                                        {tType('defaultSizeList')}:
                                    </FormLabel>
                                    <FormSelect
                                        className="w-auto"
                                        isInvalid={!!(errors?.fk_defaultSizeList)}
                                        {...register("fk_defaultSizeList", {
                                            required: {
                                                value: true,
                                                message: "Bitte auswählen",
                                            }
                                        })}
                                    >
                                        {sizelistList?.map(sizeList =>
                                            <option key={sizeList.id} value={sizeList.id}>{sizeList.name}</option>
                                        )}
                                    </FormSelect>
                                    <div data-testid="err_defaultSL" className="text-danger fs-7">
                                        {errors.fk_defaultSizeList?.message}
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
                                    {tType('defaultSizeList')}:
                                </Col>
                            }
                            {type.usingSizes &&
                                <Col data-testid="div_defaultSL" xs={6}>
                                    {type.fk_defaultSizeList
                                        ? (sizelistList?.find(sl => sl.id === type.fk_defaultSizeList)?.name)
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
