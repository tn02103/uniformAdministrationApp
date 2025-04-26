import { updateUniformItem } from "@/dal/uniform/item/_index";
import { useUniformGenerationListByType, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { getUniformSizelist } from "@/lib/uniformHelper";
import { Uniform } from "@/types/globalUniformTypes";
import { UniformFormType } from "@/zod/uniform";
import { useEffect, useMemo } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { NumberInputFormField } from "../fields/NumberInputFormField";
import { SelectFormField } from "../fields/SelectFormField";
import { TextareaFormField } from "../fields/TextareaFormField";
import { ToggleFormField } from "../fields/ToggleFormField";
import { useGlobalData } from "../globalDataProvider";

export type UniformDetailRowProps = {
    uniform: Uniform;
    editable: boolean;
    setEditable: (editable: boolean) => void;
    onSave: (data: UniformFormType) => void;
}
const getUniformFormData = (uniform: Uniform): UniformFormType => {
    return {
        id: uniform.id,
        number: uniform.number,
        generation: uniform.generation?.id || null,
        size: uniform.size?.id || null,
        comment: uniform.comment || "",
        active: uniform.active || false,
    }
}

export const UniformDetailRow = ({ uniform, editable, setEditable, onSave }: UniformDetailRowProps) => {
    // HOOKS
    const t = useI18n();
    const form = useForm<UniformFormType>({
        mode: 'onTouched',
        defaultValues: getUniformFormData(uniform),
    });
    const { reset, handleSubmit, watch, setValue, setError } = form;

    // DATA Fetcher
    const { generationList } = useUniformGenerationListByType(uniform.type.id);
    const { sizelists } = useGlobalData();
    const { typeList } = useUniformTypeList();
    const selectedGeneration = watch('generation');
    const selectedSizeId = watch('size');

    // DATA PROCESSING
    const sizelist = useMemo(() => {
        if (!typeList) return null;
        return getUniformSizelist({
            type: uniform.type.id,
            generationId: selectedGeneration,
            typeList: typeList,
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
                setValue("size", null);
            }
        }
    }, [selectedSizeId, sizeOptions, setValue, editable]);

    // DATA HANDLERS
    const handleSave = async (data: UniformFormType) => {
        await SAFormHandler(
            updateUniformItem(data),
            setError,
            (result) => {
                setEditable(false);
                console.log("save", result);
                reset(getUniformFormData(result));
                onSave(result);
            },
            t('common.error.actions.save')
        );
    }

    return (
        <FormProvider {...form}>
            <form noValidate autoComplete="off" onSubmit={handleSubmit(handleSave)} className="mb-4">
                <Row className="mb-3 mt-2 justify-content-between">
                    <Col xs={12} sm={"auto"}>
                        <ToggleFormField<UniformFormType>
                            label={t('common.status')}
                            name={"active"}
                            formName="uniform"
                            disabled={!editable}
                            hideToggle={!editable}
                            toggleText={t(`common.uniform.active.${form.watch('active') ? "true" : "false"}`)}
                        />
                    </Col>
                    <Col xs={7} sm={"auto"}>
                        <SelectFormField<UniformFormType>
                            name="generation"
                            label={t('common.uniform.generation.label', { count: 1 })}
                            formName="uniform"
                            disabled={!editable}
                            plaintext={!editable}
                            options={generationOptions}
                        />
                    </Col>
                    <Col xs={5} sm={"auto"} className="p-0" style={{minWidth: "100px"}}>
                        <SelectFormField<UniformFormType>
                            name="size"
                            label={t('common.uniform.size')}
                            formName="uniform"
                            disabled={!editable}
                            plaintext={!editable}
                            options={sizeOptions}
                        />
                    </Col>
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