"use client";

import { createUniformSizelist } from "@/actions/controllers/UniformSizeController";
import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { Card, CardBody, CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { useUniformSizelists } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { descriptionValidationPattern } from "@/lib/validations";
import { faArrowUpRightFromSquare, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Col, Row } from "react-bootstrap";
import { toast } from "react-toastify";


export default function UniformConfigSizelistsList({
    editable, selectedSizelistId, selectList
}: {
    editable: boolean;
    selectedSizelistId: string;
    selectList: (id: string) => void;
}) {
    const t = useI18n();
    const modal = useModal();

    const { sizelistList, mutate } = useUniformSizelists();

    function handleCreate() {
        const saveMutation = async ({ input }: { input: string }) => createUniformSizelist(input).then((data) => {
            mutate([...sizelistList ?? [], data].sort((a, b) => a.name.localeCompare(b.name)));
            selectList(data.id);
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });

        modal?.simpleFormModal({
            header: t('admin.uniform.sizelist.createModal.header'),
            elementLabel: t('common.name'),
            elementValidation: {
                required: {
                    value: true,
                    message: t('common.error.string.required'),
                },
                pattern: {
                    value: descriptionValidationPattern,
                    message: t('common.error.string.noSpecialChars'),
                },
                maxLength: {
                    value: 20,
                    message: t('common.error.string.maxLength', { value: 20 }),
                },
                validate: (value) => !sizelistList!.find(sl => (sl.name === value)) || t('admin.uniform.sizelist.nameDuplicationError')
            },
            abort: () => { },
            save: saveMutation,
        });
    }

    return (
        <Card>
            <CardHeader
                title={t('common.uniform.sizelist.multiLabel')}
                tooltipIconButton={
                    <TooltipIconButton
                        icon={faPlus}
                        variant="outline-success"
                        tooltipText={t('common.actions.create')}
                        onClick={handleCreate}
                        testId="btn_sizelist_create"
                        buttonSize="sm" />
                } />
            <CardBody>
                {sizelistList?.map(sl =>
                    <Row data-testid={`div_sizelist_list_${sl.id}`} key={sl.id} className="justify-content-between m-0 border-top">
                        <Col data-testid="div_name" xs={"auto"} className="fw-bold p-2">
                            {sl.name}
                        </Col>
                        <Col xs={"auto"}>
                            {(!editable && (selectedSizelistId !== sl.id)) &&
                                <TooltipIconButton
                                    icon={faArrowUpRightFromSquare}
                                    variant="outline-secondary"
                                    tooltipText={t('common.actions.open')}
                                    onClick={() => selectList(sl.id)}
                                    testId="btn_select"
                                />
                            }
                        </Col>
                    </Row>
                )}
            </CardBody>
        </Card>
    )
}