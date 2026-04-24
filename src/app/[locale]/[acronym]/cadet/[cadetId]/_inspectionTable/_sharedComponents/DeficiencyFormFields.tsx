"use client";

import { AutocompleteFormField } from "@/components/fields/AutocompleteFormField";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { useCadetUniformDescriptList } from "@/dataFetcher/cadet";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useMaterialConfiguration } from "@/dataFetcher/material";
import { useI18n } from "@/lib/locales/client";
import { DeficiencyType } from "@/types/deficiencyTypes";
import { MaterialGroup } from "@/types/globalMaterialTypes";
import { useState } from "react";
import { Col } from "react-bootstrap";
import { FieldValues, useFormContext } from "react-hook-form";

type Props = {
    /**
     * Dot-separated field name prefix.
     * Use `"newDeficiencyList.0"` for the inspection form, or `""` for standalone.
     */
    namePrefix: string;
    /** CadetId for fetching uniform and material option lists */
    cadetId: string;
    /** When true, the type selector is disabled (prevents changing the type) */
    typeSelectDisabled?: boolean;
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
export function DeficiencyFormFields({ namePrefix, cadetId, typeSelectDisabled }: Props) {
    const t = useI18n();
    const n = (field: string) => buildName(namePrefix, field);

    const { deficiencyTypeList } = useDeficiencyTypes();
    const { config: materialConfig } = useMaterialConfiguration();
    const { uniformLabels } = useCadetUniformDescriptList(cadetId);

    const { setValue, getValues } = useFormContext<FieldValues>();
    const [selectedDefType, setSelectedDefType] = useState<DeficiencyType | undefined>(() => {
        const typeId = getValues(n("typeId"));
        return deficiencyTypeList?.find((t) => t.id === typeId);
    });

    const deficiencyTypeOptions =
        deficiencyTypeList?.map((type) => ({ value: type.id, label: type.name })) ?? [];
    const uniformOptions =
        uniformLabels?.map((item) => ({ value: item.id, label: item.description })) ?? [];
    const materialOptions = buildMaterialOptions(materialConfig);

    const handleTypeChange = (typeId: string | number) => {
        const type = deficiencyTypeList?.find((t) => t.id === typeId);
        setSelectedDefType(type);

        setValue(n("uniformId"), "");
        setValue(n("materialId"), "");
        setValue(n("description"), "");
    }

    return (
        <>
            <Col xs={"10"} sm={"5"}>
                <SelectFormField
                    required
                    name={n("typeId")}
                    label={t("common.type")}
                    options={deficiencyTypeOptions}
                    disabled={typeSelectDisabled}
                    onValueChange={handleTypeChange}
                />
            </Col>

            {selectedDefType?.dependent === "cadet" && selectedDefType?.relation === null && (
                <Col xs={"12"} sm={6}>
                    <InputFormField
                        name={n("description")}
                        label={t("common.description")}
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
                        />
                    </Col>
                )}

            {selectedDefType?.dependent === "cadet" &&
                selectedDefType?.relation === "material" && (
                    <Col xs={"10"} sm={5}>
                        <AutocompleteFormField
                            name={n("materialId")}
                            label={t("common.material.material")}
                            options={materialOptions}
                            required
                        />
                    </Col>
                )}

            <Col xs={11} className="pe-0 pt-1">
                <TextareaFormField
                    name={n("comment")}
                    label={t("common.comment")}
                    rows={2}
                    maxLength={1000}
                />
            </Col>
        </>
    );
}

// -----------  Helpers  -----------

/**
 * Builds autocomplete options from material configuration.
 *
 * - Groups with 0 types: excluded.
 * - Groups with exactly 1 type: label = group description, value = type id.
 * - Groups with >1 types: label = "{groupName}-{typeName}", value = type id.
 */
function buildMaterialOptions(config: MaterialGroup[] | undefined): { value: string; label: string }[] {
    if (!config) return [];
    const options: { value: string; label: string }[] = [];
    for (const group of config) {
        if (group.typeList.length === 0) continue;
        if (group.typeList.length === 1) {
            options.push({ value: group.typeList[0].id, label: group.description });
        } else {
            for (const type of group.typeList) {
                options.push({ value: type.id, label: `${group.description}-${type.typename}` });
            }
        }
    }
    return options;
}
