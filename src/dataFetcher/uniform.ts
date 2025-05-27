import { getUniformItemHistory, getUniformItemLabels } from "@/dal/uniform/item/_index";
import useSWR from "swr";

export function useUniformLabels() {
    const { data, mutate } = useSWR('uniformItemLabels', getUniformItemLabels);
    return {
        uniformLabels: data,
        mutate
    }
}

export const useUniformItemHistory = (uniformId: string) => {
    const { data, mutate } = useSWR(
        `uniform.${uniformId}.history`,
        () => getUniformItemHistory(uniformId)
    );

    return { history: data, mutate };
}
