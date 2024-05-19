import { getCadetInspection, getUnresolvedDeficienciesByCadet } from "@/actions/controllers/CadetInspectionController";
import useSWR from "swr";



export const useCadetInspection = (cadetId: string) => {
    const { data } = useSWR(`cadet.${cadetId}.inspection`, () => getCadetInspection(cadetId))
    return { cadetInspection: data };
}

export const useUnresolvedDeficienciesByCadet = (cadetId: string) => {
    const { data } = useSWR(`cadet.${cadetId}.deficiencies.unresolved`, () => getUnresolvedDeficienciesByCadet(cadetId));
    return { unresolvedDeficiencies: data };
}