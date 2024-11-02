
import { getInspectionState } from "@/actions/controllers/InspectionController";
import { getPlannedInspectionList } from "@/dal/inspection/planned/get";
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
