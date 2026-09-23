import { Paths, Get } from "type-fest";
import { ActionButtonVariants } from "../Buttons/ActionButton";

export type TableDataKeys<T extends object> = Extract<Paths<T>, string>;
export type TableDataValue<T extends object, K extends TableDataKeys<T>> = Get<T, K>;

export type TableColumn<T extends object, K extends TableDataKeys<T>> = {
    key: K;
    label: string;
    render?: (value: TableDataValue<T, K>, row: T) => React.ReactNode;
    dataType?: "date" | "datetime";
    visibleBreakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
};

export type TableColumns<T extends object> = {
    [K in TableDataKeys<T>]: TableColumn<T, K>
}[TableDataKeys<T>];

export type RowAction<T extends object> = {
    actionKey: ActionButtonVariants;
    onClick: (row: T) => void;
    label: string;
};

export type TableProps<T extends object> = {
    children?: React.ReactNode;
    data: T[];
    columns?: TableColumns<T>[];
    rowActions?: RowAction<T>[];
    mobileActionBreakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
    getRowId: (row: T) => string;
}
export type TableRowProps<T extends object> = {
    row: T;
    columns: TableColumns<T>[];
    rowActions: RowAction<T>[];
    getRowId: (row: T) => string;
    mobileActionBreakpoint?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
};

