import { getStorageUnitsWithUniformItems } from "@/dal/storageUnit/_index";
import useSWR from "swr";

export function useStorageUnitsWithUniformItemList() {
   const {data, mutate} = useSWR('storageUnit/uniformItems', getStorageUnitsWithUniformItems);
    return {
        storageUnits: data,
        mutate
    }
}
