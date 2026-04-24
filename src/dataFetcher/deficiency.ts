
import { getDeficiencyAdmintypeList } from "@/actions/controllers/DeficiencyTypeController";
import { getUniformItemDeficiencies } from "@/dal/uniform/item/_index";
import useSWR from "swr";
import { swrKeys } from "./swrKeys";
import { getDeficiencyTypeList } from "@/dal/inspection/deficiency/type";


export const useDeficiencyTypes = () => {
    const { data } = useSWR(
        swrKeys.deficiencyTypeList,
        getDeficiencyTypeList,
    );
    return {
        deficiencyTypeList: data
    }
}

export const useDeficienciesByUniformId = (uniformId: string, includeResolved: boolean) => {
    const { data: deficiencies, mutate } = useSWR(
        swrKeys.uniformDeficiencies(uniformId, includeResolved),
        () => getUniformItemDeficiencies({ uniformId, includeResolved }),
    );
    return { deficiencies, mutate };
}


export function useAdminDeficiencyTypes() {
    const { data, mutate } = useSWR(swrKeys.deficiencyAdminTypeList, getDeficiencyAdmintypeList);

    return { typeList: data, mutate }
}
