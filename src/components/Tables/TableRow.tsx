
import { Dropdown } from "react-bootstrap";
import { ActionButton } from "../Buttons/ActionButton";
import { TableCol } from "./TableCol";
import { TableRowProps } from "./TableTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export const TableRow = <T extends object>({ row, columns, rowActions, getRowId, mobileActionBreakpoint = "sm" }: TableRowProps<T>) => {

    return (
        <tr key={getRowId(row)} className="hoverCol">
            {columns?.map((column) => <TableCol key={String(column.key)} row={row} column={column} />)}
            {rowActions.length > 0 && (
                <td className="text-end border-start-0">
                    <div className={`hoverColHidden d-none d-${mobileActionBreakpoint}-table-cell`}>
                        {rowActions.map((action) => (
                            <ActionButton
                                key={action.actionKey}
                                variantKey={action.actionKey}
                                onClick={() => action.onClick(row)}
                                aria-label={action.label}
                            />
                        ))}
                    </div>
                    <Dropdown className={`d-${mobileActionBreakpoint}-none`}>
                        <Dropdown.Toggle variant="outline-primary" className="border-0" id={getRowId(row) + "-dropdown"} data-testid={"btn_menu"}>
                            <FontAwesomeIcon icon={faBars} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {rowActions.map((action) => (
                                <Dropdown.Item key={action.actionKey} onClick={() => action.onClick(row)}>
                                    {action.label}
                                </Dropdown.Item>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </td>
            )}
        </tr>
    );
}