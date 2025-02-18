"use client"

import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import ErrorMessage from "@/components/errorMessage";
import { updateUniformType } from "@/dal/uniform/type/update";
import { useUniformSizelists, useUniformType } from "@/dataFetcher/uniformAdmin";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { uniformTypeFormSchema, UniformTypeFormType } from "@/zod/uniformConfig";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { zodResolver } from "@hookform/resolvers/zod";
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
    const { handleSubmit, register, reset, watch, formState: { errors }, setError } = useForm<UniformTypeFormType>({
        resolver: zodResolver(uniformTypeFormSchema),
        mode: "onChange",
    });

    const { type, mutate } = useUniformType(selectedTypeId);
    const { sizelistList } = useUniformSizelists();

    async function save(data: UniformTypeFormType) {
        if (!data.usingSizes) data.fk_defaultSizelist = null;
        SAFormHandler(updateUniformType(data), setError).then((result) => {
            if (result.success) {
                setEditable(false);
                mutate(result.data);
            }
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
                                    {...register("name")}
                                />
                                <ErrorMessage error={errors.name?.message} testId="err_name" />
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('acronym')}:
                                </FormLabel>
                                <FormControl
                                    className="w-50"
                                    isInvalid={!!(errors?.acronym)}
                                    {...register("acronym", {
                                        setValueAs: (value: string) => value.toUpperCase(),
                                    })}
                                />
                                <ErrorMessage error={errors.acronym?.message} testId="err_acronym" />
                            </FormGroup>
                            <FormGroup className="mt-2">
                                <FormLabel className="mb-0">
                                    {tType('issuedDefault')}:
                                </FormLabel>
                                <FormControl
                                    className="w-50"
                                    isInvalid={!!(errors.issuedDefault)}
                                    inputMode="numeric"
                                    {...register("issuedDefault", {
                                        setValueAs: (value) => String(value).length == 0 ? null : +value
                                    })}
                                />
                                <ErrorMessage error={errors.issuedDefault?.message} testId="err_issuedDefault" />
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
                                        {...register("fk_defaultSizelist")}
                                    >
                                        {sizelistList?.map(sizelist =>
                                            <option key={sizelist.id} value={sizelist.id}>{sizelist.name}</option>
                                        )}
                                    </FormSelect>
                                    <ErrorMessage error={errors.fk_defaultSizelist?.message} testId="err_defaultSL" />
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
