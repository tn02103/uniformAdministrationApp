"use client";

import { deleteSize, moveSize, setSizeSortorder } from "@/actions/controllers/UniformSizeController";
import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { t } from "@/lib/test";
import { UniformSize } from "@/types/globalUniformTypes";
import { faCircleUp, faCircleDown, faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Row, Col, Dropdown, DropdownMenu } from "react-bootstrap";
import { toast } from "react-toastify";

export default function SizeItem({
    index, size, upDisabled, downDisabled
}: {
    index: number;
    size: UniformSize;
    upDisabled: boolean;
    downDisabled: boolean;
}) {
    const t = useI18n();
    const tAction = useScopedI18n('common.actions')
    const modal = useModal();

    function handleSetPosition() {
        modal?.simpleFormModal({
            header: t('admin.uniform.size.changePositionModal.header', { size: size.name }),
            elementLabel: t('admin.uniform.size.changePositionModal.label'),
            elementValidation: {
                valueAsNumber: true,
                required: {
                    value: true,
                    message: t('common.error.number.required'),
                },
                validate: (value) => Number.isInteger(value) || t('common.error.number.pattern'),
            },
            inputMode: "numeric",
            save: async ({ input }) => setSizeSortorder(size.id, +input).catch(e => {
                console.error(e);
                toast.error(t('common.error.actions.save'));
            }),
            abort: () => { },
        });
    }
    function handleDelete() {
        modal?.simpleWarningModal({
            header: t('admin.uniform.size.deleteModal.header', { size: size.name }),
            message: t('admin.uniform.size.deleteModal.message'),
            primaryOption: t('common.actions.delete'),
            primaryFunction: () => deleteSize(size.id).catch(e => {
                console.error(e);
                toast.error(t('common.error.actions.save'));
            }),
        });
    }

    function handleSimpleSA(action: () => Promise<any>) {
        action().catch(e => {
            console.error(e);
            toast.error(t('common.error.actions.save'));
        });
    }
    return (
        <Row data-testid={`div_size_${size.id}`} className="bg-body-secondary rounded m-1 hoverCol">
            <Col data-testid="div_index" xs={"auto"} className="fs-7 fst-italic">
                {size.sortOrder}
            </Col>
            <Col xs={"auto"} className="hoverColHidden p-1">
                <TooltipIconButton
                    buttonSize="sm"
                    icon={faCircleUp}
                    disabled={upDisabled}
                    variant="outline-secondary"
                    tooltipText={tAction('moveUp')}
                    onClick={() => handleSimpleSA(() => moveSize(size.id, true))}
                    testId="btn_moveUp"
                />
                <TooltipIconButton
                    buttonSize="sm"
                    icon={faCircleDown}
                    disabled={downDisabled}
                    variant="outline-secondary"
                    tooltipText={tAction('moveDown')}
                    onClick={() => handleSimpleSA(() => moveSize(size.id, false))}
                    testId="btn_moveDown"
                />
            </Col>
            <Col className="py-auto">
                <span data-testid="div_name" className="align-middle">
                    {size.name}
                </span>
            </Col>
            <Col className="hoverColHidden">
                <Dropdown>
                    <Dropdown.Toggle data-testid="btn_menu" variant="outline-seccondary" className="border-0" id={"Sizelist-dropdown"}>
                        <FontAwesomeIcon icon={faBars} />
                    </Dropdown.Toggle>
                    <DropdownMenu>
                        <Dropdown.Item data-testid="btn_menu_setPosition" onClick={handleSetPosition}>
                            {tAction('changePosition')}
                        </Dropdown.Item>
                        <Dropdown.Item data-testid="btn_menu_delete" onClick={handleDelete}>
                            {tAction('delete')}
                        </Dropdown.Item>
                    </DropdownMenu>
                </Dropdown>
            </Col>
        </Row>
    )
}