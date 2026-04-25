"use client";

import { useModal } from "@/components/modals/modalProvider";
import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import {
    changeReturnChecklistTemplateSortOrder,
    createReturnChecklistTemplate,
    deleteReturnChecklistTemplate,
    updateReturnChecklistTemplate,
} from "@/dal/cadet/returnChecklistTemplate";
import {
    createReturnProcessTemplate,
    deleteReturnProcessTemplate,
    updateReturnProcessTemplate,
} from "@/dal/cadet/returnProcessTemplate";
import { useI18n } from "@/lib/locales/client";
import { ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/client";
import {
    CreateReturnProcessTemplateInput
} from "@/zod/returnProcess";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { TemplateCard } from "./TemplateCard";

type ReturnProcessTemplateWithItems = ReturnProcessTemplate & {
    checklistItems: ReturnChecklistTemplate[];
};

type Props = {
    /** Initial template list fetched server-side. */
    initialTemplates: ReturnProcessTemplateWithItems[];
    /** Whether the return process feature is currently enabled. */
    returnProcessEnabled: boolean;
};

/**
 * Section for managing return process templates and their nested checklist items.
 * State is managed locally; mutations update state from the returned values.
 */
export const ReturnProcessTemplateSection = ({ initialTemplates, returnProcessEnabled: initialReturnProcessEnabled }: Props) => {
    const t = useI18n();
    const modal = useModal();

    const [templates, setTemplates] = useState<ReturnProcessTemplateWithItems[]>(initialTemplates);
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [returnProcessEnabled, setReturnProcessEnabled] = useState(initialReturnProcessEnabled);

    const handleToggleReturnProcess = async (value: boolean) => {
        await updateAssosiationAnonymizationConfig({ returnProcessEnabled: value })
            .then(() => {
                setReturnProcessEnabled(value);
                toast.success(t("admin.settings.anonymization.success"));
            })
            .catch(() => {
                toast.error(t("admin.settings.anonymization.error"));
            });
    };

    const handleDeleteTemplate = (template: ReturnProcessTemplateWithItems) => {
        modal?.simpleWarningModal({
            header: t("admin.settings.returnProcess.delete.header", { name: template.name }),
            message: t("admin.settings.returnProcess.delete.message"),
            primaryOption: t("common.actions.delete"),
            primaryFunction: () => {
                deleteReturnProcessTemplate({ id: template.id })
                    .then((newData) => {
                        setTemplates(newData);
                    })
                    .catch((err: Error) => {
                        if (err.message?.includes("active return processes")) {
                            toast.error(t("admin.settings.returnProcess.delete.activeProcessError"));
                        } else {
                            toast.error(t("admin.settings.returnProcess.delete.error"));
                        }
                    });
            },
        });
    };

    const handleRenameTemplate = async (templateId: string, name: string) => {
        await updateReturnProcessTemplate({ id: templateId, name })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.update.error"));
            });
    };

    const handleToggleDefault = async (template: ReturnProcessTemplateWithItems) => {
        await updateReturnProcessTemplate({ id: template.id, defaultProcess: !template.defaultProcess })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.update.error"));
            });
    };

    const handleCreateTemplate = async (data: CreateReturnProcessTemplateInput) => {
        await createReturnProcessTemplate(data)
            .then((newTemplates) => {
                setTemplates(newTemplates);
                setIsCreating(false);
                toast.success(t("admin.settings.returnProcess.create.success"));
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.create.error"));
            });
    };

    const handleAddChecklistItem = async (templateId: string, label: string) => {
        await createReturnChecklistTemplate({ returnProcessTemplateId: templateId, label })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.checklist.create.error"));
            });
    };

    const handleRenameChecklistItem = async (templateId: string, itemId: string, label: string) => {
        await updateReturnChecklistTemplate({ id: itemId, label })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.checklist.update.error"));
            });
    };

    const handleDeleteChecklistItem = (templateId: string, itemId: string) => {
        deleteReturnChecklistTemplate({ id: itemId })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.checklist.delete.error"));
            });
    };

    const handleChecklistSortOrder = async (
        templateId: string,
        newArray: ReturnChecklistTemplate[],
        itemId: string
    ) => {
        const newPosition = newArray.findIndex((i) => i.id === itemId);
        if (newPosition === -1) return;

        await changeReturnChecklistTemplateSortOrder({ checklistItemId: itemId, newPosition })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.returnProcess.checklist.sortOrder.error"));
            });
    };

    return (
        <div style={{ minWidth: "400px" }}>
            <h2>{t("admin.settings.returnProcess.header")}</h2>
            <hr />
            <div className="form-check form-switch mb-3">
                <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="returnProcessEnabledToggle"
                    checked={returnProcessEnabled}
                    onChange={(e) => handleToggleReturnProcess(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="returnProcessEnabledToggle">
                    {t("admin.settings.anonymization.returnProcessEnabled")}
                </label>
            </div>
            {templates.length === 0 && !isCreating && (
                <p className="text-muted">{t("admin.settings.returnProcess.noTemplates")}</p>
            )}
            <div>
                {templates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        disabled={!returnProcessEnabled}
                        isExpanded={expandedTemplateId === template.id}
                        onToggleExpand={() =>
                            setExpandedTemplateId(
                                expandedTemplateId === template.id ? null : template.id
                            )
                        }
                        onRename={handleRenameTemplate}
                        onDelete={handleDeleteTemplate}
                        onToggleDefault={handleToggleDefault}
                        onAddChecklistItem={handleAddChecklistItem}
                        onRenameChecklistItem={handleRenameChecklistItem}
                        onDeleteChecklistItem={handleDeleteChecklistItem}
                        onChecklistSortOrder={handleChecklistSortOrder}
                    />
                ))}
            </div>
            {isCreating ? (
                <CreateTemplateForm
                    onSave={handleCreateTemplate}
                    onCancel={() => setIsCreating(false)}
                />
            ) : (
                <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    className="mt-2"
                    onClick={() => setIsCreating(true)}
                >
                    <FontAwesomeIcon icon={faPlus} className="me-1" />
                    {t("admin.settings.returnProcess.addTemplate")}
                </Button>
            )}
        </div>
    );
};
