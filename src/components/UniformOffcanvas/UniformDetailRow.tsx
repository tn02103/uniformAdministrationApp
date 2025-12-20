import { updateUniformItem } from "@/dal/uniform/item/_index";
import { useUniformGenerationListByType, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { getUniformSizelist } from "@/lib/uniformHelper";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { getUniformFormSchema, UniformFormType } from "@/zod/uniform";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { SelectFormField } from "../fields/SelectFormField";
import { TextareaFormField } from "../fields/TextareaFormField";
import { ToggleFormField } from "../fields/ToggleFormField";
import { useGlobalData } from "../globalDataProvider";

export type UniformDetailRowProps = {
    uniform: UniformWithOwner;
    uniformType: UniformType;
    editable: boolean;
    setEditable: (editable: boolean) => void;
    onSave: () => void;
}

export const UniformDetailRow = ({ uniform, uniformType, editable, setEditable, onSave }: UniformDetailRowProps) => {
    const getUniformFormData = useCallback((uniform: UniformWithOwner): UniformFormType => {
        return {
            id: uniform.id,
            number: uniform.number,
            generation: uniform.generation?.id,
            size: uniform.size?.id,
            comment: uniform.comment || "",
            isReserve: !!(uniform.isReserve || (uniform.generation?.isReserve && uniformType.usingGenerations)),
        }
    }, [uniformType.usingGenerations]);


    // HOOKS
    const t = useI18n();
    const form = useForm<UniformFormType>({
        mode: 'onTouched',
        defaultValues: getUniformFormData(uniform),
        resolver: zodResolver(getUniformFormSchema(uniformType.usingGenerations, uniformType.usingSizes)),
    });
    const { reset, handleSubmit, watch, setValue, setError } = form;

    // DATA Fetcher
    const { generationList } = useUniformGenerationListByType(uniform.type.id);
    const { sizelists } = useGlobalData();
    const { typeList } = useUniformTypeList();
    const selectedGeneration = watch('generation');
    const selectedSizeId = watch('size');
    const { match: isSizeXS } = useBreakpoint("xs", 'eq');

    // DATA PROCESSING
    const sizelist = useMemo(() => {
        if (!typeList) return null;
        return getUniformSizelist({
            type: uniformType,
            generationId: selectedGeneration,
            sizelists: sizelists,
        });
    }, [typeList, uniformType, selectedGeneration, sizelists]);

    const sizeOptions = useMemo(() => {
        if (!editable) {
            if (uniform.size)
                return [{ value: uniform.size?.id, label: uniform.size?.name }];
            return []
        }
        return sizelist?.uniformSizes.map(s => ({ value: s.id, label: s.name })) || [];
    }, [sizelist, editable, uniform.size]);

    const generationOptions = useMemo(() => {
        return generationList?.map(g => ({ value: g.id, label: g.name })) || [];
    }, [generationList]);

    // USE EFFECTS
    useEffect(() => {
        if (!editable) {
            reset(getUniformFormData(uniform));
        }
    }, [uniform, editable, reset, getUniformFormData]);

    useEffect(() => {
        if (editable && selectedSizeId && sizeOptions) {
            const selectedSize = sizeOptions.find(s => s.value === selectedSizeId);
            if (!selectedSize) {
                setValue("size", "");
            }
        }
    }, [selectedSizeId, sizeOptions, setValue, editable]);

    // DATA HANDLERS
    const handleSave = async (data: UniformFormType) => {
        await SAFormHandler<UniformWithOwner, UniformFormType>(
            updateUniformItem(data),
            setError,
            (result) => {
                setEditable(false);
                reset(getUniformFormData(result));
                onSave();
            },
            t('common.error.actions.save')
        );
    }

    return (
        <FormProvider {...form}>
            <form noValidate autoComplete="off" onSubmit={handleSubmit(handleSave)} className="mb-4">
                <Row className="mb-3 mt-2 justify-content-between">
                    <Col xs={(uniformType.usingGenerations && uniformType.usingSizes) ? 12 : 5} sm={"auto"} style={{ minWidth: "120px" }}>
                        <StatusToggleField
                            translations={{
                                label: t('common.status'),
                                active: t('common.uniform.state.active'),
                                isReserve: t('common.uniform.state.isReserve'),
                            }}
                            uniformType={uniformType}
                            uniform={uniform}
                            editable={editable}
                        />
                    </Col>
                    {uniformType.usingGenerations &&
                        <Col xs={7} sm={"auto"} style={{ minWidth: (uniformType.usingSizes || isSizeXS) ? undefined : "300px" }}>
                            <SelectFormField<UniformFormType>
                                name="generation"
                                label={t('common.uniform.generation.label', { count: 1 })}
                                formName="uniform"
                                disabled={!editable}
                                plaintext={!editable}
                                options={generationOptions}
                            />
                        </Col>
                    }
                    {uniformType.usingSizes &&
                        <Col xs={5} sm={"auto"} className="p-0" style={{ minWidth: isSizeXS ? undefined : uniformType.usingGenerations ? "100px" : "300px" }}>
                            <SelectFormField<UniformFormType>
                                name="size"
                                label={t('common.uniform.size')}
                                formName="uniform"
                                disabled={!editable}
                                plaintext={!editable}
                                options={sizeOptions}
                            />
                        </Col>
                    }
                    <Col xs={12}>
                        <TextareaFormField<UniformFormType>
                            name="comment"
                            label={t('common.comment')}
                            formName="uniform"
                            disabled={!editable}
                            plaintext={!editable}
                            rows={2}
                        />
                    </Col>
                </Row>
                {editable &&
                    <Row className="justify-content-evenly">
                        <Col xs="auto">
                            <Button
                                variant="outline-secondary"
                                type="button"
                                onClick={() => {
                                    setEditable(false);
                                    reset(getUniformFormData(uniform));
                                }}
                            >
                                {t('common.actions.cancel')}
                            </Button>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="outline-primary"
                                type="submit"
                            >
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </Row>
                }
            </form>
        </FormProvider>
    )
}

type StatusToggleFieldProps = {
    uniformType: UniformType;
    uniform: UniformWithOwner;
    editable: boolean;
    translations: {
        label: string;
        active: string;
        isReserve: string;
    }
}
const StatusToggleField = ({ translations, uniformType, uniform, editable }: StatusToggleFieldProps) => {
    const { setValue } = useFormContext<UniformFormType>();
    const [isReserveFormValue, generationId] = useWatch({ name: ["isReserve", "generation"] });

    const selectedGeneration = uniformType.usingGenerations
        ? uniformType.uniformGenerationList.find(g => g.id === generationId)
        : undefined;

    const isReserve = useMemo(() => {
        if (!uniformType.usingGenerations || !selectedGeneration) {
            return isReserveFormValue;
        }
        return selectedGeneration.isReserve || isReserveFormValue;
    }, [uniformType.usingGenerations, selectedGeneration, isReserveFormValue]);

    const isGenerationReserve = useMemo(
        () => !!(selectedGeneration && selectedGeneration.isReserve),
        [selectedGeneration]
    );

    useEffect(() => {
        if (isGenerationReserve) {
            setValue("isReserve", true);
        } else {
            setValue("isReserve", uniform.isReserve);
        }
    }, [isGenerationReserve, uniform.isReserve, setValue]);

    return (
        <ToggleFormField<UniformFormType>
            label={translations.label}
            name={"isReserve"}
            formName="uniform"
            disabled={!editable || isGenerationReserve}
            hideToggle={!editable}
            toggleText={isReserve ? translations.isReserve : translations.active}
        />
    )
}
