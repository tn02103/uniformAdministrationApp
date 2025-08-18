import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { useCadetMaterialDescriptionList, useCadetUniformDescriptList } from "@/dataFetcher/cadet";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useMaterialConfiguration, useMaterialTypeList } from "@/dataFetcher/material";
import { useI18n } from "@/lib/locales/client";
import { DeficiencyType } from "@/types/deficiencyTypes";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";
import { ParamType } from "../page";


export default function NewDeficiencyRow({
    index,
    remove,
}: {
    index: number;
    remove: () => void;
}) {
    const t = useI18n();
    const { watch, setValue } = useFormContext<CadetInspectionFormSchema>();
    const [selectedDefType, setSelectedDefType] = useState<DeficiencyType>();

    const { cadetId }: ParamType = useParams();
    const { deficiencyTypeList } = useDeficiencyTypes();
    const { uniformLabels } = useCadetUniformDescriptList(cadetId);
    const [typeId, dateCreated] = useWatch<CadetInspectionFormSchema>({
        name: [`newDeficiencyList.${index}.typeId`, `newDeficiencyList.${index}.dateCreated`]
    });

    const isCreated = !!dateCreated;
    const deficiencyTypeOptions = deficiencyTypeList?.map((type) => ({ value: type.id, label: type.name })) ?? [];
    const uniformOptions = uniformLabels?.map((item) => ({ value: item.id, label: item.description })) ?? [];

    useEffect(() => {
        if (!deficiencyTypeList || !typeId) {
            setSelectedDefType(undefined);
            return;
        }
        const type = deficiencyTypeList?.find(t => t.id === typeId);
        if (!isCreated) {
            setValue(`newDeficiencyList.${index}.uniformId`, "");
            setValue(`newDeficiencyList.${index}.materialId`, "");
            setValue(`newDeficiencyList.${index}.otherMaterialGroupId`, "");
            setValue(`newDeficiencyList.${index}.otherMaterialId`, "");
        }

        setSelectedDefType(type);
    }, [deficiencyTypeList, index, isCreated, setValue, typeId]);

    return (
        <Row data-testid={`div_newDef_${index}`} className="p-2 m-0 border-top border-1 border-dark">
            <Col xs={"10"} sm={"5"}>
                <SelectFormField<CadetInspectionFormSchema>
                    required
                    name={`newDeficiencyList.${index}.typeId`}
                    label={t('common.type')}
                    options={deficiencyTypeOptions}
                    disabled={!!dateCreated}
                    hookFormValidation
                />
            </Col>
            <Col xs={1} className="align-self-center p-0 pt-3 d-sm-none" align="right">
                <TooltipIconButton
                    icon={faTrash}
                    variant="outline-danger"
                    tooltipText={t('common.actions.delete')}
                    onClick={remove}
                    testId="btn_delete_mobile" />
            </Col>
            {(selectedDefType && (selectedDefType.dependent === "cadet") && (selectedDefType.relation === null)) &&
                <Col xs={"12"} sm={6}>
                    <InputFormField<CadetInspectionFormSchema>
                        name={`newDeficiencyList.${index}.description`}
                        label={t('common.description')}
                        hookFormValidation
                        maxLength={30} />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependent === "uniform") || (selectedDefType.relation === "uniform"))) &&
                <Col xs={"10"} sm={5}>
                    <SelectFormField<CadetInspectionFormSchema>
                        required
                        name={`newDeficiencyList.${index}.uniformId`}
                        label={t('common.uniform.item', { count: 1 })}
                        options={uniformOptions}
                        hookFormValidation
                    />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependent === "cadet") && (selectedDefType.relation === "material"))) &&
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
            {(selectedDefType && ((selectedDefType.dependent === "cadet") && (selectedDefType.relation === "material")))
                && (watch(`newDeficiencyList.${index}.materialId`) === "other") &&
                <Col xs={"10"} sm={5}>
                    <MaterialGroupSelect index={index} />
                </Col>
            }
            {(selectedDefType && ((selectedDefType.dependent === "cadet") && (selectedDefType.relation === "material")))
                && (watch(`newDeficiencyList.${index}.materialId`) === "other") &&
                <Col xs={"10"} sm={5}>
                    <MaterialTypeSelect index={index} />
                </Col>
            }
            <Col xs={11} className="pe-0 pt-1">
                <TextareaFormField
                    name={`newDeficiencyList.${index}.comment`}
                    label={t('common.comment')}
                    rows={2}
                    maxLength={300}
                    hookFormValidation
                />
            </Col>
        </Row>
    );
}

const MaterialSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { setValue } = useFormContext<CadetInspectionFormSchema>();
    const { cadetId }: ParamType = useParams();
    const { materialList } = useCadetMaterialDescriptionList(cadetId);
    const options = [
        ...(materialList?.map((item) => ({ value: item.id, label: item.description })) ?? []),
        { value: "other", label: t('cadetDetailPage.inspection.otherMaterials') }
    ]

    if (!materialList) return <></>;

    return (
        <SelectFormField
            name={`newDeficiencyList.${index}.materialId`}
            label={t('common.material.material')}
            options={options}
            required
            onValueChange={() => {
                setValue(`newDeficiencyList.${index}.otherMaterialGroupId`, null);
                setValue(`newDeficiencyList.${index}.otherMaterialId`, null);
            }}
            hookFormValidation
        />
    );
}

const MaterialGroupSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const { setValue, } = useFormContext<CadetInspectionFormSchema>();
    const { config } = useMaterialConfiguration();
    if (!config) return null;

    const options = config.map((group) => ({ value: group.id, label: group.description }));

    return (
        <SelectFormField
            name={`newDeficiencyList.${index}.otherMaterialGroupId`}
            label={t('common.material.group_one')}
            options={options}
            required
            onValueChange={() => {
                setValue(`newDeficiencyList.${index}.otherMaterialId`, null);
            }}
            hookFormValidation
        />
    );
}

const MaterialTypeSelect = ({ index }: { index: number }) => {
    const t = useI18n();
    const groupId = useWatch<CadetInspectionFormSchema>({
        name: `newDeficiencyList.${index}.otherMaterialGroupId`
    }) as string | null;
    const list = useMaterialTypeList(groupId ?? undefined);

    if (!list) return <></>
    const options = list.map((item) => ({ value: item.id, label: item.typename }));

    return (
        <SelectFormField<CadetInspectionFormSchema>
            required
            name={`newDeficiencyList.${index}.otherMaterialId`}
            label={t('common.material.type_one')}
            options={options}
            hookFormValidation
            disabled={!groupId || groupId === "null" || options.length === 0}
        />
    );
}
