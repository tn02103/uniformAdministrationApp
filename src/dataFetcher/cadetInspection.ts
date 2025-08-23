import { getUnresolvedDeficienciesByCadet } from "@/actions/controllers/CadetInspectionController";
import useSWR from "swr";





export const useUnresolvedDeficienciesByCadet = (cadetId: string) => {
    const { data } = useSWR(`cadet.${cadetId}.deficiencies.unresolved`, () => getUnresolvedDeficienciesByCadet(cadetId));
    return { unresolvedDeficiencies: data };
}