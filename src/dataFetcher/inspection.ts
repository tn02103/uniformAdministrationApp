
import { getInspectedCadetIdList, getInspectionState, getPlannedInspectionList } from "@/dal/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import useSWR from "swr";

export function useInspectionState() {
    const { data } = useSWR(
        "inspection.status",
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
        "inspection.planned.list",
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
        `inspection/status/idList`,
        () => (userRole >= AuthRole.inspector) ? getInspectedCadetIdList() : null,
        {
            refreshInterval: inspectionActive ? 3000 : undefined
        }
    )
    return { inspectedIdList }
}
