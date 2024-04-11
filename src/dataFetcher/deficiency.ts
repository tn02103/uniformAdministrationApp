import { getDeficiencyTypeList } from "@/actions/inspection/deficiencyType"
import useSWR from "swr"


export const useDeficiencyTypes = () => {
    const { data } = useSWR(
        `deficiencyTypes`,
        () => getDeficiencyTypeList(),
    );
    return {
        deficiencyTypeList: data
    }
}