import { getAllUniformSizesList, getUniformSizelists } from "@/actions/controllers/UniformSizeController";
import { getUniformTypeList } from "@/dal/uniform/type/_index";
import { UniformSize, UniformType } from "@/types/globalUniformTypes";

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

export function useUniformSizelists() {
    const { data, mutate } = useSWR('uniform.sizelist.list', getUniformSizelists);
    return { sizelistList: data, mutate };
}


export function useUniformSizelist(id: string) {
    const { sizelistList, mutate } = useUniformSizelists();
    return {
        sizelist: sizelistList?.find(sl => sl.id === id),
        mutate
    }
}

export function useAllUniformSizesList(initialValue?: UniformSize[]) {
    const { data, mutate } = useSWR('uniform.size.all', getAllUniformSizesList, { fallbackData: initialValue });
    return { sizes: data, mutate };
}

