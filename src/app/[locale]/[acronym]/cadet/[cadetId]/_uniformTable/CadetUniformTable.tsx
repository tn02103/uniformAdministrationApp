"use client"

import TooltipIconButton from "@/components/Buttons/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useCadetUniformMap } from "@/dataFetcher/cadet";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformType, UniformWithOwner } from "@/types/globalUniformTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CadetUniformTableIssueModal, CadetUniformTableIssueModalProps } from "./CadetUniformTableIssueModal";
import { CadetUniformTableItemRow } from "./CadetUniformTableItemRow";

type PropType = {
    uniformMap: CadetUniformMap,
}
export const CadetUniformTable = ({ ...props }: PropType) => {
    const t = useI18n();
    const { cadetId }: { cadetId: string, locale: string } = useParams();

    const { userRole } = useGlobalData();
    const { typeList } = useUniformTypeList();
    const { map } = useCadetUniformMap(cadetId, props.uniformMap);
    const [openUniformId, setOpenUniformId] = useState<string | null>(null);
    const [issueModalProps, setIssueModalProps] = useState<CadetUniformTableIssueModalProps | null>(null);

    const openIssueModal = (type: UniformType, itemToReplace?: UniformWithOwner) => setIssueModalProps({
        cadetId,
        type,
        itemToReplace: itemToReplace ? { id: itemToReplace.id, number: itemToReplace.number } : undefined,
        onClose: () => setIssueModalProps(null),
    });

    return (
        <div className="container-lg border border-2 rounded mt-4 p-0">
            <div className="row fs-5 fw-bold p-0">
                <div className="col-12 text-center p-0">{t('cadetDetailPage.header.uniformTable')}</div>
            </div>
            <div data-testid="div_uniform_typeList">
                {typeList?.map((type) => {
                    const items = map?.[type.id] ?? [];
                    return (
                        <div data-testid={`div_utype_${type.id}`} key={"typeRow" + type.id} className="col-12">
                            <div style={{ background: "#f2f2f2" }} className="row m-0 border-top border-bottom border-dark border-1 py-1 ">
                                <div data-testid={"div_name"} className="col-2 col-md-1 fw-bold">{type.name}</div>
                                <div data-testid={"div_uitems_amount"} className={`col-4 col-sm-2 col-xl-1 ${(items.length < type.issuedDefault) ? "text-orange-500" : "fw-light"}`}>
                                    ({items?.length} {t('common.of')} {type.issuedDefault})
                                </div>
                                {(userRole >= AuthRole.inspector) &&
                                    <div className="col-1">
                                        <TooltipIconButton
                                            testId={`btn_issue`}
                                            variant="outline-success"
                                            buttonSize="sm"
                                            tooltipText={t('common.actions.issue_item', { item: type.name })}
                                            icon={faPlus}
                                            onClick={() => openIssueModal(type)}
                                        />
                                    </div>
                                }
                            </div>
                            <div data-testid="div_itemList">
                                {items?.map((uniform) => {
                                    return (
                                        <CadetUniformTableItemRow
                                            key={"uniformItemRow" + uniform.id}
                                            uniform={uniform}
                                            uniformType={type}
                                            replaceItem={() => openIssueModal(type, uniform)}
                                            openUniformId={openUniformId}
                                            setOpenUniformId={setOpenUniformId}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
            {issueModalProps &&
                <CadetUniformTableIssueModal {...issueModalProps} />
            }
        </div>
    )
}
