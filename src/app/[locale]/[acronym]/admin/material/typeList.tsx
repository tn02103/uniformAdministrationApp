"use client";

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { Card, CardBody } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { changeMaterialSortOrder, deleteMaterial } from "@/dal/material/type/_index";
import { useI18n } from "@/lib/locales/client";
import { AdministrationMaterial, AdministrationMaterialGroup } from "@/types/globalMaterialTypes";
import { useSearchParams } from "next/navigation";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";

export default function MaterialConfigTypeList({ config }: { config: AdministrationMaterialGroup[] }) {
    const t = useI18n();
    const modal = useModal();
    const searchParams = useSearchParams();
    const group = config.find(g => g.id === searchParams.get('selectedGroupId'));

    if (!group) {
        return <></>;
    }
    async function handleEdit(material: AdministrationMaterial) {
        if (!group) return;

        modal?.editMaterialTypeModal(
            group.description,
            group.id,
            material,
        );
    }
    async function handleDelete(material: AdministrationMaterial) {
        if (!group) return;
        modal?.dangerConfirmationModal({
            header: t('admin.material.delete.material.header', { group: group?.description, type: material.typename }),
            message: t('admin.material.delete.material.message', { group: group?.description, type: material.typename }),
            confirmationText: t('admin.material.delete.material.confirmationText', { group: group?.description, type: material.typename }),
            dangerOption: {
                option: t('common.actions.delete'),
                function: () => deleteMaterial(material.id).catch(e => {
                    console.error(e);
                    toast.error(t('common.error.actions.delete'));
                })
            }
        });
    }
    async function handleCreate() {
        if (!group) return;

        modal?.editMaterialTypeModal(
            group.description,
            group.id,
        );
    }
    async function handleChangeSortOrder(id: string, up: boolean) {
        await changeMaterialSortOrder({ id, up }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.changeSortorder'));
        });
    }

    return (
        <Card>
            <Row className="bg-body-secondary p-1 rounded-top text-center">
                <Col>
                    <h3 className="fs-5 fw-bold text-center align-middle m-0">
                        {t('common.material.type_other')}
                        <TooltipActionButton
                            variantKey="create"
                            buttonClass="ms-2"
                            onClick={handleCreate}
                            testId="btn_material_create" />
                    </h3>
                </Col>
            </Row>
            <Row className="border-top border-dark-subtle py-1 bg-body-secondary justify-content-center text-start">
                <Col xs={3} sm={2} className="p-1">
                </Col>
                <Col className="p-1">
                    <Row>
                        <Col xs={6} className="d-none d-sm-inline">
                            {t('common.material.type_one')}:
                        </Col>
                        <Col xs={4} sm={2}>
                            {t('common.material.quantity.actual')}:
                        </Col>
                        <Col xs={4} sm={2}>
                            {t('common.material.quantity.target')}:
                        </Col>
                        <Col xs={4} sm={2}>
                            {t('common.material.quantity.issued')}:
                        </Col>
                    </Row>
                </Col>
                <Col xs={3} sm={2}>
                </Col>
            </Row>
            <CardBody>
                {group.typeList.map((type, index) =>
                    <Row data-testid={`div_material_${type.id}`} className="justify-content-center  m-0 border-top" key={type.id}>
                        <Col xs={3} sm={2} className="p-1">
                            <TooltipActionButton
                                variantKey="moveUp"
                                disabled={!type.id || (index === 0)}
                                onClick={() => handleChangeSortOrder(type.id, true)}
                            />
                            <TooltipActionButton
                                variantKey="moveDown"
                                disabled={!type.id || (index + 1) === group.typeList.length}
                                onClick={() => handleChangeSortOrder(type.id, false)}
                            />
                        </Col>
                        <Col className="p-1">
                            <Row>
                                <Col data-testid="div_typename" className="fw-bold" xs={12} sm={6}>
                                    {type.typename}
                                </Col>
                                <Col data-testid="div_actualQuantity" xs={4} sm={2}>
                                    {type.actualQuantity ?? 0}
                                </Col>
                                <Col data-testid="div_targetQuantity" xs={4} sm={2}>
                                    {type.targetQuantity ?? 0}
                                </Col>
                                <Col data-testid="div_issuedQuantity" xs={4} sm={2}>
                                    {type.issuedQuantity ?? 0}
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={3} sm={2} className="p-1">
                            <Row className="justify-content-end m-0">
                                <Col xs={"auto"} className="p-0">
                                    <TooltipActionButton
                                        variantKey="edit"
                                        onClick={() => handleEdit(type)}
                                    />
                                </Col>
                                <Col xs={"auto"} className="p-0">
                                    <TooltipActionButton
                                        variantKey="delete"
                                        onClick={() => handleDelete(type)}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    )
}
