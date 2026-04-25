import { ActionButton } from "@/components/Buttons/ActionButton";
import { InlineEditInputFormField } from "@/components/fields/InlineEditInputFormField";
import { ReorderableTableBody } from "@/components/reorderDnD/ReorderableTableBody";
import { useI18n } from "@/lib/locales/client";
import { ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/client";
import { returnProcessTemplateNameSchema } from "@/zod/returnProcess";
import { faBars, faChevronDown, faChevronRight, faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button, Table } from "react-bootstrap";
import { AddChecklistItemForm } from "./AddChecklistItemForm";


type ReturnProcessTemplateWithItems = ReturnProcessTemplate & {
    checklistItems: ReturnChecklistTemplate[];
};

type TemplateCardProps = {
    template: ReturnProcessTemplateWithItems;
    isExpanded: boolean;
    /** When true the card is grayed out, non-interactive and cannot be expanded. */
    disabled?: boolean;
    onToggleExpand: () => void;
    onRename: (templateId: string, name: string) => Promise<void>;
    onDelete: (template: ReturnProcessTemplateWithItems) => void;
    onToggleDefault: (template: ReturnProcessTemplateWithItems) => Promise<void>;
    onAddChecklistItem: (templateId: string, label: string) => Promise<void>;
    onRenameChecklistItem: (templateId: string, itemId: string, label: string) => Promise<void>;
    onDeleteChecklistItem: (templateId: string, itemId: string) => void;
    onChecklistSortOrder: (
        newArray: ReturnChecklistTemplate[],
        itemId: string
    ) => Promise<void>;
};

/** A single return process template card with expand/collapse and checklist management. */
export const TemplateCard = ({
    template,
    isExpanded,
    disabled = false,
    onToggleExpand,
    onRename,
    onDelete,
    onToggleDefault,
    onAddChecklistItem,
    onRenameChecklistItem,
    onDeleteChecklistItem,
    onChecklistSortOrder,
}: TemplateCardProps) => {
    const t = useI18n();
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState<string>("");

    return (
        <div
            className={`card mb-2${disabled ? " opacity-50" : ""}`}
            data-testid={`div_returnprocess_${template.id}`}
        >
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <button
                    type="button"
                    className="btn btn-sm btn-link p-0 text-dark"
                    onClick={disabled ? undefined : onToggleExpand}
                    disabled={disabled}
                    aria-expanded={!disabled && isExpanded}
                    aria-label={template.name}
                >
                    <FontAwesomeIcon icon={isExpanded && !disabled ? faChevronDown : faChevronRight} fixedWidth />
                </button>
                <div className="flex-grow-1">
                    <InlineEditInputFormField
                        name="name"
                        value={template.name}
                        ariaLabel={t("admin.settings.returnProcess.templateName")}
                        onSave={(name) => { onRename(template.id, name); }}
                        zodSchema={returnProcessTemplateNameSchema}
                        disabled={disabled}
                    />
                </div>
                {template.defaultProcess && (
                    <span className="badge bg-warning rounded-pill text-dark" aria-label={t("admin.settings.returnProcess.defaultProcess")}>
                        {t("admin.settings.returnProcess.defaultProcess")}
                    </span>
                )}
                {!disabled && (
                    <> 
                        <Button
                            type="button"
                            variant={template.defaultProcess ? "warning" : "outline-warning"}
                            size="sm"
                            title={t("admin.settings.returnProcess.defaultProcess")}
                            onClick={() => onToggleDefault(template)}
                            aria-label={t("admin.settings.returnProcess.defaultProcess")}
                            className="border-0"
                        >
                            <FontAwesomeIcon icon={faStar} size="sm" />
                        </Button>
                        <ActionButton
                            variantKey="delete"
                            onClick={() => onDelete(template)}
                        />
                    </>
                )}
            </div>

            {isExpanded && !disabled && (
                <div className="card-body p-2">
                    <Table size="sm" className="mb-0" aria-label={template.name}>
                        {template.checklistItems.length === 0 && (
                            <tbody>
                                <tr>
                                    <td colSpan={3} className="text-muted fst-italic">
                                        {t("admin.settings.returnProcess.noChecklistItems")}
                                    </td>
                                </tr>
                            </tbody>
                        )}
                        <ReorderableTableBody<ReturnChecklistTemplate>
                            items={template.checklistItems}
                            itemType="RETURN_CHECKLIST_TEMPLATE"
                            onDragEnd={(newArray, itemId) =>
                                onChecklistSortOrder(newArray, itemId)
                            }
                        >
                            {({ item, draggableRef, previewRef, isDragging }) => (
                                editingItemId === item.id ? (
                                    <tr key={item.id} ref={previewRef} data-testid={`tr_checklistItem_${item.id}`}>
                                        <td style={{ width: "2rem" }} />
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editingLabel}
                                                autoFocus
                                                aria-label={t("admin.settings.returnProcess.checklistItemLabel")}
                                                onChange={(e) => setEditingLabel(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        onRenameChecklistItem(template.id, item.id, editingLabel)
                                                            .then(() => setEditingItemId(null));
                                                    }
                                                    if (e.key === "Escape") setEditingItemId(null);
                                                }}
                                            />
                                        </td>
                                        <td className="text-end" style={{ width: "5rem" }}>
                                            <ActionButton
                                                variantKey="save"
                                                onClick={() =>
                                                    onRenameChecklistItem(template.id, item.id, editingLabel)
                                                        .then(() => setEditingItemId(null))
                                                }
                                            />
                                            <ActionButton
                                                variantKey="cancel"
                                                onClick={() => setEditingItemId(null)}
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr
                                        key={item.id}
                                        ref={previewRef}
                                        style={{ opacity: isDragging ? 0.4 : 1 }}
                                        className="hoverCol"
                                        data-testid={`tr_checklistItem_${item.id}`}
                                    >
                                        <td style={{ width: "2rem" }}>
                                            <span ref={draggableRef} role="button" style={{ cursor: "grab" }} aria-label={t("common.actions.changePosition")}>
                                                <FontAwesomeIcon icon={faBars} className="text-secondary" />
                                            </span>
                                        </td>
                                        <td>{item.label}</td>
                                        <td className="text-end">
                                            <div className="hoverColHidden">
                                                <ActionButton
                                                    variantKey="edit"
                                                    disabled={editingItemId !== null}
                                                    onClick={() => { setEditingItemId(item.id); setEditingLabel(item.label); }}
                                                />
                                                <ActionButton
                                                    variantKey="delete"
                                                    onClick={() => onDeleteChecklistItem(template.id, item.id)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                        </ReorderableTableBody>
                    </Table>
                    <div>
                        <AddChecklistItemForm
                            templateId={template.id}
                            onSave={onAddChecklistItem}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
