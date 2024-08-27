import { createMaterial, updateMaterial } from "@/actions/controllers/MaterialController";
import { useI18n } from "@/lib/locales/client";
import { Button, Col, Form, FormControl, FormGroup, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { descriptionValidationPattern } from "../../lib/validations";
import { AdministrationMaterial, Material } from "../../types/globalMaterialTypes";

export type EditMaterialTypeModalPropType = {
    type?: AdministrationMaterial;
    groupName: string;
    groupId: string;
    typeList: Material[];
    onClose: () => void;
}
type FormType = {
    typename: string;
    actualQuantity: number;
    targetQuantity: number;
}
const EditMaterialTypeModal = ({ type, groupName, groupId, typeList, ...props }: EditMaterialTypeModalPropType) => {
    const t = useI18n();
    const { register, handleSubmit, formState: { errors } } = useForm<FormType>({ mode: "onChange", values: type });

    async function handleSave(data: FormType) {
        if (!type)
            return await handleCreate(data);

        await updateMaterial(type.id, data.typename, data.actualQuantity, data.targetQuantity).then(() => {
            props.onClose();
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }
    async function handleCreate(data: FormType) {
        await createMaterial(groupId, data.typename, data.actualQuantity, data.targetQuantity).then(() => {
            props.onClose();
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.create'));
        });
    }

    const filteredList = typeList.filter(tl => tl.id !== type?.id);
    return (
        <Modal data-testid="div_popup" show onHide={props.onClose}>
            <ModalHeader data-testid="div_header" closeButton>
                {type
                    ? t('admin.material.header.editMaterial', { group: groupName, type: type.typename })
                    : t('admin.material.header.createMaterial', { group: groupName })}
            </ModalHeader>
            <Form onSubmit={handleSubmit(handleSave)}>
                <ModalBody>
                    <FormGroup>
                        <FormLabel>
                            {t('common.name')}:
                        </FormLabel>
                        <FormControl
                            className="w-50"
                            isInvalid={!!errors.typename}
                            {...register("typename", {
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
                                validate: (value) => filteredList.every(t => t.typename !== value) || t('admin.material.error.materialNameDuplicate')
                            })}
                        />
                        <span data-testid="err_typename" className="fs-7 text-danger">
                            {errors.typename?.message}
                        </span>
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            {t('common.material.quantity.actualQuantity')}:
                        </FormLabel>
                        <FormControl
                            className="w-25"
                            isInvalid={!!errors.actualQuantity}
                            {...register("actualQuantity", {
                                valueAsNumber: true,
                                required: {
                                    value: true,
                                    message: t('common.error.amount.required'),
                                },
                                validate: (value) => (Number.isInteger(value) && value >= 0) || t('common.error.amount.notNegative'),
                            })} />
                        <span data-testid="err_actualQuantity" className="fs-7 text-danger">
                            {errors.actualQuantity?.message}
                        </span>
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            {t('common.material.quantity.targetQuantity')}:
                        </FormLabel>
                        <FormControl
                            className="w-25"
                            isInvalid={!!errors.targetQuantity}
                            {...register("targetQuantity", {
                                valueAsNumber: true,
                                required: {
                                    value: true,
                                    message: t('common.error.amount.required'),
                                },
                                validate: (value) => (Number.isInteger(value) && value >= 0) || t('common.error.number.pattern'),
                            })} />
                        <span data-testid="err_targetQuantity" className="fs-7 text-danger">
                            {errors.targetQuantity?.message}
                        </span>
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Row className="justify-content-between">
                        <Col xs={"auto"}>
                            <Button
                                variant="outline-seccondary"
                                onClick={props.onClose}
                                data-testid="btn_cancel"
                            >
                                {t('common.actions.cancel')}
                            </Button>
                        </Col>
                        <Col xs={"auto"}>
                            <Button
                                type="submit"
                                variant="outline-primary"
                                data-testid="btn_save"
                            >
                                {t('common.actions.save')}
                            </Button>
                        </Col>
                    </Row>
                </ModalFooter>
            </Form>
        </Modal>
    );
}

export default EditMaterialTypeModal;
