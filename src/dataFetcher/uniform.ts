import { getUniformItemLabels } from "@/dal/uniform/item/_index";
import useSWR from "swr";


export function useUniformLabels() {
    const { data, mutate } = useSWR('uniformItemLabels', getUniformItemLabels);
    return {
        uniformLabels: data,
        mutate
    }
}
