import TooltipIconButton from "@/components/TooltipIconButton";
import { useCadetMaterialDescriptionList, useCadetUniformDescriptList } from "@/dataFetcher/cadet";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useMaterialConfiguration, useMaterialTypeList } from "@/dataFetcher/material";
import { useI18n } from "@/lib/locales/client";
import { commentValidationPattern, nameValidationPattern } from "@/lib/validations";
import { DeficiencyType } from "@/types/deficiencyTypes";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { ParamType } from "../page";
import { FormType } from "./card";


export default function NewDeficiencyRow({
    index,
    remove,
}: {
    index: number;
    remove: () => void;
}) {
    const t = useI18n();
    const { watch, setValue, getValues } = useFormContext<FormType>();
    const [selectedDefType, setSelectedDefType] = useState<DeficiencyType>();

    const { deficiencyTypeList } = useDeficiencyTypes();

    useEffect(() => {
        const id = watch(`newDeficiencyList.${index}.typeId`);
        if (!deficiencyTypeList || !id) {
            setSelectedDefType(undefined);
            return;
        }
        const type = deficiencyTypeList?.find(t => t.id === id);
        if (selectedDefType && !getValues(`newDeficiencyList.${index}.dateCreated`)) {
            setValue(`newDeficiencyList.${index}.fk_uniform`, "");
            setValue(`newDeficiencyList.${index}.fk_material`, "");
            setValue(`newDeficiencyList.${index}.materialId`, "");
            setValue(`newDeficiencyList.${index}.materialGroup`, "");
            setValue(`newDeficiencyList.${index}.materialType`, "");
        }

        setSelectedDefType(type);
    }, [watch(`newDeficiencyList.${index}.typeId`)])

    return (
        <Row data-testid={`div_newDef_${index}`} className="p-2 m-0 border-top border-1 border-dark">
            <Col xs={"10"} sm={"5"}>
                <DeficiencyTypeSelect index={index} />
            </Col>
            <Col xs={1} className="align-self-center p-0 pt-3 d-sm-none" align="right">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t('common.actions.delete')}
                    onClick={remove}
                    testId="btn_delete_mobile" />
            </Col>
            {(selectedDefType && (selectedDefType.dependend === "cadet") && (selectedDefType.relation === null)) &&
                <Col xs={"12"} sm={6}>
                    <DescriptionControl index={index} />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependend === "uniform") || (selectedDefType.relation === "uniform"))) &&
                <Col xs={"10"} sm={5}>
                    <UniformSelect index={index} />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependend === "cadet") && (selectedDefType.relation === "material"))) &&
                <Col xs={"10"} sm={5}>
                    <MaterialSelect index={index} />
                </Col>
            }
            <Col xs={"1"} className="d-none d-sm-inline align-self-center p-0 pt-3 pe-3" align="right">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t('common.actions.delete')}
                    onClick={remove}
                    testId="btn_delete" />
            </Col>
            {(selectedDefType && ((selectedDefType.dependend === "cadet") && (selectedDefType.relation === "material")))
                && (watch(`newDeficiencyList.${index}.materialId`) === "others") &&
                <Col xs={"10"} sm={5}>
                    <MaterialGroupSelect index={index} />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependend === "cadet") && (selectedDefType.relation === "material")))
                && (watch(`newDeficiencyList.${index}.materialId`) === "others") &&
                <Col xs={"10"} sm={5}>
                    <MaterialTypeSelect index={index} />
                </Col>
            }
            <Col xs={11} className="pe-0 pt-1">
                <CommentControl index={index} />
            </Col>
        </Row>
    )
}
const DeficiencyTypeSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, watch, formState: { errors } } = useFormContext<FormType>();

    const created = !!watch(`newDeficiencyList.${index}.dateCreated`);
    const { deficiencyTypeList } = useDeficiencyTypes();
    if (!deficiencyTypeList) return <></>
    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.type')}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    {deficiencyTypeList
                        ? <Form.Select
                            disabled={created}
                            isInvalid={!!(errors?.newDeficiencyList && errors?.newDeficiencyList[index]?.typeId)}
                            {...register(
                                `newDeficiencyList.${index}.typeId`,
                                {
                                    required: {
                                        value: true,
                                        message: t('common.error.pleaseSelect')
                                    }
                                }
                            )}
                        >
                            {deficiencyTypeList.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </Form.Select>
                        : <div className="fs-7">
                            ...{t('common.loading')}
                        </div>
                    }
                </Col>
                <Col data-testid={`err_type`} className="fs-7 text-danger">
                    {errors?.newDeficiencyList
                        && errors.newDeficiencyList[index]?.typeId?.message}
                </Col>
            </Row >
        </>
    )
}

const DescriptionControl = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, formState: { errors } } = useFormContext<FormType>();

    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.description')}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Control
                        type="text"
                        isInvalid={!!(errors?.newDeficiencyList && errors?.newDeficiencyList[index]?.description)}
                        {...register(`newDeficiencyList.${index}.description`, {
                            required: {
                                value: true,
                                message: t('common.error.string.required'),
                            },
                            pattern: {
                                value: nameValidationPattern,
                                message: t('common.error.string.noSpecialChars'),
                            },
                            maxLength: {
                                value: 30,
                                message: t('common.error.string.maxLength', { value: 30 }),
                            }
                        })} />
                </Col>
                <Col data-testid="err_description" className="fs-7 text-danger">
                    {errors?.newDeficiencyList?.[index]?.description?.message}
                </Col>
            </Row>
        </>
    )
}

const UniformSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, watch, formState: { errors } } = useFormContext<FormType>();
    const { cadetId }: ParamType = useParams();
    const uniformList = useCadetUniformDescriptList(cadetId);

    if (!uniformList) return <></>
    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.uniform.item', { count: 1 })}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Select
                        isInvalid={!!(errors?.newDeficiencyList && errors.newDeficiencyList[index]?.fk_uniform)}
                        {...register(
                            `newDeficiencyList.${index}.fk_uniform`,
                            {
                                required: {
                                    value: true,
                                    message: t('common.error.pleaseSelect')
                                }
                            })}>
                        <option value={""} disabled>Bitte Auswählen</option>
                        {uniformList?.map((item) => (
                            <option key={item.id} value={item.id}>{item.description}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col data-testid="err_uItem" className="fs-7 text-danger">
                    {errors?.newDeficiencyList?.[index]?.fk_uniform?.message}
                </Col>
            </Row>
        </>
    )
}

const MaterialSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, setValue, formState: { errors } } = useFormContext<FormType>();
    const { cadetId }: ParamType = useParams();
    const materialList = useCadetMaterialDescriptionList(cadetId);

    if (!materialList) return <></>
    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.material.material')}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Select
                        isInvalid={!!(errors?.newDeficiencyList && errors.newDeficiencyList[index]?.materialId)}
                        {...register(
                            `newDeficiencyList.${index}.materialId`,
                            {
                                required: {
                                    value: true,
                                    message: t('common.error.pleaseSelect')
                                },
                                onChange: () => {
                                    setValue(`newDeficiencyList.${index}.materialGroup`, "")
                                    setValue(`newDeficiencyList.${index}.materialType`, "")
                                }
                            })}>
                        <option value={""} disabled>Bitte Auswählen</option>
                        {materialList?.map((item) => (
                            <option key={item.id} value={item.id}>{item.description}</option>
                        ))}
                        <option value={"others"}>Andere Materialien</option>
                    </Form.Select>
                </Col>
                <Col data-testid="err_uItem" className="fs-7 text-danger">
                    {errors?.newDeficiencyList?.[index]?.materialId?.message}
                </Col>
            </Row>
        </>
    )
}


const MaterialGroupSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, setValue, formState: { errors } } = useFormContext<FormType>();
    const { config } = useMaterialConfiguration();

    if (!config) return <></>
    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.material.group_one')}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Select
                        isInvalid={!!(errors?.newDeficiencyList && errors.newDeficiencyList[index]?.materialGroup)}
                        {...register(
                            `newDeficiencyList.${index}.materialGroup`,
                            {
                                required: {
                                    value: true,
                                    message: t('common.error.pleaseSelect')
                                },
                                onChange: () => { setValue(`newDeficiencyList.${index}.materialType`, "") }
                            })}>
                        <option value={""} disabled>Bitte Auswählen</option>
                        {config?.map((group) => (
                            <option key={group.id} value={group.id}>{group.description}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col data-testid="err_uItem" className="fs-7 text-danger">
                    {errors?.newDeficiencyList?.[index]?.materialGroup?.message}
                </Col>
            </Row>
        </>
    )
}

const MaterialTypeSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, watch, getValues, setValue, formState: { errors } } = useFormContext<FormType>();
    const groupId = watch(`newDeficiencyList.${index}.materialGroup`);
    const list = useMaterialTypeList(groupId);

    // needed to updated SelectOption
    useEffect(() => {
        const x = getValues(`newDeficiencyList.${index}.materialType`);
        setValue(`newDeficiencyList.${index}.materialType`, x);
    }, [list])

    if (!list) return <></>
    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.material.type_one')}*
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Select
                        isInvalid={!!(errors?.newDeficiencyList && errors.newDeficiencyList[index]?.materialType)}
                        {...register(
                            `newDeficiencyList.${index}.materialType`,
                            {
                                required: {
                                    value: true,
                                    message: t('common.error.pleaseSelect')
                                }
                            })}>
                        <option value={""} disabled>Bitte Auswählen</option>
                        {list.map((mat) => (
                            <option key={mat.id} value={mat.id}>{mat.typename}</option>
                        ))}
                    </Form.Select>
                </Col>
                <Col data-testid="err_uItem" className="fs-7 text-danger">
                    {errors?.newDeficiencyList?.[index]?.materialType?.message}
                </Col>
            </Row>
        </>
    )
}

const CommentControl = ({ index }: { index: number }) => {
    const t = useI18n();
    const { register, getValues, formState: { errors } } = useFormContext<FormType>();

    return (
        <>
            <Row className="fs-8 fw-bold fst-italic">
                <Col xs={12}>
                    {t('common.comment')}
                </Col>
            </Row>
            <Row className="fw-bold">
                <Col xs={12}>
                    <Form.Control
                        rows={(getValues(`newDeficiencyList.${index}.comment`).length / 35) - 1}
                        as="textarea"
                        {...register(
                            `newDeficiencyList.${index}.comment`,
                            {
                                pattern: {
                                    value: commentValidationPattern,
                                    message: t('common.error.string.commentValidation'),
                                },
                                maxLength: {
                                    value: 300,
                                    message: t('common.error.string.maxLength', { value: 300 }),
                                }
                            })}
                    />
                </Col>
                <Col data-testid="err_comment" className="fs-7 text-danger">
                    {errors?.newDeficiencyList && errors.newDeficiencyList[index]?.comment?.message}
                </Col>
            </Row>
        </>
    )
}
