"use client";

import { Table as BootstrapTable } from "react-bootstrap";
import { Get, Paths } from "type-fest";
import { ActionButton, ActionButtonVariants } from "../Buttons/ActionButton";

type TableDataKeys<T extends object> = Extract<Paths<T>, string>;
type TableDataValue<T extends object, K extends TableDataKeys<T>> = Get<T, K>;

type TableColumn<T extends object, K extends TableDataKeys<T>> = {
    key: K;
    label: string;
    render?: (value: TableDataValue<T, K>, row: T) => React.ReactNode;
};

type TableColumns<T extends object> = {
    [K in TableDataKeys<T>]: TableColumn<T, K>
}[TableDataKeys<T>];

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

type RowAction<T extends object> = {
    actionKey: ActionButtonVariants;
    onClick: (row: T) => void;
    label: string;
};

export const Table = <T extends object>({
    children,
    data,
    columns,
    rowActions = [],
}: {
    children?: React.ReactNode;
    data: T[];
    columns?: TableColumns<T>[];
    rowActions?: RowAction<T>[];
}) => {

    return (
        <BootstrapTable striped bordered hover responsive className="mt-3">
            <thead className="topoffset-nav sticky-top bg-white">
                <tr>
                    {columns?.map((column) => (
                        <th key={String(column.key)}>{column.label}</th>
                    ))}
                    {rowActions.length > 0 && <th></th>}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {columns?.map((column) => {
                            const value = getValueByPath(row, column.key);
                            const renderedValue = column.render
                                ? (column.render as (value: unknown, row: T) => React.ReactNode)(value, row)
                                : String(value);

                            return <td key={String(column.key)} className="border-end-0 border-start-0 ">{renderedValue}</td>;
                        })}
                        {rowActions.length > 0 && (
                            <td className="text-end border-start-0">
                               {rowActions.map((action) => (
                                    <ActionButton
                                        key={action.actionKey}
                                        variantKey={action.actionKey}
                                        onClick={() => action.onClick(row)}
                                        aria-label={action.label}
                                    />
                                ))}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
            {children}
        </BootstrapTable>
    )
}