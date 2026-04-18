"use client";

import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { useCadetMaterialDescriptionList, useCadetUniformDescriptList } from "@/dataFetcher/cadet";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useMaterialConfiguration, useMaterialTypeList } from "@/dataFetcher/material";
import { useI18n } from "@/lib/locales/client";
import { DeficiencyType } from "@/types/deficiencyTypes";
import { useEffect, useRef, useState } from "react";
import { Col } from "react-bootstrap";
import { Control, FieldValues, useFormContext, useWatch } from "react-hook-form";

type Props = {
    /** react-hook-form control used for watching field values */
    control: Control<FieldValues>;
    /**
     * Dot-separated field name prefix.
     * Use `"newDeficiencyList.0"` for the inspection form, or `""` for standalone.
     */
    namePrefix: string;
    /** CadetId for fetching uniform and material option lists */
    cadetId: string;
    /** When true, the type selector is disabled (prevents changing the type) */
    disabled?: boolean;
};

/** Builds a prefixed field name. */
const buildName = (namePrefix: string, field: string): string =>
    namePrefix ? `${namePrefix}.${field}` : field;

/**
 * Shared deficiency form fields.
 *
 * Renders a type selector, conditional description / uniform / material selectors,
 * and a comment textarea. Returns Col fragments to be placed inside a Bootstrap Row.
 * Resets dependent fields whenever the selected type changes.
 */
export function DeficiencyFormFields({ control, namePrefix, cadetId, disabled }: Props) {
    const t = useI18n();
    const { setValue } = useFormContext<FieldValues>();
    const [selectedDefType, setSelectedDefType] = useState<DeficiencyType | undefined>(undefined);

    const n = (field: string) => buildName(namePrefix, field);

    const { deficiencyTypeList } = useDeficiencyTypes();
    const { uniformLabels } = useCadetUniformDescriptList(cadetId);

    const typeId = useWatch({ control, name: n("typeId") });
    const materialId = useWatch({ control, name: n("materialId") });

    const deficiencyTypeOptions =
        deficiencyTypeList?.map((type) => ({ value: type.id, label: type.name })) ?? [];
    const uniformOptions =
        uniformLabels?.map((item) => ({ value: item.id, label: item.description })) ?? [];

    const showExtendedMaterialSelects =
        selectedDefType?.dependent === "cadet" &&
        selectedDefType?.relation === "material" &&
        materialId === "other";

    // Skip resetting dependent fields on first render (avoids wiping pre-loaded values)
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!deficiencyTypeList) {
            setSelectedDefType(undefined);
            return;
        }
        const type = deficiencyTypeList.find((t) => t.id === typeId);

        if (!isFirstRender.current) {
            setValue(n("uniformId"), "");
            setValue(n("materialId"), "");
            setValue(n("otherMaterialGroupId"), "");
            setValue(n("otherMaterialId"), "");
        }
        isFirstRender.current = false;
        setSelectedDefType(type);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deficiencyTypeList, typeId]);

    return (
        <>
            <Col xs={"10"} sm={"5"}>
                <SelectFormField
                    required
                    name={n("typeId")}
                    label={t("common.type")}
                    options={deficiencyTypeOptions}
                    disabled={disabled}
                    hookFormValidation
                />
            </Col>

            {selectedDefType?.dependent === "cadet" && selectedDefType?.relation === null && (
                <Col xs={"12"} sm={6}>
                    <InputFormField
                        name={n("description")}
                        label={t("common.description")}
                        hookFormValidation
                        maxLength={30}
                    />
                </Col>
            )}

            {selectedDefType &&
                (selectedDefType.dependent === "uniform" ||
                    selectedDefType.relation === "uniform") && (
                    <Col xs={"10"} sm={5}>
                        <SelectFormField
                            required
                            name={n("uniformId")}
                            label={t("common.uniform.item", { count: 1 })}
                            options={uniformOptions}
                            hookFormValidation
                        />
                    </Col>
                )}

            {selectedDefType?.dependent === "cadet" &&
                selectedDefType?.relation === "material" && (
                    <Col xs={"10"} sm={5}>
                        <MaterialSelect namePrefix={namePrefix} cadetId={cadetId} />
                    </Col>
                )}

            {showExtendedMaterialSelects && (
                <Col xs={"10"} sm={5}>
                    <MaterialGroupSelect namePrefix={namePrefix} />
                </Col>
            )}

            {showExtendedMaterialSelects && (
                <Col xs={"10"} sm={5}>
                    <MaterialTypeSelect namePrefix={namePrefix} control={control} />
                </Col>
            )}

            <Col xs={11} className="pe-0 pt-1">
                <TextareaFormField
                    name={n("comment")}
                    label={t("common.comment")}
                    rows={2}
                    maxLength={300}
                    hookFormValidation
                />
            </Col>
        </>
    );
}

// -----------  Sub-components  -----------

const MaterialSelect = ({
    namePrefix,
    cadetId,
}: {
    namePrefix: string;
    cadetId: string;
}) => {
    const t = useI18n();
    const { setValue } = useFormContext<FieldValues>();
    const { materialList } = useCadetMaterialDescriptionList(cadetId);
    const n = (field: string) => buildName(namePrefix, field);

    const options = [
        ...(materialList?.map((item) => ({ value: item.id, label: item.description })) ?? []),
        { value: "other", label: t("cadetDetailPage.inspection.label.otherMaterials") },
    ];

    if (!materialList) return <></>;

    return (
        <SelectFormField
            name={n("materialId")}
            label={t("common.material.material")}
            options={options}
            required
            onValueChange={() => {
                setValue(n("otherMaterialGroupId"), null);
                setValue(n("otherMaterialId"), null);
            }}
            hookFormValidation
        />
    );
};

const MaterialGroupSelect = ({ namePrefix }: { namePrefix: string }) => {
    const t = useI18n();
    const { setValue } = useFormContext<FieldValues>();
    const { config } = useMaterialConfiguration();
    const n = (field: string) => buildName(namePrefix, field);

    if (!config) return null;

    const options = config.map((group) => ({ value: group.id, label: group.description }));

    return (
        <SelectFormField
            name={n("otherMaterialGroupId")}
            label={t("common.material.group_one")}
            options={options}
            required
            onValueChange={() => {
                setValue(n("otherMaterialId"), null);
            }}
            hookFormValidation
        />
    );
};

const MaterialTypeSelect = ({
    namePrefix,
    control,
}: {
    namePrefix: string;
    control: Control<FieldValues>;
}) => {
    const t = useI18n();
    const n = (field: string) => buildName(namePrefix, field);
    const groupId = useWatch({ control, name: n("otherMaterialGroupId") }) as string | null;
    const list = useMaterialTypeList(groupId ?? undefined);

    if (!list) return <></>;
    const options = list.map((item) => ({ value: item.id, label: item.typename }));

    return (
        <SelectFormField
            required
            name={n("otherMaterialId")}
            label={t("common.material.type_one")}
            options={options}
            hookFormValidation
            disabled={!groupId || groupId === "null" || options.length === 0}
        />
    );
};
