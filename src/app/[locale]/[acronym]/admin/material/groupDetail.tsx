"use client";

import { deleteMaterialGroup, updateMaterialGroup } from "@/actions/controllers/MaterialController";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n } from "@/lib/locales/client";
import { descriptionValidationPattern } from "@/lib/validations";
import { AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button, Col, FormCheck, FormControl, FormGroup, FormLabel, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type FormType = {
    description: string,
    issuedDefault?: number | null | string,
    multitypeAllowed: boolean
}

export default function MaterialConfigGroupDetail({
    config
}: {
    config: AdministrationMaterialGroup[];
}) {

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const modal = useModal();
    const t = useI18n();

    const editable = searchParams.get('editable') === "true";
    const materialGroup = config.find(g => g.id === searchParams.get('selectedGroupId'));

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormType>({ mode: "onChange", values: materialGroup });

    useEffect(() => {
        if (!editable && materialGroup) {
            reset({
                description: materialGroup.description,
                issuedDefault: materialGroup.issuedDefault ?? "",
                multitypeAllowed: materialGroup.multitypeAllowed,
            });
        }
    }, [materialGroup])

    async function handleDelete() {
        if (!materialGroup) return;

        modal?.dangerConfirmationModal({
            header: t('admin.material.delete.group.header', { group: materialGroup.description }),
            message: t('admin.material.delete.group.message', { group: materialGroup.description }),
            confirmationText: t('admin.material.delete.group.confirmationText', { group: materialGroup.description }),
            dangerOption: {
                option: t('common.actions.delete'),
                function: () => deleteMaterialGroup(materialGroup.id).catch((e) => {
                    console.error(e);
                    toast.error(t('common.error.actions.delete'));
                }),
            }
        });
    }
    async function handleSave(data: FormType) {
        if (!materialGroup) return;

        let issuedDefault = null;
        if (data.issuedDefault && Number.isInteger(+data.issuedDefault) && +data.issuedDefault > 0) {
            issuedDefault = +data.issuedDefault as number;
        }

        setEditable(false);
        await updateMaterialGroup(materialGroup.id, {
            issuedDefault,
            description: data.description,
            multitypeAllowed: data.multitypeAllowed
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }
    async function setEditable(editable: boolean) {
        const params = new URLSearchParams(searchParams);
        params.set("editable", String(editable));
        router.replace(`${pathname}?${params.toString()}`);
    }
    if (!materialGroup) {
        return (<></>);
    }
    return (
        <Card data-testid="div_mGroup_detail">
            <CardHeader
                title={materialGroup.description}
                testId="div_header"
                endButton={!editable &&
                    <div>
                        <TooltipActionButton
                            variantKey="edit"
                            onClick={() => setEditable(true)} />
                        <TooltipActionButton
                            variantKey="delete"
                            onClick={handleDelete} />
                    </div>
                } />
            <form onSubmit={handleSubmit(handleSave)}>
                <CardBody>
                    <div className="p-3">
                        <FormGroup as={Row}>
                            <FormLabel column xs={editable ? "auto" : 6} lg={6} className={`text-end ${editable ? "pb-0 pt-3 py-lg-0 my-lg-auto" : ""}`}>
                                {t('common.name')}:
                            </FormLabel>
                            <Col xs={editable ? 12 : 6} lg={6}>
                                <FormControl
                                    isInvalid={!!errors.description}
                                    className={editable ? "" : " text-truncate"}
                                    disabled={!editable}
                                    plaintext={!editable}
                                    {...register("description", {
                                        required: {
                                            value: true,
                                            message: t('common.error.string.required'),
                                        },
                                        pattern: {
                                            value: descriptionValidationPattern,
                                            message: t('common.error.string.noSpecialChars'),
                                        },
                                        maxLength: {
                                            value: 20,
                                            message: t('common.error.string.maxLength', { value: 20 }),
                                        },
                                        validate: (value) => (!config.find(g => (g.id !== materialGroup.id && g.description === value))) || t('admin.material.error.groupNameDuplicate')
                                    })} />
                                <span data-testid="err_name" className="fs-7 text-danger">
                                    {errors.description?.message}
                                </span>
                            </Col>
                        </FormGroup>
                        <FormGroup as={Row}>
                            <FormLabel column xs={editable ? "auto" : 6} lg={6} className={`text-end ${editable ? "pb-0 pt-3 py-lg-auto py-lg-0 my-lg-auto" : ""}`}>
                                {t('common.material.issuedDefault')}:
                            </FormLabel>
                            <Col xs={editable ? "auto" : 6} lg={6} className="my-auto">
                                <FormControl
                                    plaintext={!editable}
                                    disabled={!editable}
                                    isInvalid={!!errors.issuedDefault}
                                    {...register("issuedDefault", {
                                        validate: (value) => {
                                            if (!value || value === "")
                                                return undefined;
                                            if (!Number.isInteger(+value))
                                                return t('common.error.number.pattern');
                                            if (+value < 0)
                                                return t('common.error.number.patternPositive');
                                            return undefined;
                                        },
                                        max: {
                                            value: 200,
                                            message: t('admin.material.error.maxIssuedDefault', { value: 200 }),
                                        }
                                    })}
                                />
                                <span data-testid="err_issuedDefault" className="fs-7 text-danger">
                                    {errors.issuedDefault?.message}
                                </span>
                            </Col>
                        </FormGroup>
                        <FormGroup as={Row}>
                            <FormLabel column xs={editable ? "auto" : 6} lg={6} className={`text-end ${editable ? "pb-0 pt-3 py-lg-0 my-lg-auto" : ""}`}>
                                {t('common.material.multitypeAllowed')}:
                            </FormLabel>
                            <Col xs={editable ? 12 : 6} lg={6} className="my-auto">
                                {editable ?
                                    <FormCheck
                                        type="switch"
                                        {...register("multitypeAllowed", {
                                            setValueAs: (value) => (value === "true")
                                        })} />
                                    : <div data-testid="div_multitypeAllowed">
                                        {materialGroup.multitypeAllowed ? t('common.yes') : t('common.no')}
                                    </div>
                                }
                            </Col>
                        </FormGroup>
                    </div>
                </CardBody>
                {editable &&
                    <CardFooter>
                        <Row className="justify-content-between">
                            <Col xs={"auto"}>
                                <Button
                                    className=""
                                    variant="outline-danger"
                                    onClick={() => {
                                        reset({
                                            description: materialGroup.description,
                                            issuedDefault: materialGroup.issuedDefault ?? undefined,
                                            multitypeAllowed: materialGroup.multitypeAllowed,
                                        });
                                        setEditable(false);
                                    }}
                                    data-testid="btn_cancel"
                                >
                                    {t('common.actions.cancel')}
                                </Button>
                            </Col>
                            <Col xs={"auto"}>
                                <Button
                                    type="submit"
                                    variant="outline-primary"
                                    data-testid="btn_save"
                                >
                                    {t('common.actions.save')}
                                </Button>
                            </Col>
                        </Row>
                    </CardFooter>
                }
            </form>
        </Card>
    )
}
