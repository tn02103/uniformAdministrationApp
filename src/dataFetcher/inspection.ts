
import { getClosedInspectionList, getClosedInspectionReport, getInspectedCadetIdList, getInspectionState, getInspectionsByCadet, getPlannedInspectionList, getUnresolvedDeficienciesByCadet } from "@/dal/inspection";
import { AuthRole } from "@/lib/AuthRoles";
import { ClosedInspectionSummary, InspectionReview } from "@/types/deficiencyTypes";
import { CadetInspectionHistoryRow, PlannedInspectionType } from "@/types/inspectionTypes";
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

/**
 * SWR hook for the list of closed inspections.
 *
 * @param initialData - Optional SSR-fetched data used as fallback.
 * @returns `{ closedInspectionList }` — the list of closed inspection summaries.
 */
export function useClosedInspectionList(initialData?: ClosedInspectionSummary[]) {
    const { data } = useSWR(
        swrKeys.inspectionClosedList,
        getClosedInspectionList,
        {
            fallbackData: initialData,
        }
    );
    return { closedInspectionList: data };
}

/**
 * SWR hook for a single closed inspection's full report.
 *
 * @param inspectionId - The ID of the closed inspection.
 * @returns `{ inspectionReport }` — the full `InspectionReview` for the given inspection.
 */
export function useClosedInspectionReport(inspectionId: string) {
    const { data } = useSWR(
        swrKeys.inspectionClosedReport(inspectionId),
        () => getClosedInspectionReport({ inspectionId }),
    );
    return { inspectionReport: data as InspectionReview | undefined };
}

/**
 * SWR hook for the inspection history of a single cadet.
 *
 * @param cadetId - The ID of the cadet.
 * @returns `{ inspectionHistory }` — the list of past inspection rows for the cadet.
 */
export function useInspectionsByCadet(cadetId: string) {
    const { data } = useSWR(
        swrKeys.cadetInspectionHistory(cadetId),
        () => getInspectionsByCadet({ cadetId }),
    );
    return { inspectionHistory: data as CadetInspectionHistoryRow[] | undefined };
}
