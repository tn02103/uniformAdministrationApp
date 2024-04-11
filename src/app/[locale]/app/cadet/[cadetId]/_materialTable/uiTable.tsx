"use client";

import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { useCadetMaterialMap } from "@/dataFetcher/cadet";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { CadetMaterialMap } from "@/types/globalCadetTypes";
import { CadetMaterial, MaterialGroup } from "@/types/globalMaterialTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import MaterialTableLine from "./tableLine";
import { returnMaterial } from "@/actions/controllers/CadetMaterialController";

type PropType = {
    initialData: CadetMaterialMap,
    materialConfig: MaterialGroup[],
}
const MaterialTable = ({ initialData, materialConfig }: PropType) => {
    const { cadetId }: { cadetId: string } = useParams();
    const { userRole } = useGlobalData();
    const modal = useModal();
    const t = useI18n();

    const { materialMap, mutate } = useCadetMaterialMap(cadetId, initialData);

    function handleIssue(group: MaterialGroup, material?: CadetMaterial) {
        modal?.issueMaterialModal(
            cadetId,
            group,
            materialMap ? materialMap[group.id] : [],
            material);
    }
    function handleReturn(material: CadetMaterial) {
        returnMaterial(cadetId, material.id).then((data) => {
            mutate(data);
        }).catch((error) => {
            toast.error('Beim Zurückgeben des Materials ist ein unerwartetes Problem aufgetreten');
            console.error(error);
        });
    }

    return (
        <div data-testid="div_matGroupList">
            {materialConfig.map((materialGroup) => {
                return (
                    <div key={`groupDiv-${materialGroup.id}`} data-testid={`div_matGroup_${materialGroup.id}`}>
                        <div style={{ background: "#f2f2f2" }} className="row justify-content-between border-top border-bottom border-dark border-1 py-1">
                            <div data-testid={"div_groupName"}
                                title={(!!materialMap && !materialGroup.multitypeAllowed && materialMap[materialGroup.id]?.length > 1) ? t('cadetDetailPage.multitypeWarning') : ""}
                                className={`col-6 col-sm-4 fw-bold ${(!!materialMap && !materialGroup.multitypeAllowed && materialMap[materialGroup.id]?.length > 1) ? "text-danger" : ""}`}
                            >
                                {materialGroup.description}
                            </div>
                            {(userRole >= AuthRole.inspector) &&
                                <div className="col-2 ">
                                    <TooltipIconButton
                                        icon={faPlus}
                                        variant="outline-success"
                                        buttonSize="sm"
                                        disabled={(!!materialMap && materialMap[materialGroup.id]?.length === materialGroup.typeList.length)}
                                        onClick={() => handleIssue(materialGroup)}
                                        tooltipText={t('common.actions.issue')}
                                        testId={"btn_issue"}
                                    />
                                </div>
                            }
                        </div>
                        <div data-testid="div_typeList">
                            {materialMap && materialMap[materialGroup.id]?.map((material) => (
                                <MaterialTableLine
                                    key={material.id}
                                    material={material}
                                    group={materialGroup}
                                    handleEdit={() => handleIssue(materialGroup, material)}
                                    handleReturn={() => handleReturn(material)} />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    );
}

export default MaterialTable;