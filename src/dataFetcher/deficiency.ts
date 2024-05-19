
import { getDeficiencyTypeList } from "@/actions/controllers/InspectionController";
import useSWR from "swr";


export const useDeficiencyTypes = () => {
    const { data } = useSWR(
        `deficiencyTypes`,
        () => getDeficiencyTypeList(),
    );
    return {
        deficiencyTypeList: data
    }
}
