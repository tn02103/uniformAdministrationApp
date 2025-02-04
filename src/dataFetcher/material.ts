
import { getMaterialConfiguration } from "@/dal/material/type/get";
import useSWR from "swr";


export function useMaterialConfiguration() {
    const { data } = useSWR('materialConfig', getMaterialConfiguration, {
        revalidateOnFocus: false,
    });
    return { config: data }
}

export function useMaterialTypeList(groupId: string | undefined) {
    const { config } = useMaterialConfiguration();
    if (!groupId) return [];
    if (!config) return [];
    const group = config.find(g => g.id === groupId);
    if (!group) return [];
    return group.typeList;
}