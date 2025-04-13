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
import { toast } from "react-toastify";
import { UniformTypeOffcanvas } from "./UniformTypeOffcanvas";

const listElementStyles = {
    padding: "10px",
    margin: "0px",
}
export const UniformTypeTable = (props: { initialTypeList: UniformType[] }) => {
    const t = useI18n();

    const { typeList, mutate } = useUniformTypeList(props.initialTypeList);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [editable, setEditable] = useState(false);

    const handleChangeSortorder = async (newArray: UniformType[], itemId: string) => {
        if (newArray.length !== typeList?.length) return;

        const newPosition = newArray.findIndex(i => i.id === itemId);
        if (newPosition === -1) return;

        await mutate(
            changeUniformTypeSortOrder({ typeId: itemId, newPosition }),
            {
                optimisticData: newArray
            }
        ).then(() => {
            toast.success(t('common.success.changeSortorder'));
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.actions.changeSortorder'));
        });
    }

    return (
        <div>
            <Table striped aria-label={t('common.uniform.type.type', { count: 2 })}>
                <thead>
                    <tr>
                        <th></th>
                        <th>{t('common.uniform.type.type', { count: 1 })}</th>
                        <th>{t('common.uniform.type.acronym')}</th>
                        <th className="d-none d-md-table-cell">{t('common.uniform.type.issuedDefault')}</th>
                        <th className="d-none d-sm-table-cell">{t('common.uniform.type.usingSizes')}</th>
                        <th className="d-none d-sm-table-cell">{t('common.uniform.type.usingGenerations')}</th>
                        <th className="d-none d-lg-table-cell">{t('common.uniform.type.defaultSizelist')}</th>
                        <th className="d-none d-lg-table-cell">{t('common.uniform.generation.label', { count: 2 })}</th>
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
                        <tr key={item.id} ref={previewRef} aria-label={item.name} style={isDragging ? { ...listElementStyles, opacity: 0 } : listElementStyles}>
                            <td>
                                <span ref={draggableRef} aria-label="move Item" className="p-2">
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
                            <td className="d-none d-sm-table-cell">{item.usingSizes ? t('common.yes') : t('common.no')}</td>
                            <td className="d-none d-sm-table-cell">{item.usingGenerations ? t('common.yes') : t('common.no')}</td>
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
        </div>
    );
}
