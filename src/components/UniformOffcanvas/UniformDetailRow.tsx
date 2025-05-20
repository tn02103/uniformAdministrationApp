import { updateUniformItem } from "@/dal/uniform/item/_index";
import { useUniformGenerationListByType, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { getUniformSizelist } from "@/lib/uniformHelper";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { Uniform, UniformType } from "@/types/globalUniformTypes";
import { getUniformFormSchema, UniformFormType } from "@/zod/uniform";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { SelectFormField } from "../fields/SelectFormField";
import { TextareaFormField } from "../fields/TextareaFormField";
import { ToggleFormField } from "../fields/ToggleFormField";
import { useGlobalData } from "../globalDataProvider";

export type UniformDetailRowProps = {
    uniform: Uniform;
    uniformType: UniformType;
    editable: boolean;
    setEditable: (editable: boolean) => void;
    onSave: () => void;
}
const getUniformFormData = (uniform: Uniform): UniformFormType => {
    return {
        id: uniform.id,
        number: uniform.number,
        generation: uniform.generation?.id,
        size: uniform.size?.id,
        comment: uniform.comment || "",
        active: uniform.active || false,
    }
}

export const UniformDetailRow = ({ uniform, uniformType, editable, setEditable, onSave }: UniformDetailRowProps) => {
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
    }, [uniform.type.id, selectedGeneration]);
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
    }, [uniform]);

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
        await SAFormHandler<Uniform, UniformFormType>(
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
                    <Col xs={(uniformType.usingGenerations && uniformType.usingSizes) ? 12 : 5} sm={"auto"}>
                        <ToggleFormField<UniformFormType>
                            label={t('common.status')}
                            name={"active"}
                            formName="uniform"
                            disabled={!editable}
                            hideToggle={!editable}
                            toggleText={t(`common.uniform.active.${form.watch('active') ? "true" : "false"}`)}
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
