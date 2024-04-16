"use client"

import { changeUniformGenerationSortOrder } from "@/actions/controllers/UniformConfigController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardHeader } from "@/components/card";
import { useUniformSizeLists, useUniformType } from "@/dataFetcher/uniformAdmin";
import { t } from "@/lib/test";
import { UniformGeneration } from "@/types/globalUniformTypes";
import { faPlus, faCircleUp, faCircleDown, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";


export default function UniformConfigTypeGenerationList({
    selectedTypeId,
}: {
    selectedTypeId: string;
}) {

    const { sizeLists } = useUniformSizeLists();
    const { type, mutate } = useUniformType(selectedTypeId);
    const generationList = type?.uniformGenerationList;

    function changeSortOrder(generationId: string, up: boolean) {
        mutate(changeUniformGenerationSortOrder(generationId, up)).catch((e) => {
            console.error(e);
            toast.error('Beim ändern der Reihnfolge ist ein unbekannter Fehler aufgetreten.');
        });
    }

    function createGeneration() {

    }
    function editGeneration(generation: UniformGeneration) {

    }
    function deleteGeneration(generation: UniformGeneration) {

    }


    if (!type || !type?.usingGenerations) return (<></>)
    return (
        <Card>
            <CardHeader
                title={t('label.uniform.generation_other')}
                tooltipIconButton={
                    <TooltipIconButton
                        icon={faPlus}
                        buttonSize="sm"
                        buttonClass="ms-2"
                        variant="outline-success"
                        tooltipText={t('label.create')}
                        onClick={createGeneration}
                        testId="btn_generation_create" />
                } />
            <CardBody>
                {generationList?.sort((a, b) => a.sortOrder - b.sortOrder).map((gen, index) =>
                    <Row data-testid={`div_generation_${gen.id}`} key={gen.id} className="justify-content-between border-top border-1  p-1 m-0 p-0">
                        <Col xs="auto">
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleUp}
                                tooltipText={t('label.moveUp')}
                                variant="outline-secondary"
                                disabled={(index === 0) || !gen.id}
                                onClick={() => changeSortOrder(gen.id, true)}
                                testId="btn_moveUp"
                            />
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleDown}
                                tooltipText={t('label.moveDown')}
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
                                        {gen.outdated ? ` - ${t('label.uniform.generation.outdated')}` : ""}
                                    </span>
                                </Col>
                            </Row>
                            <Row>
                                <span data-testid="div_sizeList" className="fw-light">
                                    {type.usingSizes && sizeLists?.find(sl => sl.id === gen.fk_sizeList)?.name}
                                </span>
                            </Row>
                        </Col>
                        <Col xs="auto">
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faPencil}
                                tooltipText={t('label.edit')}
                                variant="outline-primary"
                                disabled={!gen.id}
                                onClick={() => editGeneration(gen)}
                                testId="btn_edit"
                            />
                            <TooltipIconButton
                                icon={faTrash}
                                variant="outline-danger"
                                tooltipText={t('label.delete')}
                                buttonSize="sm"
                                disabled={!gen.id}
                                onClick={() => deleteGeneration(gen)}
                                testId="btn_delete"
                            />
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    )
}