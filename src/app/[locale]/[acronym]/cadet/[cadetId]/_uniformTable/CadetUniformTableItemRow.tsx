"use client"

import TooltipIconButton, { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { UniformOffcanvas } from "@/components/UniformOffcanvas/UniformOffcanvas";
import { returnUniformItem } from "@/dal/uniform/item/_index";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { faBars, faRightLeft, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { Col, Dropdown, Row } from "react-bootstrap";
import { toast } from "react-toastify";

export type CadetUniformTableItemRowProps = {
    uniform: UniformWithOwner;
    uniformType: UniformType;
    replaceItem: () => void;
    openUniformId: string | null;
    setOpenUniformId: (id: string | null) => void;
}
export const CadetUniformTableItemRow = ({ uniform, uniformType, replaceItem, openUniformId, setOpenUniformId }: CadetUniformTableItemRowProps) => {
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform')
    const modal = useModal();

    const { cadetId }: { cadetId: string; locale: string } = useParams();
    const { userRole } = useGlobalData();
    const { mutate } = useCadetUniformMap(cadetId);

    const [selected, setSelected] = useState<boolean>(false);

    function onLineClick(event: React.MouseEvent) {
        const target = event.target as HTMLElement;
        if (target.tagName !== "BUTTON"
            && target.parentElement?.tagName !== "BUTTON"
            && target.parentElement?.parentElement?.tagName !== "BUTTON") {
            setSelected(!selected);
        }
    }


    function withdraw(uniform: UniformWithOwner) {
        const returnItem = () => mutate(
            returnUniformItem({ uniformId: uniform.id, cadetId }),
        ).catch((e) => {
            console.error(e);
            toast.error(t('cadetDetailPage.returnUniform.error'))
        });

        modal?.simpleWarningModal({
            header: modalT('return.header'),
            message: modalT('return.message', { type: uniformType.name, number: uniform.number }),
            primaryFunction: returnItem,
            primaryOption: t('common.actions.return')
        });
    }

    const getGenerationRowTextColor = () => {
        if (!uniformType.usingGenerations) return "text-secondary";
        if (!uniform.generation) return "text-danger";
        if (uniform.generation.outdated) return "text-warning";
        return "";
    }
    const getSizeRowTextColor = () => {
        if (!uniformType.usingSizes) return "text-secondary";
        if (!uniform.size) return "text-danger";
        return "";
    }

    return (
        <div className={`row border-top border-1 white m-0`}>
            <div className="col-12 p-0">
                <div data-testid={`div_uitem_${uniform.id}`} className={`row pb-2 pt-1 m-0  justify-content-between ${selected ? "bg-primary-subtle" : "bg-white"}`} onClick={onLineClick}>
                    {(userRole >= AuthRole.inspector) &&
                        <div className={`d-none d-sm-block col-auto pt-1`}>
                            <TooltipIconButton
                                variant="outline-danger"
                                buttonSize="sm"
                                buttonType="button"
                                tooltipText={t('common.actions.return')}
                                icon={faRightToBracket}
                                iconClass="fa-flip-horizontal"
                                onClick={() => withdraw(uniform)}
                                testId={"btn_withdraw"}
                            />
                            <TooltipIconButton
                                variant="outline-primary"
                                buttonSize="sm"
                                buttonType="button"
                                tooltipText={t('common.actions.replace')}
                                icon={faRightLeft}
                                onClick={replaceItem}
                                testId={"btn_switch"}
                            />
                        </div>
                    }
                    <Col xs={10} sm={9} md={9} lg={9} xxl={10} className="ps-md-2 pe-0">
                        <Row className="m-0 p-0">
                            <Col xs={3} md={2} lg={1}>
                                <Row className="fs-8 fw-bold fst-italic">
                                    {t('common.uniform.number')}
                                </Row>
                                <Row data-testid={"div_number"} className={`fw-bold ${uniform.active ? "" : "text-danger "} ${""}`}>
                                    {uniform.number}
                                </Row>
                            </Col>
                            <Col xs={uniformType.usingGenerations ? 6 : 0} sm={6} md={4} lg={3} xxl={2}>
                                <Row className="fs-8 fw-bold fst-italic">
                                    {uniformType.usingGenerations ? t('common.uniform.generation.label', { count: 1 }) : ""}
                                </Row>
                                <Row
                                    data-testid={"div_generation"}
                                    className={`text-truncate pe-2 ${getGenerationRowTextColor()}`}
                                >
                                    {uniformType.usingGenerations ? uniform.generation?.name ?? "K.A." : "---"}
                                </Row>
                            </Col>
                            <Col xs={uniformType.usingSizes ? 3 : 0} sm={2} md={2} xxl={1}>
                                <Row className="fs-8 fw-bold fst-italic">
                                    {uniformType.usingSizes ? t('common.uniform.size') : ""}
                                </Row>
                                <Row data-testid={"div_size"} className={`text-truncate pe-2 ${getSizeRowTextColor()}`}>
                                    {uniformType.usingSizes ? uniform.size?.name ?? "K.A." : "---"}
                                </Row>
                            </Col>
                            <Col md={4} lg={6} xl={6} xxl={8} className="d-none d-md-inline">
                                <Row className="fs-8 fw-bold fst-italic">
                                    {t('common.comment')}
                                </Row>
                                <Row data-testid={"div_comment"} className="text-wrap">
                                    <p className="p-0 m-0 text-truncate">
                                        {uniform.comment}
                                    </p>
                                </Row>
                            </Col>
                        </Row>
                    </Col>
                    {(userRole >= AuthRole.inspector) &&
                        <div className="col-2 col-sm-auto d-sm-none align-self-center">
                            <Dropdown drop="start">
                                <Dropdown.Toggle variant="outline-primary" className="border-0" id={uniform.id + "-dropdown"} data-testid={"btn_menu"}>
                                    <FontAwesomeIcon icon={faBars} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={replaceItem} data-testid={"btn_menu_switch"}>
                                        {t('common.actions.replace')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => withdraw(uniform)} data-testid={"btn_menu_withdraw"}>
                                        {t('common.actions.return')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setOpenUniformId(uniform.id) }} data-testid={"btn_menu_open"}>
                                        {t('common.actions.open')}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    }
                    <Col sx="auto" className={`d-none d-sm-block col-auto ${"pt-1"}`}>
                        <TooltipActionButton
                            variantKey="open"
                            disabled={uniform.id === openUniformId}
                            onClick={() => setOpenUniformId(uniform.id)}
                        />
                    </Col>
                </div>
            </div>
            {openUniformId === uniform.id &&
                <UniformOffcanvas
                    uniform={uniform}
                    uniformType={uniformType}
                    onClose={() => setOpenUniformId(null)}
                    onSave={mutate} />
            }
        </div >
    )
}
