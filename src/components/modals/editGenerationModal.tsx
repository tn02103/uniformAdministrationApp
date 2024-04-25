"use client";

import { useUniformSizeLists } from "@/dataFetcher/uniformAdmin";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { descriptionValidationPattern } from "@/lib/validations";
import { UniformGeneration, UniformType } from "@/types/globalUniformTypes";
import { Button, Col, FormCheck, FormControl, FormGroup, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useModal } from "./modalProvider";

export type EditGenerationModalPropType = {
    generation: UniformGeneration | null,
    type: UniformType,
    cancel: () => void,
    save: (data: UniformGeneration) => void,
}
export default function EditGenerationModal({ generation, type, cancel, save }: EditGenerationModalPropType) {
    const { handleSubmit, register, watch, formState: { errors } } = useForm<UniformGeneration>({ mode: "onTouched", defaultValues: generation ?? undefined });
    const modal = useModal();
    const t = useI18n();
    const tAction = useScopedI18n('common.actions');
    const tModal = useScopedI18n('admin.uniform.generationList.updateModal');

    const { sizeLists } = useUniformSizeLists();

    function beforeSave(data: UniformGeneration) {
        //doshit
        if (generation && type.usingSizes && data.fk_sizeList !== generation.fk_sizeList) {
            modal!.simpleYesNoModal({
                header: tModal('changeSizeHeader'),
                message: tModal('changeSizeMessage'),
                primaryOption: tAction('save'),
                primaryFunction: () => save(data),
            });
            return;
        }
        save(data);
    }

    return (
        <Modal show data-testid="div_popup">
            <form onSubmit={handleSubmit(beforeSave)}>
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
                            {...register(`name`, {
                                required: {
                                    value: true,
                                    message: t('common.error.string.required')
                                },
                                pattern: {
                                    value: descriptionValidationPattern,
                                    message: t('common.error.string.noSpecialChars')
                                },
                                maxLength: {
                                    value: 20,
                                    message: t('common.error.string.maxLength', { value: 20 })
                                },
                                validate: (value) => !type.uniformGenerationList?.find(g => (g.id !== generation?.id) && (g.name === value)) || tModal('nameDuplicationError')
                            })} />
                        <div data-testid="err_name" className="text-danger fs-7">
                            {errors.name?.message}
                        </div>
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
                                {t('common.uniform.sizeList')}
                            </FormLabel>
                            <FormSelect
                                className="w-auto"
                                isInvalid={!!(errors.fk_sizeList)}
                                {...register("fk_sizeList", {
                                    required: {
                                        value: true,
                                        message: t('common.error.pleaseSelect')
                                    }
                                })}>
                                {sizeLists?.map(sl =>
                                    <option key={sl.id} value={sl.id}>{sl.name}</option>
                                )}
                            </FormSelect>
                            <div data-testid="err_sizeList" className="text-danger fs-7">
                                {errors.fk_sizeList?.message}
                            </div>
                        </FormGroup>
                    }
                </ModalBody>
                <ModalFooter>
                    <Row className="justify-content-between w-100">
                        <Col xs={"auto"}>
                            <Button data-testid="btn_cancel" variant="outline-secondary" onClick={cancel}>
                                {tAction('cancel')}
                            </Button>
                        </Col >
                        <Col xs={"auto"}>
                            <Button data-testid="btn_save" variant="outline-primary" type="submit">
                                {tAction('save')}
                            </Button>
                        </Col>
                    </Row >
                </ModalFooter >
            </form >
        </Modal >
    )
}