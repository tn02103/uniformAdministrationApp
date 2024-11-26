import { createMaterial, updateMaterial } from "@/actions/controllers/MaterialController";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { materialTypeFormSchema, MaterialTypeFormType } from "@/zod/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Col, Form, FormControl, FormGroup, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { AdministrationMaterial, Material } from "../../types/globalMaterialTypes";
import ErrorMessage from "../errorMessage";

export type EditMaterialTypeModalPropType = {
    type?: AdministrationMaterial;
    groupName: string;
    groupId: string;
    typeList: Material[];
    onClose: () => void;
}


const EditMaterialTypeModal = ({ type, groupName, groupId, typeList, ...props }: EditMaterialTypeModalPropType) => {
    const t = useI18n();

    const { register, handleSubmit, formState: { errors }, setError } = useForm<MaterialTypeFormType>({
        mode: "onChange",
        values: type,
        resolver: zodResolver(materialTypeFormSchema)
    });

    async function handleSave(data: MaterialTypeFormType) {
        if (!type)
            return await handleCreate(data);

        await SAFormHandler<typeof updateMaterial>(() => updateMaterial(type.id, data.typename, data.actualQuantity, data.targetQuantity), setError)
            .then((result: any) => {
                if (result.success) {
                    props.onClose();
                }
            }).catch((e: any) => {
                console.error(e);
                toast.error(t('common.error.actions.save'));
            });
    }
    async function handleCreate(data: MaterialTypeFormType) {
        await SAFormHandler<typeof createMaterial>(
            () => createMaterial(groupId, data.typename, data.actualQuantity, data.targetQuantity),
            setError
        ).then((result) => {
            if (result.success) {
                props.onClose();
            }
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
                                validate: async (value) => {
                                    console.log("validating", value);
                                    return filteredList.every(t => t.typename !== value) || 'custom.material.typename.duplication'
                                }
                            })}
                        />
                        <ErrorMessage testId="err_typename" error={errors.typename?.message} />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            {t('common.material.quantity.actualQuantity')}:
                        </FormLabel>
                        <FormControl
                            className="w-25"
                            isInvalid={!!errors.actualQuantity}
                            {...register("actualQuantity", { valueAsNumber: true })}
                        />
                        <ErrorMessage testId="err_actualQuantity" error={errors.actualQuantity?.message} />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            {t('common.material.quantity.targetQuantity')}:
                        </FormLabel>
                        <FormControl
                            className="w-25"
                            isInvalid={!!errors.targetQuantity}
                            {...register("targetQuantity", { valueAsNumber: true })} />
                        <ErrorMessage testId="err_targetQuantity" error={errors.targetQuantity?.message} />
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
