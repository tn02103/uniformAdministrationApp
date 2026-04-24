"use client";
import { createReturnProcess } from "@/dal/cadet/returnProcess";
import { FormContext } from "@/components/fields/Form";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { CheckboxFormField } from "@/components/fields/CheckboxFormField";
import { useI18n } from "@/lib/locales/client";
import { ReturnChecklistTemplate, ReturnProcessTemplate } from "@/prisma/browser";
import { ReturnProcessModalFormType } from "@/zod/returnProcess";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormProvider, Path, useForm } from "react-hook-form";
import { Button, Modal } from "react-bootstrap";
import { toast } from "react-toastify";

type TemplateWithItems = ReturnProcessTemplate & { checklistItems: ReturnChecklistTemplate[] };

type Props = {
    cadetId: string;
    templates: TemplateWithItems[];
    onClose: () => void;
};

export default function CadetReturnUniformModal({ cadetId, templates, onClose }: Props) {
    const t = useI18n();
    const router = useRouter();

    const defaultTemplate = useMemo(
        () => templates.find((tmpl) => tmpl.defaultProcess) ?? templates[0],
        [templates]
    );

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplate?.id ?? "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ReturnProcessModalFormType>({
        defaultValues: { templateId: defaultTemplate?.id ?? "", items: {} },
    });

    const formContextValue = useMemo(
        () => ({ disabled: isSubmitting, plaintext: false, formName: "returnProcessModal" }),
        [isSubmitting]
    );

    const selectedTemplate = useMemo(
        () => templates.find((tmpl) => tmpl.id === selectedTemplateId) ?? defaultTemplate,
        [templates, selectedTemplateId, defaultTemplate]
    );

    const sortedItems = useMemo(
        () => [...(selectedTemplate?.checklistItems ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
        [selectedTemplate]
    );

    async function handleSubmit(data: ReturnProcessModalFormType) {
        if (!selectedTemplate) return;
        setIsSubmitting(true);
        try {
            const preCheckedItemIds = sortedItems
                .filter((item) => data.items[item.id])
                .map((item) => item.id);
            await createReturnProcess({
                cadetId,
                returnProcessTemplateId: selectedTemplate.id,
                preCheckedItemIds,
            });
            toast.success(t("cadetDetailPage.returnProcess.modal.success"));
            onClose();
            router.refresh();
        } catch {
            toast.error(t("cadetDetailPage.returnProcess.modal.error"));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <FormContext.Provider value={formContextValue}>
            <FormProvider {...form}>
                <Modal show onHide={onClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {t("cadetDetailPage.returnProcess.modal.header")}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {templates.length > 1 && (
                            <div className="d-flex justify-content-center mb-3">
                                <SelectFormField<ReturnProcessModalFormType>
                                    name="templateId"
                                    label={t("cadetDetailPage.returnProcess.modal.templateLabel")}
                                    labelClassName="visually-hidden"
                                    options={templates.map((tmpl) => ({ value: tmpl.id, label: tmpl.name }))}
                                    onValueChange={(value) => setSelectedTemplateId(value as string)}
                                />
                            </div>
                        )}
                        {sortedItems.map((item) => (
                            <CheckboxFormField<ReturnProcessModalFormType>
                                key={item.id}
                                name={`items.${item.id}` as Path<ReturnProcessModalFormType>}
                                label={item.label}
                            />
                        ))}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                            {t("common.actions.cancel")}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={form.handleSubmit(handleSubmit)}
                            disabled={isSubmitting}
                        >
                            {t("cadetDetailPage.returnProcess.modal.startButton")}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </FormProvider>
        </FormContext.Provider>
    );
}
