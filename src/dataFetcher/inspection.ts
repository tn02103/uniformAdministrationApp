
import { getInspectedCadetIdList, getInspectionState, getPlannedInspectionList, getUnresolvedDeficienciesByCadet } from "@/dal/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import useSWR from "swr";
import { swrKeys } from "./swrKeys";

export function useInspectionState() {
    const { data } = useSWR(
        swrKeys.inspectionStatus,
        getInspectionState,
        {
            refreshInterval: 3000
        }
    );
    return {
        inspectionState: data,
    }
}

export function usePlannedInspectionList(initialData?: PlannedInspectionType[]) {
    const {data, mutate} = useSWR(
        swrKeys.inspectionPlannedList,
        getPlannedInspectionList,
        {
            fallbackData: initialData,
        }
    )
    return {
        inspectionList: data,
        mutate,
    }
}

export function useInspectedCadetIdList(userRole: number, inspectionActive?: boolean) {
    const { data: inspectedIdList } = useSWR(
        swrKeys.inspectionInspectedIdList,
        () => (userRole >= AuthRole.inspector) ? getInspectedCadetIdList() : null,
        {
            refreshInterval: inspectionActive ? 3000 : undefined
        }
    )
    return { inspectedIdList }
}

export const useUnresolvedDeficienciesByCadet = (cadetId: string) => {
    const { data } = useSWR(swrKeys.unresolvedDeficienciesByCadet(cadetId), () => getUnresolvedDeficienciesByCadet(cadetId));
    return { unresolvedDeficiencies: data };
}