import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { InputFormField } from "@/components/fields/InputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { useModal } from "@/components/modals/modalProvider";
import { createUniformGeneration, deleteUniformGeneration, updateUniformGeneration } from "@/dal/uniform/generation/_index";
import { useUniformSizelists, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { UniformGeneration } from "@/types/globalUniformTypes";
import { uniformGenerationFormSchema, UniformGenerationFormType } from "@/zod/uniformConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button, Col, Offcanvas, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";


type UniformGenerationOffcanvasProps = {
    uniformTypeId: string;
    usingSizes: boolean;
    generation: UniformGeneration | null;
    onHide: () => void;
}
export const UniformgenerationOffcanvas = ({ generation, uniformTypeId, usingSizes, onHide }: UniformGenerationOffcanvasProps) => {
    const formSchema = uniformGenerationFormSchema.omit({ fk_sizelist: true }).extend({
        fk_sizelist: usingSizes
            ? z.string().min(1, 'string.required').uuid()
            : uniformGenerationFormSchema.shape.fk_sizelist,
    });

    const t = useI18n();
    const modal = useModal();
    const form = useForm<UniformGenerationFormType>({
        defaultValues: generation ?? { fk_sizelist: null },
        mode: "onTouched",
        resolver: zodResolver(formSchema),
    });

    const [editable, setEditable] = useState(!generation);
    const { sizelistList } = useUniformSizelists();
    const { mutate } = useUniformTypeList();
    const sizelistOptions = sizelistList?.map(sl => ({ value: sl.id, label: sl.name })) ?? [];

    useEffect(() => {
        form.reset(generation ?? undefined);
    }, [generation]);

    const handleDelete = () => {
        if (!generation) return;
        const deleteMutation = () => {
            mutate(deleteUniformGeneration(generation.id));
            onHide();
        }

        modal?.dangerConfirmationModal({
            header: t('admin.uniform.generationList.deleteModal.header', { generation: generation.name }),
            message: <span>
                {t('admin.uniform.generationList.deleteModal.message.part1')}<br />
                {t('admin.uniform.generationList.deleteModal.message.part2')}<br />
                {t('admin.uniform.generationList.deleteModal.message.part3')}<br />
            </span>,
            confirmationText: t('admin.uniform.generationList.deleteModal.confirmationText', { generation: generation.name }),
            dangerOption: {
                option: t('common.actions.delete'),
                function: deleteMutation,
            }
        });
    }

    const handleSave = (data: UniformGenerationFormType) => {
        if (!generation) {
            handleCreate(data);
            return;
        }

        SAFormHandler(
            updateUniformGeneration({ data, id: generation.id }),
            form.setError,
            (data) => { mutate(data); setEditable(false); },
            t('common.error.actions.save'),
        )
    }
    const handleCreate = (data: UniformGenerationFormType) => {
        SAFormHandler(
            createUniformGeneration({ ...data, uniformTypeId }),
            form.setError,
            (data) => { mutate(data); onHide(); },
            t('common.error.actions.create'),
        );
    }

    const handleCancel = () => {
        if (!generation) {
            onHide();
            return;
        }

        setEditable(false);
        form.reset(generation);
    }

    return (
        <Offcanvas show={true} onHide={onHide} placement="end" backdrop={false} style={{ width: "500px" }}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h2>{generation ? generation.name : t('admin.uniform.generationList.header.create')}</h2>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <hr className="my-0" />
                <Row className="mb-4 justify-content-evenly">
                    <LabelIconButton
                        variantKey="edit"
                        disabled={editable}
                        onClick={() => setEditable(true)}
                    />
                    <LabelIconButton
                        variantKey="delete"
                        disabled={editable}
                        onClick={() => handleDelete()}
                    />
                </Row>
                <FormProvider {...form}>
                    <form onSubmit={form.handleSubmit(handleSave)}>
                        <Row>
                            <Col xs={6}>
                                <InputFormField<UniformGenerationFormType>
                                    name="name"
                                    label={t('common.name')}
                                    plaintext={!editable}
                                    disabled={!editable}
                                />
                            </Col>
                            <Col xs={6} className="align-bottom">
                                <ToggleFormField<UniformGenerationFormType>
                                    name="outdated"
                                    label={t('common.uniform.generation.outdated')}
                                    disabled={!editable}
                                />
                            </Col>
                            {usingSizes && (
                                <Col xs={6}>
                                    <SelectFormField<UniformGenerationFormType>
                                        name="fk_sizelist"
                                        label={t('common.uniform.sizelist.label')}
                                        options={sizelistOptions}
                                        plaintext={!editable}
                                        disabled={!editable}
                                        labelClassName={(generation && usingSizes && (!generation?.fk_sizelist)) ? "text-danger" : ""}
                                    />
                                </Col>
                            )}
                            {editable && (
                                <Row className="justify-content-evenly mt-2 mb-4">
                                    <Button className="col-auto" type="submit" >{t(generation ? 'common.actions.save' : 'common.actions.create')}</Button>
                                    <Button className="col-auto" variant="outline-secondary" onClick={handleCancel}>{t('common.actions.cancel')}</Button>
                                </Row>
                            )}
                        </Row>
                    </form>
                </FormProvider>
            </Offcanvas.Body>
        </Offcanvas>
    );
}