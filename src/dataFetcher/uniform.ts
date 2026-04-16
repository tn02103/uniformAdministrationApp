import { getUniformItemHistory, getUniformItemLabels } from "@/dal/uniform/item/_index";
import useSWR from "swr";
import { swrKeys } from "./swrKeys";

export function useUniformLabels() {
    const { data, mutate, isLoading } = useSWR(swrKeys.uniformItemLabels, getUniformItemLabels);
    return {
        uniformLabels: data,
        isLoading,
        mutate
    }
}

export const useUniformItemHistory = (uniformId: string) => {
    const { data, mutate } = useSWR(
        swrKeys.uniformHistory(uniformId),
        () => getUniformItemHistory(uniformId)
    );

    return { history: data, mutate };
}
