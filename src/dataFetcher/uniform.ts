import { getUniformItemHistory } from "@/dal/uniform/item/_index";
import useSWR from "swr";


export const useUniformItemHistory = (uniformId: string) => {
    const { data, mutate } = useSWR(
        `uniform.${uniformId}.history`,
        () => getUniformItemHistory(uniformId)
    );

    return { history: data, mutate };
}
