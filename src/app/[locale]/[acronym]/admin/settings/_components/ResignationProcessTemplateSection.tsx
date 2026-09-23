"use client";

import { useModal } from "@/components/modals/modalProvider";
import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import {
    changeResignationChecklistItemTemplateSortOrder,
    createResignationChecklistItemTemplate,
    deleteResignationChecklistItemTemplate,
    updateResignationChecklistItemTemplate,
} from "@/dal/cadet/resignation/checklistTemplate";
import {
    createResignationProcessTemplate,
    deleteResignationProcessTemplate,
    updateResignationProcessTemplate,
} from "@/dal/cadet/resignation/processTemplate";
import { useI18n } from "@/lib/locales/client";
import { ResignationChecklistItemTemplate, ResignationProcessTemplateWithItems } from "@/types/resignationProcessTypes";
import {
    CreateResignationProcessTemplateInput
} from "@/zod/resignationProcess";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { TemplateCard } from "./TemplateCard";

type Props = {
    /** Initial template list fetched server-side. */
    initialTemplates: ResignationProcessTemplateWithItems[];
    /** Whether the return process feature is currently enabled. */
    resignationProcessEnabled: boolean;
};

/**
 * Section for managing return process templates and their nested checklist items.
 * State is managed locally; mutations update state from the returned values.
 */
export const ResignationProcessTemplateSection = ({ initialTemplates, resignationProcessEnabled: initialResignationProcessEnabled }: Props) => {
    const t = useI18n();
    const modal = useModal();

    const [templates, setTemplates] = useState<ResignationProcessTemplateWithItems[]>(initialTemplates);
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [resignationProcessEnabled, setResignationProcessEnabled] = useState(initialResignationProcessEnabled);

    const handleToggleResignationProcess = async (value: boolean) => {
        await updateAssosiationAnonymizationConfig({ resignationProcessEnabled: value })
            .then(() => {
                setResignationProcessEnabled(value);
                toast.success(t("admin.settings.anonymization.success"));
            })
            .catch(() => {
                toast.error(t("admin.settings.anonymization.error"));
            });
    };

    const handleDeleteTemplate = (template: ResignationProcessTemplateWithItems) => {
        modal?.simpleWarningModal({
            header: t("admin.settings.resignationProcess.delete.header", { name: template.name }),
            message: t("admin.settings.resignationProcess.delete.message"),
            primaryOption: t("common.actions.delete"),
            primaryFunction: () => {
                deleteResignationProcessTemplate({ id: template.id })
                    .then((newData) => {
                        setTemplates(newData);
                    })
                    .catch((err: Error) => {
                        if (err.message?.includes("active return processes")) {
                            toast.error(t("admin.settings.resignationProcess.delete.activeProcessError"));
                        } else {
                            toast.error(t("admin.settings.resignationProcess.delete.error"));
                        }
                    });
            },
        });
    };

    const handleRenameTemplate = async (templateId: string, name: string) => {
        await updateResignationProcessTemplate({ id: templateId, name })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.update.error"));
            });
    };

    const handleToggleDefault = async (template: ResignationProcessTemplateWithItems) => {
        await updateResignationProcessTemplate({ id: template.id, defaultProcess: !template.defaultProcess })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.update.error"));
            });
    };

    const handleCreateTemplate = async (data: CreateResignationProcessTemplateInput) => {
        await createResignationProcessTemplate(data)
            .then((newTemplates) => {
                setTemplates(newTemplates);
                setIsCreating(false);
                toast.success(t("admin.settings.resignationProcess.create.success"));
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.create.error"));
            });
    };

    const handleAddChecklistItem = async (templateId: string, label: string) => {
        await createResignationChecklistItemTemplate({ resignationProcessTemplateId: templateId, label })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.checklist.create.error"));
            });
    };

    const handleRenameChecklistItem = async (itemId: string, label: string) => {
        await updateResignationChecklistItemTemplate({ id: itemId, label })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.checklist.update.error"));
            });
    };

    const handleDeleteChecklistItem = (itemId: string) => {
        deleteResignationChecklistItemTemplate({ id: itemId })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.checklist.delete.error"));
            });
    };

    const handleChecklistSortOrder = async (
        newArray: ResignationChecklistItemTemplate[],
        itemId: string
    ) => {
        const newPosition = newArray.findIndex((i) => i.id === itemId);
        if (newPosition === -1) return;

        await changeResignationChecklistItemTemplateSortOrder({ checklistItemId: itemId, newPosition })
            .then((newData) => {
                setTemplates(newData);
            })
            .catch(() => {
                toast.error(t("admin.settings.resignationProcess.checklist.sortOrder.error"));
            });
    };

    return (
        <div style={{ minWidth: "400px" }}>
            <h2>{t("admin.settings.resignationProcess.header")}</h2>
            <hr />
            <div className="form-check form-switch mb-3">
                <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="resignationProcessEnabledToggle"
                    checked={resignationProcessEnabled}
                    onChange={(e) => handleToggleResignationProcess(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="resignationProcessEnabledToggle">
                    {t("admin.settings.anonymization.resignationProcessEnabled")}
                </label>
            </div>
            {templates.length === 0 && !isCreating && (
                <p className="text-muted">{t("admin.settings.resignationProcess.noTemplates")}</p>
            )}
            <div>
                {templates.map((template) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        disabled={!resignationProcessEnabled}
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
                    {t("admin.settings.resignationProcess.addTemplate")}
                </Button>
            )}
        </div>
    );
};
