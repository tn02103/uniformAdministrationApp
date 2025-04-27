
import { getDeficiencyAdmintypeList } from "@/actions/controllers/DeficiencyTypeController";
import { getDeficiencyTypeList } from "@/actions/controllers/InspectionController";
import { getUniformItemDeficiencies } from "@/dal/uniform/item/_index";
import useSWR from "swr";


export const useDeficiencyTypes = () => {
    const { data } = useSWR(
        `deficiency.type.list`,
        () => getDeficiencyTypeList(),
    );
    return {
        deficiencyTypeList: data
    }
}

export const useDeficienciesByUniformId = (uniformId: string, includeResolved: boolean) => {
    const { data: deficiencies, mutate } = useSWR(
        `uniform.${uniformId}.deficiencies.${JSON.stringify(includeResolved)}`,
        () => getUniformItemDeficiencies({ uniformId, includeResolved }),
    );
    return { deficiencies, mutate };
}


export function useAdminDeficiencyTypes() {
    const { data, mutate } = useSWR('deficiency.type.adminList', getDeficiencyAdmintypeList);

    return { typeList: data, mutate }
}
