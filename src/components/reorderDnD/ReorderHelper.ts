

export const DragableTypes = {
    UNIFORM_TYPE: "uniformType",
    UNIFORM_GENERATION: "uniformGeneration",
}

export const move = <T>(array: T[], item: T, replaceAtIndex: number): T[] => {
    const newArray = [...array];
    const removeAtIndex = newArray.indexOf(item);

    if (removeAtIndex === -1 || replaceAtIndex === -1) {
        return newArray
    }

    newArray.splice(removeAtIndex, 1);
    newArray.splice(replaceAtIndex, 0, item);

    return newArray;
}
