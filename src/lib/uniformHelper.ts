import { UniformConfiguration, UniformSizeList, UniformType } from "../types/globalUniformTypes";

type Props = {
    generationId: string;
    sizeLists: UniformSizeList[];
} & ({ type: UniformType } | ComplextProps)
type ComplextProps = {
    type: string;
    typeList: UniformType[];
}
export const getUniformSizeList = (props: Props) => {
    const { generationId, sizeLists, type } = props;
    // get uniformType
    if (!type) {
        return null;
    }
    let uniformType: UniformType | undefined;
    if (typeof type === "string") {
        uniformType = (props as ComplextProps).typeList?.find(t => t.id === type);

        if (!uniformType) {
            return null;
        }
    } else {
        uniformType = type;
    }

    // not using sizes
    if (!uniformType.usingSizes) {
        return null;
    }

    // get sizeList
    let sizeList
    if (uniformType.usingGenerations && generationId) {
        const generation = uniformType.uniformGenerationList.find(gen => gen.id == generationId);
        if (generation) {
            sizeList = sizeLists.find(list => list.id === generation.fk_sizeList);
        }
    }
    if (!sizeList) {
        sizeList = sizeLists.find(list => list.id === uniformType!.fk_defaultSizeList);
    }
    return sizeList;
}

