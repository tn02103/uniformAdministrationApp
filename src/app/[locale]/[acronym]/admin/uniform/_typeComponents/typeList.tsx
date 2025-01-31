"use client"

import { getUniformCountByType } from "@/actions/controllers/UniformController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { Card, CardBody, CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { createUniformType } from "@/dal/uniform/type/create";
import { deleteUniformType } from "@/dal/uniform/type/delete";
import { changeUniformTypeSortOrder } from "@/dal/uniform/type/sortOrder";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { UniformType } from "@/types/globalUniformTypes";
import { faArrowUpRightFromSquare, faCircleDown, faCircleUp, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";


export default function UniformConfigTypeList({
    selectedTypeId,
    selectedEditable,
    selectType,
}: {
    selectedTypeId: string;
    selectedEditable: boolean;
    selectType: (typeId: string) => void;
}) {
    const t = useI18n();
    const modal = useModal();
    const tActions = useScopedI18n('common.actions');
    const { typeList, mutate } = useUniformTypeList();

    async function create() {
        await createUniformType().then(async (newType) => {
            await mutate([...typeList ?? [], newType]);
            selectType(newType.id);
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.create'));
        });
    }

    async function changeSortOrder(up: boolean, typeId: string) {
        await mutate(changeUniformTypeSortOrder({ typeId, up })).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.changeSortorder'));
        });
    }

    async function deleteType(type: UniformType) {
        const deleteMutation = () => mutate(
            deleteUniformType(type.id),
            {
                optimisticData: typeList?.filter(t => t.id !== type.id)
            }
        ).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.delete'));
        });

        await getUniformCountByType(type.id).then(count =>
            modal?.dangerConfirmationModal({
                header: t('admin.uniform.type.deleteModal.header', { type: type.name }),
                message: <span>
                    {t('admin.uniform.type.deleteModal.message.part1', { type: type.name })}<br />
                    {t('admin.uniform.type.deleteModal.message.part2')}
                    <span className="fw-bold">{t('admin.uniform.type.deleteModal.message.part3', { count })}</span>
                    {t('admin.uniform.type.deleteModal.message.part4')}
                </span>,
                confirmationText: t('admin.uniform.type.deleteModal.confirmationText', { type: type.name }),
                dangerOption: {
                    option: t('common.actions.delete'),
                    function: deleteMutation,
                }
            })
        );
    }

    return (
        <Card>
            <CardHeader
                title={t('common.uniform.type.type', { count: 2 })}
                tooltipIconButton={
                    <TooltipIconButton
                        icon={faPlus}
                        variant="outline-success"
                        buttonSize="sm"
                        buttonClass="ms-2"
                        tooltipText={"create"}
                        onClick={create}
                        testId="btn_type_create" />
                }
            />
            <CardBody>
                {typeList?.sort((a, b) => (a.sortOrder - b.sortOrder)).map((type, index) =>
                    <Row data-testid={`div_typeList_row_${type.id}`}
                        key={type.id}
                        className={`border-top border-1 bg-white p-1 m-0 justify-content-between ${(selectedTypeId === type.id) ? "bg-primary-subtle" : ""}`}
                    >
                        <Col xs={"auto"} className="p-0">
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleUp}
                                variant="outline-secondary"
                                tooltipText={tActions('moveUp')}
                                disabled={!type.id || (index === 0)}
                                onClick={() => changeSortOrder(true, type.id)}
                                testId="btn_moveUp"
                            />
                            <TooltipIconButton
                                buttonSize="sm"
                                icon={faCircleDown}
                                variant="outline-secondary"
                                tooltipText={tActions('moveDown')}
                                disabled={!type.id || (index + 1) === typeList.length}
                                onClick={() => changeSortOrder(false, type.id)}
                                testId="btn_moveDown"
                            />
                        </Col>
                        <Col className="fw-bold px-4">
                            <span data-testid="div_typename" className={`align-middle`}>
                                {type.name}
                            </span>
                        </Col>
                        <Col xs={"auto"} className="pe-2">
                            {(!selectedEditable && (selectedTypeId !== type.id)) &&
                                <TooltipIconButton
                                    icon={faArrowUpRightFromSquare}
                                    variant={(selectedTypeId === type.id) ? "outline-primary  " : "outline-secondary"}
                                    disabled={!type.id}
                                    tooltipText={tActions('open')}
                                    onClick={() => selectType(type.id)}
                                    testId="btn_open"
                                />
                            }
                            {(selectedTypeId === type.id) &&
                                <TooltipIconButton
                                    icon={faTrash}
                                    tooltipText={tActions('delete')}
                                    variant="outline-danger"
                                    disabled={!type.id}
                                    onClick={() => deleteType(type)}
                                    testId="btn_delete"
                                />
                            }
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    );
}
