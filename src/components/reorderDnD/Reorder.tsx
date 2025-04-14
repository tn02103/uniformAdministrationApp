import React, { useCallback, useEffect, useState } from "react";
import { useDrop } from 'react-dnd';
import { DragableTypes, move } from "./ReorderHelper";

type ReorderContainerProps<T extends { id: string }> = {
    items: T[];
    itemType: keyof typeof DragableTypes;
    children: (p: {
        wrapperRef: (node: HTMLElement | null) => void;
        items: T[];
        findItem: (id: string) => { index: number, item: T };
        moveItem: (id: string, atIndex: number) => void;
    }) => React.ReactNode;
}
export const ReorderContainer = <T extends { id: string }>({ items: initialItems, itemType, children }: ReorderContainerProps<T>) => {
    const [items, setItems] = useState<T[]>(initialItems);
    const [, drop] = useDrop({ accept: DragableTypes[itemType] });

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const findItem = useCallback(
        (id: string) => {
            const item = items.filter((i) => i.id === id)[0]
            return {
                item,
                index: items.indexOf(item),
            }
        },
        [items],
    )
    const moveItem = useCallback(
        (id: string, atIndex: number) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;
            setItems((prevItems) => move(prevItems, item, atIndex));

        },
        [items, setItems],
    )

    const dropRef = (node: HTMLElement | null) => {
        if (node) {
            drop(node);
        }
    };

    return children({ items, findItem, moveItem, wrapperRef: dropRef })
}
