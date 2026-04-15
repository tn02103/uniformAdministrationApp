import { getStorageUnitsWithUniformItems } from "@/dal/storageUnit/_index";
import useSWR from "swr";
import { swrKeys } from "./swrKeys";

export function useStorageUnitsWithUniformItemList() {
    const {data, mutate} = useSWR(swrKeys.storageUnitUniformItems, getStorageUnitsWithUniformItems);
    return {
        storageUnits: data,
        mutate
    }
}
