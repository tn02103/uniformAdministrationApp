import { ReorderableTableBody } from "@/components/reorderDnD/ReorderableTableBody";
import { changeUniformGenerationSortOrder } from "@/dal/uniform/generation/_index";
import { useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { UniformType, UniformGeneration } from "@/types/globalUniformTypes";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Row, Table, Dropdown } from "react-bootstrap";
import { UniformgenerationOffcanvas } from "./UniformGenerationOffcanvas";
import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { useI18n } from "@/lib/locales/client";
import { toast } from "react-toastify";

type UniformGenerationTableProps = {
    uniformType: UniformType;
}

export const UniformGenerationTable = ({ uniformType }: UniformGenerationTableProps) => {
    const { mutate } = useUniformTypeList();
    const t = useI18n();
    const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);

    const handleChangeSortorder = async (newArray: UniformGeneration[], itemId: string) => {
        if (newArray.length !== uniformType.uniformGenerationList?.length) return;
        const newPosition = newArray.findIndex(i => i.id === itemId);
        if (newPosition === -1) return;
        await mutate(
            changeUniformGenerationSortOrder({ id: itemId, newPosition })
        ).then(() => {
            toast.success(t('common.success.changeSortorder'));
        }).catch(() => {
            toast.error(t('common.error.actions.changeSortorder'));
        });
    };

    return (
        <div data-testid="uniform-generation-table">
            <h3 className="text-center">{t('common.uniform.generation.label', { count: 2 })}</h3>
            <hr className="my-0" />
            <Row>
                <Table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>{t('common.uniform.generation.label', { count: 1 })}</th>
                            <th className={uniformType.usingSizes ? "d-none d-sm-table-cell" : ""}>{t('common.uniform.generation.outdated')}</th>
                            {uniformType.usingSizes && (
                                <th>{t('common.uniform.sizelist.label')}</th>
                            )}
                            <th><TooltipActionButton variantKey="create" onClick={() => setSelectedGenerationId('new')} /></th>
                        </tr>
                    </thead>
                    <ReorderableTableBody<UniformGeneration> items={uniformType.uniformGenerationList ?? []} itemType="UNIFORM_GENERATION" onDragEnd={handleChangeSortorder}>
                        {({ draggableRef, previewRef, isDragging, item }) => {
                            const invalid = (uniformType.usingSizes && !item.fk_sizelist)
                            return (
                                <tr
                                    key={item.id}
                                    ref={previewRef}
                                    style={isDragging ? { opacity: 0 } : undefined}
                                    aria-label={item.name}
                                >
                                    <td className={invalid ? "text-danger" : ""}>
                                        <span ref={draggableRef} aria-label="drag item" className="p-2">
                                            <FontAwesomeIcon
                                                icon={faBars}
                                                className="text-seccondary"
                                            />
                                        </span>
                                    </td>
                                    <td className={invalid ? "text-danger" : ""}>{item.name}</td>
                                    <td className={`${invalid ? "text-danger" : ""} ${uniformType.usingSizes ? "d-none d-sm-table-cell" : ""}`}>
                                        {item.outdated ? t('common.yes') : t('common.no')}
                                    </td>
                                    {uniformType.usingSizes && (
                                        <td>{item.sizelist?.name}</td>
                                    )}
                                    <td>
                                        <TooltipActionButton
                                            variantKey="open"
                                            buttonClass={invalid ? "text-danger" : ""}
                                            onClick={() => setSelectedGenerationId(item.id)} />
                                    </td>
                                </tr>
                            );
                        }}
                    </ReorderableTableBody>
                </Table>
            </Row>
            {
                selectedGenerationId &&
                <UniformgenerationOffcanvas
                    uniformTypeId={uniformType.id}
                    usingSizes={uniformType.usingSizes}
                    onHide={() => setSelectedGenerationId(null)}
                    generation={uniformType.uniformGenerationList?.find(g => g.id === selectedGenerationId) ?? null}
                />
            }
        </div >
    )
}