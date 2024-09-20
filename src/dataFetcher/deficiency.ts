
import { getDeficiencyAdmintypeList } from "@/actions/controllers/DeficiencyTypeController";
import { getDeficiencyTypeList } from "@/actions/controllers/InspectionController";
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


export function useAdminDeficiencyTypes() {
    const {data, mutate} = useSWR('deficiency.type.adminList', getDeficiencyAdmintypeList);

    return {typeList: data, mutate}
}
