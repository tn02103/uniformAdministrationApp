import { UniformConfiguration, UniformSizelist, UniformType } from "../types/globalUniformTypes";

type Props = {
    generationId?: string;
    sizelists: UniformSizelist[];
} & ({ type: UniformType } | ComplextProps)
type ComplextProps = {
    type: string;
    typeList: UniformType[];
}
export const getUniformSizelist = (props: Props) => {
    const { generationId, sizelists, type } = props;
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

    // get sizelist
    let sizelist
    if (uniformType.usingGenerations && generationId) {
        const generation = uniformType.uniformGenerationList.find(gen => gen.id == generationId);
        if (generation) {
            sizelist = sizelists.find(list => list.id === generation.fk_sizelist);
        }
    }
    if (!sizelist) {
        sizelist = sizelists.find(list => list.id === uniformType!.fk_defaultSizelist);
    }
    return sizelist;
}

