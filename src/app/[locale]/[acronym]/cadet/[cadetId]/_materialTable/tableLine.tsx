"use client";

import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { CadetMaterial, MaterialGroup } from "@/types/globalMaterialTypes";
import { faRightLeft, faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

type PropType = {
    material: CadetMaterial;
    group: MaterialGroup;
    handleEdit: () => void;
    handleReturn: () => void;
}
const MaterialTableLine = ({ material, group, handleEdit, handleReturn }: PropType) => {
    const t = useI18n();
    const [selected, setSelected] = useState<boolean>(false);
    const { userRole } = useGlobalData();

    function onLineClick(event: any) {
        if (event.target.tagName !== "BUTTON"
            && event.target.parentNode?.tagName !== "BUTTON"
            && event.target.parentNode?.parentNode?.tagName !== "BUTTON") {
            setSelected(!selected);
        }
    }
    return (
        <div data-testid={`div_material_${material.id}`} className={`row border-top border-1 pb-2 pt-1 ${selected ? "bg-primary-subtle" : "bg-white"}`} onClick={onLineClick}>
            <div className="col-6 col-sm col-xl-6 ms-3">
                <div className="row fs-8 fw-bold fst-italic">
                    {t('common.material.type_one')}
                </div>
                <div data-testid={`div_name`} className={`row`}>
                    {group.typeList.length <= 1 ? "--" : material.typename}
                </div>
            </div>
            <div className={`col`}>
                <div className="row fs-8 fw-bold fst-italic">
                    {t('common.material.issued')}:
                </div>
                <div data-testid={`div_issued`}
                    className={`row ${(group.issuedDefault && group.issuedDefault !== material.issued) ? "text-warning" : ""}`}
                    title={(group.issuedDefault && group.issuedDefault !== material.issued) ? t('cadetDetailPage.defaultIssuedWarning', { count: group.issuedDefault }) : ""}
                >
                    {material.issued}
                </div>
            </div>
            {(userRole >= AuthRole.inspector) &&
                <div className="col-auto align-self-center">
                    <TooltipIconButton
                        variant="outline-primary"
                        buttonSize="sm"
                        tooltipText={t('common.actions.changeIssued')}
                        icon={faRightLeft}
                        onClick={handleEdit}
                        testId={`btn_switch`}
                    />
                    <TooltipIconButton
                        variant="outline-danger"
                        buttonSize="sm"
                        tooltipText={t('common.actions.return')}
                        icon={faRightToBracket}
                        onClick={handleReturn}
                        testId={`btn_return`}
                    />
                </div>
            }
        </div>
    )
}

export default MaterialTableLine;