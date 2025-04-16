"use client"

import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { UniformOffcanvas } from "@/components/UniformOffcanvas/UniformOffcanvas";
import { returnUniformItem, updateUniformItem } from "@/dal/uniform/item/_index";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { getUniformSizelist } from "@/lib/uniformHelper";
import { Uniform, UniformFormData, UniformSizelist, UniformType } from "@/types/globalUniformTypes";
import { UniformFormType } from "@/zod/uniform";
import { faArrowUpRightFromSquare, faBars, faCheck, faPencil, faRightLeft, faRightToBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Dropdown, Form, FormControl, Row } from "react-bootstrap";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { useSWRConfig } from "swr";

type PropType = {
    uniform: Uniform;
    uniformType: UniformType;
    replaceItem: () => void;
    openUniformId: string | null;
    setOpenUniformId: (id: string | null) => void;
}
const UniformRow = ({ uniform, uniformType, replaceItem, openUniformId, setOpenUniformId }: PropType) => {
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform')
    const modal = useModal();

    const { cadetId, locale }: { cadetId: string; locale: string } = useParams();
    const { userRole } = useGlobalData();
    const { mutate } = useCadetUniformMap(cadetId);

    const [selected, setSelected] = useState<boolean>(false);

    function onLineClick(event: any) {
        if (event.target.tagName !== "BUTTON"
            && event.target.parentNode?.tagName !== "BUTTON"
            && event.target.parentNode?.parentNode?.tagName !== "BUTTON") {
            setSelected(!selected);
        }
    }


    function withdraw(uniform: Uniform) {
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

    return (
        <div data-testid={`div_uitem_${uniform.id}`} className={`row border-top border-1 white m-0`}>
            <div className="col-12 p-0">
                <div className={`row pb-2 pt-1 m-0  justify-content-between ${selected ? "bg-primary-subtle" : "bg-white"}`} onClick={onLineClick}>
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
                    <Col xs={10} sm={9} md={9} lg={9} xxl={10} className="ps-2 pe-0">
                        <Row>
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
                                <GenerationRow
                                    uniform={uniform}
                                    uniformType={uniformType} />
                            </Col>
                            <Col xs={uniformType.usingSizes ? 3 : 0} sm={2} md={2} xxl={1}>
                                <Row className="fs-8 fw-bold fst-italic">
                                    {uniformType.usingSizes ? t('common.uniform.size') : ""}
                                </Row>
                                <SizeRow uniform={uniform}
                                    uniformType={uniformType} />
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
                        <div className="col-1 col-sm-auto d-sm-none align-self-center">
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
                                    <Link prefetch={false} href={'/[locale]/app/uniform/[uniformId]'} as={`/${locale}/app/uniform/${uniform.id}`}>
                                        <Dropdown.Item onClick={() => { modal?.uniformItemDetailModal(uniform.id, uniformType, cadetId) }} data-testid={"btn_menu_open"}>
                                            {t('common.actions.open')}
                                        </Dropdown.Item>
                                    </Link>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    }
                    <Col sx="auto" className={`d-none d-sm-block col-auto ${"pt-1"}`}>
                        <TooltipIconButton
                            icon={faArrowUpRightFromSquare}
                            variant="outline-secondary"
                            tooltipText="Detailansicht öffnen"
                            testId="btn_open"
                            disabled={uniform.id === openUniformId}
                            onClick={() => setOpenUniformId(uniform.id)}
                            buttonSize="sm"
                            buttonType="button"
                            key={"btn_open"}
                        />
                    </Col>
                </div>
            </div>
            {openUniformId === uniform.id &&
                <UniformOffcanvas
                    uniform={uniform}
                    onClose={() => setOpenUniformId(null)}
                    onSave={() => mutate()} />
            }
        </div >
    )
}

const GenerationRow = ({
    uniformType, uniform
}: {
    uniformType: UniformType,
    uniform: Uniform,
}) => {
    if (!uniformType.usingGenerations) return (
        <Row data-testid={"div_generation"} className="text-secondary">
            ---
        </Row>
    );

    <Row data-testid={"div_generation"} className={`text-truncate pe-2 ${!uniform.generation ? "text-danger" : uniform.generation.outdated ? "text-warning" : ""}`}>
        <p className="text-truncate p-0 m-0">
            {uniform.generation ? uniform.generation.name : "K.A."}
        </p>
    </Row>
}

const SizeRow = ({ uniform, uniformType
}: {
    uniform: Uniform;
    uniformType: UniformType;
}) => {

    if (!uniformType.usingSizes) return (
        <Row data-testid={"div_size"} className={"text-secondary"}>
            ---
        </Row>
    )

    return (
        <Row data-testid={"div_size"} className={!uniform.size ? "text-danger" : ""}>
            <p className="d-none d-md-block p-0 m-0 text-truncate">
                {uniform.size ? uniform.size.name : "K.A."}
            </p>
            <p className="d-md-none p-0 m-0">
                {uniform.size ? uniform.size.name : "K.A."}
            </p>
        </Row>
    )
}

export default UniformRow;
