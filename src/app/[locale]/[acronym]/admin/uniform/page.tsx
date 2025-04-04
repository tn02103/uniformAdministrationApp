"use client"

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { ReorderableTableBody } from "@/components/reorderDnD/ReorderableTableBody";
import { changeUniformTypeSortOrder } from "@/dal/uniform/type/_index";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { UniformType } from "@/types/globalUniformTypes";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Table } from "react-bootstrap";
import { UniformTypeOffcanvas } from "./_typeOffcanvas/UniformTypeOffcanvas";

const listElementStyles = {
    padding: "10px",
    margin: "0px",
}

export default function UniformAdminPage() {
    const t = useI18n();

    const { typeList, mutate } = useUniformTypeList();
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [editable, setEditable] = useState(false);

    const handleChangeSortorder = (newArray: UniformType[], itemId: string) => {
        const newPosition = newArray.findIndex(i => i.id === itemId);
        console.log(newArray, itemId, newPosition);
        mutate(
            changeUniformTypeSortOrder({ typeId: itemId, newPosition }),
            {
                optimisticData: newArray
            }
        );
    }

    return (
        <div className="container-xl content-center bg-light rounded">
            <h1 className="text-center">
                {t('admin.uniform.header')}
            </h1>
            <Table striped>
                <thead>
                    <tr>
                        <th></th>
                        <th>Uniformtyp</th>
                        <th>Kürzel</th>
                        <th className="d-none d-md-table-cell">Anz. Ausgegeben</th>
                        <th className="d-none d-sm-table-cell">Nutzt Größen</th>
                        <th className="d-none d-sm-table-cell">Nutzt Generationen</th>
                        <th className="d-none d-lg-table-cell">Standard Größenliste</th>
                        <th className="d-none d-lg-table-cell">Generationen</th>
                        <th>
                            <TooltipActionButton
                                variantKey="create"
                                disabled={editable}
                                onClick={() => { setSelectedTypeId('new'); setEditable(true); }} />
                        </th>
                    </tr>
                </thead>
                <ReorderableTableBody<UniformType>
                    items={typeList ?? []}
                    itemType="UNIFORM_TYPE"
                    onDragEnd={handleChangeSortorder}
                >
                    {({ draggableRef, previewRef, isDragging, item }) => (
                        <tr key={item.id} ref={previewRef} style={isDragging ? { ...listElementStyles, opacity: 0 } : listElementStyles}>
                            <td>
                                <span ref={draggableRef} className="p-2">
                                    <FontAwesomeIcon
                                        icon={faBars}
                                        className="text-seccondary"
                                    />
                                </span>
                            </td>
                            <td>
                                {item.name}
                            </td>
                            <td>{item.acronym}</td>
                            <td className="d-none d-md-table-cell">{item.issuedDefault}</td>
                            <td className="d-none d-sm-table-cell">{item.usingSizes ? "Ja" : "Nein"}</td>
                            <td className="d-none d-sm-table-cell">{item.usingGenerations ? "Ja" : "Nein"}</td>
                            <td className="d-none d-lg-table-cell">{item.defaultSizelist?.name}</td>
                            <td className="d-none d-lg-table-cell">{item.uniformGenerationList.length}</td>
                            <td>
                                <TooltipActionButton
                                    variantKey="open"
                                    disabled={editable}
                                    onClick={() => setSelectedTypeId(item.id)} />
                            </td>
                        </tr>
                    )}
                </ReorderableTableBody>
            </Table>
            {
                selectedTypeId && (
                    <UniformTypeOffcanvas
                        editable={editable}
                        setEditable={setEditable}
                        uniformType={typeList?.find(t => t.id === selectedTypeId) ?? null}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                )
            }
        </div >
    )
}
