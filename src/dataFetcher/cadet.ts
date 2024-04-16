import { getCadetMaterialMap } from "@/actions/controllers/CadetMaterialController";
import { getCadetUniformMap } from "@/actions/controllers/CadetUniformController";
import { CadetMaterialMap, CadetUniformMap } from "@/types/globalCadetTypes";
import { UniformLabel } from "@/types/globalUniformTypes";
import useSWR, { KeyedMutator } from "swr";
import { useUniformTypeList } from "./uniformAdmin";



type useCadetUniformMapReturnType = {
    map?: CadetUniformMap;
    mutate: KeyedMutator<CadetUniformMap>,
    error: any
}
export function useCadetUniformMap(cadetId: string, initialData?: CadetUniformMap): useCadetUniformMapReturnType {
    const { data, mutate, error } = useSWR(
        `cadet.${cadetId}.uniform`,
        () => getCadetUniformMap(cadetId).catch(e => { console.log("cought SAError", e, Object.entries(e)); throw e }),
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
    const { data, mutate } = useSWR(
        `cadet/material/${cadetId}`,
        () => getCadetMaterialMap(cadetId),
        {
            fallbackData: initialData
        }
    );

    return {
        materialMap: data,
        mutate
    }
}

export function useCadetMaterialDescriptionList(cadetId: string) {
    const { materialMap } = useCadetMaterialMap(cadetId);
    if (!materialMap) return [];
    return Object.values(materialMap).reduce(
        (list: UniformLabel[], matList) => [
            ...list,
            ...matList.map(mat => ({
                id: mat.id,
                description: `${mat.groupName}-${mat.typename}`
            }))
        ],
        []
    );
}