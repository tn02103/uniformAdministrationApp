"use client";

import { deleteMaterialGroup, updateMaterialGroup } from "@/actions/controllers/MaterialController";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/card";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n } from "@/lib/locales/client";
import { AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { materialGroupFormSchema, MaterialGroupFormType } from "@/zod/material";
import { zodResolver } from "@hookform/resolvers/zod";
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

    const { register, handleSubmit, formState: { errors }, reset } = useForm<MaterialGroupFormType>({
        mode: "onChange",
        values: materialGroup,
        resolver: zodResolver(materialGroupFormSchema)
    });

    useEffect(() => {
        if (!editable && materialGroup) {
            reset({
                description: materialGroup.description,
                issuedDefault: materialGroup.issuedDefault ?? null,
                multitypeAllowed: materialGroup.multitypeAllowed,
            });
        }
    }, [materialGroup, reset, editable])

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
            issuedDefault = Number(data.issuedDefault);
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
                                        validate: (value) => (!config.find(g => (g.id !== materialGroup.id && g.description === value))) || t('admin.material.error.groupNameDuplicate')
                                    })} />
                                <ErrorMessage testId="err_name" error={errors.description?.message} />
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
                                    {...register("issuedDefault", { setValueAs: (value) => String(value).length == 0 ? null : +value })}
                                />
                                <ErrorMessage testId="err_issuedDefault" error={errors.issuedDefault?.message}/>
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
