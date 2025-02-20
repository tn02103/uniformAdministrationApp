import { getCadetMaterialList, getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";
import { getCadetUniformMap } from "@/dal/cadet/uniformMap";
import { CadetMaterialMap, CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformLabel } from "@/types/globalUniformTypes";
import useSWR, { KeyedMutator, MutatorOptions, mutate } from "swr";
import { useUniformTypeList } from "./uniformAdmin";



type useCadetUniformMapReturnType = {
    map?: CadetUniformMap;
    mutate: KeyedMutator<CadetUniformMap>,
    error: any
}
export function useCadetUniformMap(cadetId: string, initialData?: CadetUniformMap): useCadetUniformMapReturnType {
    const { data, mutate, error } = useSWR(
        `cadet.${cadetId}.uniform`,
        () => getCadetUniformMap(cadetId).catch(e => { console.error("cought SAError", e, Object.entries(e)); throw e }),
        {
            fallbackData: initialData,
        }
    );
    return {
        map: data,
        mutate,
        error
    }
}

export function useCadetUniformDescriptList(cadetId: string) {
    const { map } = useCadetUniformMap(cadetId);
    if (!map) return undefined;

    return Object.values(map)
        .reduce((descList: UniformLabel[], uList) => [
            ...descList,
            ...uList.map(item => ({
                id: item.id,
                description: `${item.type.name}-${item.number}`
            }))
        ], []);
}

export function useCadetUniformComplete(cadetId: string) {
    const { typeList } = useUniformTypeList();
    const { map } = useCadetUniformMap(cadetId);
    if (!typeList || !map) return false;
    return typeList.reduce(
        (bol: boolean, type) => {
            if (!bol)
                return false;
            if (!map[type.id] && type.issuedDefault > 0)
                return false;
            return (map[type.id].length >= type.issuedDefault);
        },
        true
    )
}

export function useCadetMaterialMap(cadetId: string, initialData?: CadetMaterialMap) {
    const { data } = useSWR(
        `cadet/material/${cadetId}`,
        () => getCadetMaterialMap(cadetId),
        {
            fallbackData: initialData
        }
    );

    return {
        materialMap: data,
        mutate: (data: Promise<CadetMaterialMap> | CadetMaterialMap, options?: MutatorOptions) => mutate(
            (key) => (typeof key === "string") && key.startsWith(`cadet/material/${cadetId}`),
            data, options)
    }
}

export const useCadetMaterialDescriptionList = (cadetId: string) => {
    const { data } = useSWR(`cadet/material/${cadetId}/list`, () => getCadetMaterialList(cadetId));
    return { materialList: data };
};