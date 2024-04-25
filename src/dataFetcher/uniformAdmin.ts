import { getUniformTypeList } from "@/actions/controllers/UniformConfigController";
import { getUniformSizeLists } from "@/actions/controllers/UniformSizeController";
import { UniformType } from "@/types/globalUniformTypes";

import useSWR from "swr";


export function useUniformTypeList(fallbackData?: UniformType[]) {
    const { data, mutate } = useSWR(
        'uniform.type.list',
        getUniformTypeList,
        { fallbackData });
    return { typeList: data, mutate };
}

export function useUniformType(typeId: string) {
    const { typeList, mutate } = useUniformTypeList();
    return {
        type: typeList?.find(t => t.id === typeId),
        mutate,
    }
}

export function useUniformGenerationListByType(typeId: string) {
    const { type, mutate } = useUniformType(typeId);
    return {
        generationList: type?.uniformGenerationList,
        mutate,
    }
}

export function useUniformSizeLists() {
    const { data } = useSWR('uniform.sizeList.list', getUniformSizeLists);
    return { sizeLists: data };
}

