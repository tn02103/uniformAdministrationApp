import dayjs from "dayjs";
import { TableColumns, TableDataKeys, TableDataValue } from "./TableTypes";
import { useMemo } from "react";


function getValueByPath<T extends object, K extends TableDataKeys<T>>(
    row: T,
    path: K,
): TableDataValue<T, K> {
    return String(path)
        .split(".")
        .reduce<unknown>((acc, segment) => {
            if (acc === null || acc === undefined) {
                return undefined;
            }
            return (acc as Record<string, unknown>)[segment];
        }, row) as TableDataValue<T, K>;
}


export const TableCol = <T extends object>({
    row,
    column,
}: {
    row: T;
    column: TableColumns<T>;
}) => {
    const value = getValueByPath(row, column.key);
    const renderedValue = useMemo(() => {
        if (column.render) {
            return (column.render as (value: unknown, row: T) => React.ReactNode)(value, row);
        }
        if (column.dataType === "date" && (value instanceof Date || value instanceof dayjs)) {
            return dayjs(value as Date).format("DD.MM.YYYY");
        }
        if (column.dataType === "datetime" && (value instanceof Date || value instanceof dayjs)) {
            return dayjs(value as Date).format("DD.MM.YYYY HH:mm");
        }
        return String(value);
    }, [value, row, column.render, column.dataType]);

    const visibleBreakpointClass = column.visibleBreakpoint ? `d-none d-${column.visibleBreakpoint}-table-cell` : "";

    return (
        <td key={String(column.key)} className={`border-end-0 border-start-0 ${visibleBreakpointClass}`}>
            {renderedValue}
        </td>
    );
}