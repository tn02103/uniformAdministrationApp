import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ReorderContainer } from "./Reorder";
import { Reorderable, ReorderableChildRenderProps } from "./Reorderable";
import { DragableTypes } from "./ReorderHelper";

type ReorderableTableBodyProps<T> = {
    items: T[];
    itemType: keyof typeof DragableTypes;
    children: (p: ReorderableChildRenderProps & { item: T }) => React.ReactNode;
    onDragEnd?: (newArray: T[], id: string) => void;
}
export const ReorderableTableBody = <T extends { id: string }>({ items: propItems, itemType, children, onDragEnd }: ReorderableTableBodyProps<T>) => {

    return (
        <DndProvider backend={HTML5Backend}>
            <ReorderContainer items={propItems} itemType={itemType}>
                {({ items, wrapperRef, findItem, moveItem }) => (
                    <tbody ref={wrapperRef}>
                        {items.map((item) => (
                            <Reorderable
                                key={item.id}
                                item={item}
                                itemType={itemType}
                                findItem={findItem}
                                moveItem={moveItem}
                                onDragEnd={onDragEnd ? (id) => onDragEnd(items, id) : undefined}
                            >
                                {(props) => children({ ...props, item })}
                            </Reorderable>
                        ))}
                    </tbody>
                )}
            </ReorderContainer>
        </DndProvider>
    );
}