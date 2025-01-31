"use client";

import { useUniformSizelists, useUniformType } from "@/dataFetcher/uniformAdmin";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { uniformGenerationFormSchema, UniformGenerationFormType } from "@/zod/uniformConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Col, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ErrorMessage from "../errorMessage";
import { useModal } from "./modalProvider";
import { createUniformGeneration } from "@/dal/uniform/generation/create";
import { updateUniformGeneration } from "@/dal/uniform/generation/update";

export type EditGenerationModalPropType = {
    generation: UniformGeneration | null,
    type: UniformType,
    onClose: () => void,
}
export default function EditGenerationModal({ generation, type, onClose }: EditGenerationModalPropType) {
    const { handleSubmit, register, watch, formState: { errors }, setError } = useForm<UniformGenerationFormType>({
        mode: "onTouched",
        defaultValues: generation ?? undefined,
        resolver: zodResolver(uniformGenerationFormSchema),
    });
    const modal = useModal();
    const t = useI18n();
    const tAction = useScopedI18n('common.actions');
    const tModal = useScopedI18n('admin.uniform.generationList.updateModal');

    const { sizelistList } = useUniformSizelists();
    const { mutate } = useUniformType(type.id)

    function handleSave(data: UniformGenerationFormType, ignoreSizeChange?: boolean) {
        if (!ignoreSizeChange && generation && type.usingSizes && generation.fk_sizelist && data.fk_sizelist !== generation.fk_sizelist) {
            modal!.simpleYesNoModal({
                header: tModal('changeSizeHeader'),
                message: tModal('changeSizeMessage'),
                primaryOption: tAction('save'),
                primaryFunction: () => handleSave(data, true),
            });
            return;
        }

        let saPromise;
        if (generation) {
            saPromise = SAFormHandler<typeof updateUniformGeneration>(
                () => updateUniformGeneration({ data, id: generation.id }),
                setError
            )
        } else {
            saPromise = SAFormHandler<typeof createUniformGeneration>(
                () => createUniformGeneration({ ...data, uniformTypeId: type.id }),
                setError
            );
        }
        saPromise.then((result: any) => {
            if (result.success) {
                onClose();
                mutate(result.data);
            } else throw "";
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }

    return (
        <Modal show data-testid="div_popup">
            <form onSubmit={handleSubmit((data) => handleSave(data))}>
                <ModalHeader className="justify-content-center">
                    <h3 data-testid="div_header" className="fs-5 fw-bold text-center ">
                        {generation
                            ? tModal('editHeader', { generation: watch(`name`) })
                            : tModal('createHeader')}
                    </h3>
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <FormLabel className="mb-0">
                            {t('common.uniform.type.name')}
                        </FormLabel>
                        <FormControl
                            className="w-auto"
                            isInvalid={!!(errors?.name)}
                            {...register(`name`)} />
                        <ErrorMessage error={errors.name?.message} testId="err_name" />
                    </FormGroup>
                    <FormGroup className="mt-2">
                        <FormLabel className="mb-0">
                            {t('common.uniform.generation.outdated')}
                        </FormLabel>
                        <FormCheck
                            type="switch"
                            {...register(`outdated`)} />
                    </FormGroup>
                    {type.usingSizes &&
                        <FormGroup className="mt-2">
                            <FormLabel className="mb-0">
                                {t('common.uniform.sizelist.label')}
                            </FormLabel>
                            <FormSelect
                                className="w-auto"
                                isInvalid={!!(errors.fk_sizelist)}
                                {...register("fk_sizelist")}>
                                {sizelistList?.map(sl =>
                                    <option key={sl.id} value={sl.id}>{sl.name}</option>
                                )}
                            </FormSelect>
                            <ErrorMessage error={errors.fk_sizelist?.message} testId="err_sizelist" />
                        </FormGroup>
                    }
                </ModalBody>
                <ModalFooter>
                    <Row className="justify-content-between w-100">
                        <Col xs={"auto"}>
                            <Button data-testid="btn_cancel" variant="outline-secondary" onClick={onClose}>
                                {tAction('cancel')}
                            </Button>
                        </Col>
                        <Col xs={"auto"}>
                            <Button data-testid="btn_save" variant="outline-primary" type="submit">
                                {tAction('save')}
                            </Button>
                        </Col>
                    </Row>
                </ModalFooter>
            </form>
        </Modal>
    )
}
