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

type UniformGenerationTableProps = {
    uniformType: UniformType;
}

export const UniformGenerationTable = ({ uniformType }: UniformGenerationTableProps) => {
    console.log("🚀 ~ UniformGenerationTable ~ uniformType:", uniformType)
    const { mutate } = useUniformTypeList();
    const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);

    const handleChangeSortorder = (newArray: UniformGeneration[], itemId: string) => {
        const newPosition = newArray.findIndex(i => i.id === itemId);
        console.log(newArray, itemId, newPosition);
        mutate(changeUniformGenerationSortOrder({ id: itemId, newPosition }));
    };

    return (
        <div>
            <h3 className="text-center">Generationen</h3>
            <hr className="my-0" />
            <Row>
                <Table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Generation</th>
                            <th className={uniformType.usingSizes ? "d-none d-sm-table-cell" : ""}>Veraltet</th>
                            {uniformType.usingSizes && (
                                <th>Größenliste</th>
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
                                >
                                    <td className={invalid ? "text-danger" : ""}>
                                        <span ref={draggableRef} className="p-2">
                                            <FontAwesomeIcon
                                                icon={faBars}
                                                className="text-seccondary"
                                            />
                                        </span>
                                    </td>
                                    <td className={invalid ? "text-danger" : ""}>{item.name}</td>
                                    <td className={invalid ? "text-danger" : "" + uniformType.usingSizes ? "d-none d-sm-table-cell" : ""}>
                                        {item.outdated ? "Ja" : "Nein"}
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