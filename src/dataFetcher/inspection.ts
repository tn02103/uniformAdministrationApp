
import { getInspectionState } from "@/actions/controllers/InspectionController";
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
