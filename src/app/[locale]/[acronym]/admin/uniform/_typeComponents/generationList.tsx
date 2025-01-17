"use client"

import { changeUniformGenerationSortOrder, createUniformGeneration, deleteUniformGeneration, saveUniformGeneration } from "@/actions/controllers/UniformConfigController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { useUniformSizelists, useUniformType } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";

import { UniformGeneration } from "@/types/globalUniformTypes";
import { faCircleDown, faCircleUp, faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";


export default function UniformConfigTypeGenerationList({
    selectedTypeId,
}: {
    selectedTypeId: string;
}) {
    const t = useI18n();
    const modal = useModal();

    const { sizelistList } = useUniformSizelists();
    const { type, mutate } = useUniformType(selectedTypeId);
    const generationList = type?.uniformGenerationList;

    function changeSortOrder(generationId: string, up: boolean) {
        mutate(changeUniformGenerationSortOrder(generationId, up)).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.changeSortorder'));
        });
    }

    function handleCreate() {
        if (!type) return;

        modal?.editGenerationModal(null, type);
    }
    function handleEdit(generation: UniformGeneration) {
        if (!type) return;

        modal?.editGenerationModal(generation, type);
    }
    function handleDelete(generation: UniformGeneration) {
        const deleteMutation = () => mutate(
            deleteUniformGeneration(generation.id),
        );

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


    if (!type || !type?.usingGenerations) return (<></>)
    return (
        <Card>
            <CardHeader
                title={t('common.uniform.generation.label', { count: 2 })}
                tooltipIconButton={
                    <TooltipIconButton
                        icon={faPlus}
                        buttonSize="sm"
                        buttonClass="ms-2"
                        variant="outline-success"
                        tooltipText={t('common.actions.create')}
                        onClick={handleCreate}
                        testId="btn_generation_create" />
                } />
            <CardBody>
                {generationList?.sort((a, b) => a.sortOrder - b.sortOrder).map((gen, index) =>
                    <Row data-testid={`div_generation_${gen.id}`} key={gen.id} className="justify-content-between border-top border-1  p-1 m-0 p-0">
                        <Col xs="auto">
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleUp}
                                tooltipText={t('common.actions.moveUp')}
                                variant="outline-secondary"
                                disabled={(index === 0) || !gen.id}
                                onClick={() => changeSortOrder(gen.id, true)}
                                testId="btn_moveUp"
                            />
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleDown}
                                tooltipText={t('common.actions.moveDown')}
                                variant="outline-secondary"
                                disabled={((index + 1) === generationList.length) || !gen.id}
                                onClick={() => changeSortOrder(gen.id, false)}
                                testId="btn_moveDown"
                            />
                        </Col>
                        <Col>
                            <Row>
                                <Col>
                                    <span data-testid="div_name" className="fw-bold">
                                        {gen.name}
                                    </span>
                                    <span data-testid="div_outdated" className="fst-italic text-warning">
                                        {gen.outdated ? ` - ${t('common.uniform.generation.outdated')}` : ""}
                                    </span>
                                </Col>
                            </Row>
                            <Row>
                                <span data-testid="div_sizelist" className="fw-light">
                                    {type.usingSizes && sizelistList?.find(sl => sl.id === gen.fk_sizelist)?.name}
                                </span>
                            </Row>
                        </Col>
                        <Col xs="auto">
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faPencil}
                                tooltipText={t('common.actions.edit')}
                                variant="outline-primary"
                                disabled={!gen.id}
                                onClick={() => handleEdit(gen)}
                                testId="btn_edit"
                            />
                            <TooltipIconButton
                                icon={faTrash}
                                variant="outline-danger"
                                tooltipText={t('common.actions.delete')}
                                buttonSize="sm"
                                disabled={!gen.id}
                                onClick={() => handleDelete(gen)}
                                testId="btn_delete"
                            />
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    )
}
