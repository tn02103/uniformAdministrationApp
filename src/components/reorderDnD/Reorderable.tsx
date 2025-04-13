import { useDrag, useDrop } from "react-dnd";
import { DragableTypes } from "./ReorderHelper";

export type ReorderableChildRenderProps<T> = {
    draggableRef: (node: HTMLElement | null) => void;
    previewRef: (node: HTMLElement | null) => void;
    isDragging: boolean;
}
export type ReorderableProps<T> = {
    item: T,
    itemType: keyof typeof DragableTypes;
    moveItem: (id: string, to: number) => void;
    findItem: (id: string) => { index: number, item: T };
    children: (p: ReorderableChildRenderProps<T>) => React.ReactNode;
    onDragEnd?: (itemId: string) => void;
}

export const Reorderable = <T extends { id: string }>({ itemType, item, findItem, moveItem, children, onDragEnd }: ReorderableProps<T>) => {
    const originalIndex = findItem(item.id).index;
    const [{ isDragging }, drag, preview] = useDrag(
        () => ({
            type: DragableTypes[itemType],
            item: { id: item.id, originalIndex },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
            end: (item, monitor) => {
                console.log("end", item, monitor);
                const { id: droppedId, originalIndex } = item;
                const didDrop = monitor.didDrop();
                if (didDrop) {
                    onDragEnd?.(item.id);
                } else {
                    console.log("did not drop", droppedId, originalIndex);
                    moveItem(droppedId, originalIndex);
                }
            },
        }),
        [item.id, originalIndex, moveItem],
    );

    const [, drop] = useDrop(
        () => ({
            accept: DragableTypes[itemType],
            hover({ id: draggedId }: T) {
                console.log("hover", draggedId, item.id);
                if (draggedId !== item.id) {
                    const overIndex = findItem(item.id).index;
                    moveItem(draggedId, overIndex)
                }
            },
        }),
        [findItem, moveItem],
    );

    const draggableRef = (node: HTMLElement | null) => {
        if (node) {
            drag(drop(node));
        }
    };
    const previewRef = (node: HTMLElement | null) => {
        if (node) {
            preview(node);
        }
    }

    return children({ isDragging, draggableRef, previewRef });
}
