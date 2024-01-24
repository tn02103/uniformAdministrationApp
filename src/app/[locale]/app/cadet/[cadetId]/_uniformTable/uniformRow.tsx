"use client"

import { returnUniformItem } from "@/actions/cadet/uniform";
import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { Uniform, UniformType } from "@/types/globalUniformTypes";
import { faBars, faPenToSquare, faRightLeft, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { toast } from "react-toastify";
import { useSWRConfig } from "swr";

type PropType = {
    uniform: Uniform;
    uniformType: UniformType;
    replaceItem: () => void;
}
const UniformRow = (props: PropType) => {
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform')
    const modal = useModal();
    const { mutate } = useSWRConfig();
    const { cadetId }: { cadetId: string } = useParams();
    const { userRole } = useGlobalData();

    const { uniform, uniformType } = props;
    const [showEditRow, setShowEditRow] = useState<boolean>(false);
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
            `cadetUniform/${cadetId}`,
            returnUniformItem(uniform.id, cadetId),
        ).catch((e) => {
            console.error(e);
            toast.error(t('cadetDetailPage.returnUniform.error'))
        });

        modal?.simpleYesNoModal({
            header: modalT('return.header'),
            message: modalT('return.message', { type: props.uniformType.name, number: uniform.number }),
            primaryFunction: returnItem,
            primaryOption: t('common.actions.return')
        });
    }

    return (
        <div data-testid={`div_uitem_${uniform.id}`} className={`row border-top border-1 white`}>
            <div className="col-12">
                <div className={`row pb-2 pt-1 ${selected ? "bg-primary-subtle" : "bg-white"}`} onClick={onLineClick}>
                    {(userRole >= AuthRole.inspector) &&
                        <div className="d-none d-sm-block col-auto align-self-center">
                            <TooltipIconButton
                                variant="outline-danger"
                                buttonSize="sm"
                                tooltipText={t('common.actions.return')}
                                icon={faRightToBracket}
                                iconClass="fa-flip-horizontal"
                                onClick={() => withdraw(uniform)}
                                testId={"btn_withdraw"}
                            />
                            <TooltipIconButton
                                variant="outline-primary"
                                buttonSize="sm"
                                tooltipText={t('common.actions.replace')}
                                icon={faRightLeft}
                                onClick={props.replaceItem}
                                testId={"btn_switch"}
                            />
                        </div>
                    }
                    <div className="col-10 col-sm-9 col-lg-10 col-xl-10">
                        <div className="row fs-8 fw-bold fst-italic">
                            <div className="col-3 col-md-2 col-lg-1">{t('common.uniform.number')}</div>
                            <div className={`col-5 col-md-4 col-lg-3 col-xxl-2 ${!uniformType.usingGenerations ? "d-none d-sm-block" : ""}`}>
                                {uniformType.usingGenerations ? t('common.uniform.generation') : ""}
                            </div>
                            <div className={`col-4 col-md-2 col-xl-1 ${!uniformType.usingSizes ? "d-none d-sm-block" : ""}`}>
                                {uniformType.usingSizes ? t('common.uniform.size') : ""}
                            </div>
                            <div className="d-none d-md-block col-4">{t('common.comment')}</div>
                        </div>
                        <div className="row">
                            <div data-testid={"div_number"} className={`col-3 col-md-2 col-lg-1 fw-bold ${uniform.active ? "" : "text-danger "}`}>
                                {uniform.number}
                            </div>
                            {uniformType.usingGenerations ?
                                <div data-testid={"div_generation"} className={"col-5 col-md-4 col-lg-3 col-xxl-2 text-truncate " + (uniform.generation ? uniform.generation.outdated ? "text-warning" : "" : "text-danger")}>
                                    {uniform.generation ? uniform.generation.name : "K.A."}
                                </div>
                                : <div data-testid={"div_generation"} className="d-none d-sm-block col-5 col-md-4 col-lg-3 col-xxl-2 text-secondary">
                                    ---
                                </div>
                            }
                            {uniformType.usingSizes ?
                                <div data-testid={"div_size"} className={`col-4 col-md-2 col-xl-1 ${uniform.size ? "" : "text-danger"}`}>
                                    {uniform.size ? uniform.size.name : "K.A."}</div>
                                : <div data-testid={"div_size"} className="d-none d-sm-block col-4 col-md-2 col-xl-1 text-secondary">
                                    ---
                                </div>
                            }
                            <div data-testid={"div_comment"} className="d-none d-md-inline col-md-4 col-lg-6 col-xl-7 col-xxl-8 text-truncate">
                                {uniform.comment}
                            </div>
                        </div>
                    </div>
                    {(userRole >= AuthRole.inspector) &&
                        <div className="col-1 col-sm-auto d-sm-none align-self-center">
                            <Dropdown drop="start">
                                <Dropdown.Toggle variant="outline-primary" className="border-0" id={uniform.id + "-dropdown"} data-testid={"btn_menu"}>
                                    <FontAwesomeIcon icon={faBars} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={props.replaceItem} data-testid={"btn_menu_switch"}>
                                        {t('common.actions.replace')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => withdraw(uniform)} data-testid={"btn_menu_withdraw"}>
                                        {t('common.actions.return')}
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setShowEditRow(!showEditRow); }} data-testid={"btn_menu_edit"}>
                                        {t('common.actions.edit')}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    }
                    {((userRole >= AuthRole.inspector) && !showEditRow) &&
                        <div className="d-none d-sm-block col-auto align-self-center">
                            <TooltipIconButton
                                icon={faPenToSquare}
                                variant="outline-primary"
                                buttonSize="sm"
                                tooltipText={t('common.actions.edit_item', { item: uniformType.name })}
                                onClick={() => setShowEditRow(!showEditRow)}
                                testId={"btn_edit"}
                            />
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default UniformRow;
