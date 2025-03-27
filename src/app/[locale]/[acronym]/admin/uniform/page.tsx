"use client"

import { TooltipActionButton } from "@/components/TooltipIconButton";
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
    const [disableDnD, setDisableDnD] = useState(false);
    const selectedTypeEditableState = useState(false);

    const handleChangeSortorder = (newArray: UniformType[], itemId: string) => {
        const newPosition = newArray.findIndex(i => i.id === itemId);
        console.log(newArray, itemId, newPosition);
        mutate(
            changeUniformTypeSortOrder({typeId: itemId, newPosition}),
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
                        <th>Anz. Ausgegeben</th>
                        <th>Nutzt Größen</th>
                        <th>Nutzt Generationen</th>
                        <th>Standard Größenliste</th>
                        <th>Anzahl Generationen</th>
                        <th></th>
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
                            <td>{item.issuedDefault}</td>
                            <td>{item.usingSizes ? "Ja" : "Nein"}</td>
                            <td>{item.usingGenerations ? "Ja" : "Nein"}</td>
                            <td>{item.defaultSizelist?.name}</td>
                            <td>{item.uniformGenerationList.length}</td>
                            <td>
                                <TooltipActionButton
                                    variantKey="open"
                                    onClick={() => setSelectedTypeId(item.id)} />
                            </td>
                        </tr>
                    )}
                </ReorderableTableBody>
            </Table>
            {
                selectedTypeId && (
                    <UniformTypeOffcanvas
                        uniformType={typeList?.find(t => t.id === selectedTypeId) ?? null}
                        setSelectedTypeId={setSelectedTypeId}
                    />
                )
            }
        </div >
    )
}

/* <ReorderableList<UniformType> items={typeList ?? []} getKey={item => item.id} disabled={disableDnD} onReorderFinished={handleReorderFinished}>
                        {({ item, props: { onDragStart, draggable, ...props }, dragging }) => {
                            const style = dragging ? { ...listElementStyles, opacity: 0.6 } : listElementStyles;
                            const handleDragStart = (event: React.DragEvent<HTMLSpanElement>) => {
                                // Set the drag image to the entire row
                                const rowElement = event.currentTarget.closest('tr');
                                if (rowElement) {
                                    const clone = rowElement.cloneNode(true) as HTMLElement;

                                    // Copy computed styles from the original row to the clone
                                    const computedStyle = window.getComputedStyle(rowElement);
                                    for (const key of Array.from(computedStyle)) {
                                        clone.style.setProperty(key, computedStyle.getPropertyValue(key));
                                    }

                                    clone.style.position = 'absolute';
                                    clone.style.top = '-9999px';
                                    clone.style.left = '-9999px';
                                    document.body.appendChild(clone);
                                    event.dataTransfer.setDragImage(clone, 0, 0);

                                    // Clean up the cloned element after a short delay
                                    setTimeout(() => {
                                        document.body.removeChild(clone);
                                    }, 0);
                                }

                                // Call the original onDragStart handler
                                if (onDragStart) {
                                    onDragStart(event);
                                }
                            };
                            return (
                                <tr key={item.id} {...props} style={style}>
                                    <td {...props} draggable={undefined} onDragStart={undefined}>
                                        <span draggable onDragStart={handleDragStart}>
                                            {item.name}
                                        </span>
                                    </td>
                                    <td>{item.acronym}</td>
                                    <td>{item.issuedDefault}</td>
                                    <td>{item.usingSizes ? "Ja" : "Nein"}</td>
                                    <td>{item.usingGenerations ? "Ja" : "Nein"}</td>
                                    <td>{item.defaultSizelist?.name}</td>
                                    <td>{item.uniformGenerationList.length}</td>
                                    <td>
                                        <TooltipActionButton
                                            variantKey="open"
                                            onClick={() => setSelectedTypeId(item.id)} />
                                    </td>
                                </tr>
                            );
                        }}
                    </ReorderableList>

 */