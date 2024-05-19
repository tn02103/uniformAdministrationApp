
import { useI18n } from "@/lib/locales/client";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { CadetMaterial, MaterialGroup } from "../../types/globalMaterialTypes";
import { issueMaterial } from "@/actions/controllers/CadetMaterialController";

export type IssueMaterialModalProps = {
    cadetId: string,
    materialGroup: MaterialGroup,
    issuedMaterialList: CadetMaterial[],
    oldMaterial?: CadetMaterial,
    onClose: () => void;
}

type FormData = {
    typeId: string,
    issued: number
}

const IssueMaterialModal = ({ cadetId, materialGroup, issuedMaterialList, oldMaterial, onClose }: IssueMaterialModalProps) => {
    const t = useI18n();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ defaultValues: oldMaterial ? { typeId: oldMaterial.id, issued: oldMaterial.issued } : {} });

    const onSubmit = (formData: FormData) => {
        let materialId = formData.typeId;
        if (materialGroup.typeList.length === 1) {
            materialId = materialGroup.typeList[0].id;
        }

        onClose();
        issueMaterial(cadetId, materialId, +formData.issued, oldMaterial?.id)
            .then((data) => {
                mutate(`cadet/material/${cadetId}`, data);
            }).catch((error) => {
                console.error(error);
                toast.error(t('cadetDetailPage.issueMaterial.error'));
            });
    }

    return (
        <Modal data-testid="div_popup" show onHide={onClose}>
            <Modal.Header className="fs-5 fw-bold" data-testid="div_header" closeButton>
                {t('cadetDetailPage.issueMaterial.header', { group: materialGroup.description })}
            </Modal.Header>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body>
                    <Row>
                        {(materialGroup.typeList.length > 1) &&
                            <Col xs={6}>
                                <Form.Label>{t('common.material.type_one')}</Form.Label>
                                <Form.Select
                                    isInvalid={!!errors.typeId}
                                    {...register(
                                        "typeId",
                                        {
                                            pattern: /\b(?!null\b)\w+/m
                                        })
                                    }>
                                    <option value={"null"} disabled selected>{t('common.error.pleaseSelect')}</option>
                                    {materialGroup.typeList.map(mat => (
                                        <option key={mat.id} value={mat.id} disabled={mat.id !== oldMaterial?.id && !!issuedMaterialList?.find(m => m.id === mat.id)}>{mat.typename}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        }
                        <Col xs={6}>
                            <Form.Label>{t('common.material.amountIssued')}:</Form.Label>
                            <Form.Control
                                isInvalid={!!errors.issued}
                                {...register(
                                    "issued",
                                    {
                                        valueAsNumber: true,
                                        required: {
                                            value: true,
                                            message: t('common.error.number.required'),
                                        },
                                        max: {
                                            value: 255,
                                            message: t('common.error.number.max', { value: 255 }),
                                        },
                                        min: {
                                            value: 1,
                                            message: t('common.error.number.min', { value: 0 }),
                                        },
                                        validate: (value) => Number.isInteger(value) || t('common.error.number.pattern')
                                    })
                                } />
                            <div data-testid="err_issued" className="text-danger-emphasis fs-7">
                                {errors.issued?.message}
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button data-testid="btn_cancel" variant="outline-danger" onClick={onClose}>
                        {t('common.actions.cancel')}
                    </Button>
                    <Button data-testid="btn_save" type="submit" variant="outline-primary">
                        {t('common.actions.save')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}

export default IssueMaterialModal;
