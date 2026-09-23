"use client";

import { Table as BootstrapTable } from "react-bootstrap";
import { TableRow } from "./TableRow";
import { TableProps } from "./TableTypes";


export const Table = <T extends object>({
    children,
    data,
    columns,
    rowActions = [],
    mobileActionBreakpoint,
    getRowId,
}: TableProps<T>) => {
    return (
        <div className="overflow-auto">
            <BootstrapTable striped hover >
                <thead className="topoffset-nav sticky-top bg-white">
                    <tr>
                        {columns?.map((column) => (
                            <th key={String(column.key)} className={`${column.visibleBreakpoint ? `d-none d-${column.visibleBreakpoint}-table-cell` : ""}`}>
                                {column.label}
                            </th>
                        ))}
                        {rowActions.length > 0 && <th></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <TableRow
                            key={getRowId(row)}
                            row={row}
                            columns={columns ?? []}
                            rowActions={rowActions}
                            getRowId={getRowId}
                            mobileActionBreakpoint={mobileActionBreakpoint}
                        />
                    ))}
                </tbody>
                {children}
            </BootstrapTable>
        </div>
    )
}