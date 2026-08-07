"use client";

import { CheckboxFormField } from "@/components/fields/CheckboxFormField";
import { FormContext } from "@/components/fields/Form";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { createReturnProcess } from "@/dal/cadet/returnProcess";
import { returnCadetDirectly } from "@/dal/cadet";
import { useCadetMaterialMap, useCadetUniformDescriptList } from "@/dataFetcher/cadet";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { CadetMaterial } from "@/types/globalMaterialTypes";
import { UniformLabel } from "@/types/globalUniformTypes";
import { ReturnProcessModalFormType, returnProcessModalFormSchema } from "@/zod/returnProcess";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Dropdown, Modal, Spinner, SplitButton } from "react-bootstrap";
import { FormProvider, Path, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { ReturnProcessTemplateWithItems } from "@/types/returnProcessTypes";

type Props = {
    cadetId: string;
    returnProcessEnabled: boolean;
    templates: ReturnProcessTemplateWithItems[];
    onClose: () => void;
};

/**
 * Outer wrapper that waits for async uniform/material data to load before rendering the form.
 *
 * @param props - Cadet id, return-process configuration and modal close callback.
 * @returns The return-uniform modal or a loading modal while dependent data is fetched.
 */
export default function CadetReturnUniformModal(props: Props) {
    const { uniformLabels } = useCadetUniformDescriptList(props.cadetId);
    const { materialMap } = useCadetMaterialMap(props.cadetId);
    const t = useScopedI18n('cadetDetailPage.memberExit.modal');

    if (uniformLabels === undefined || materialMap === undefined) {
        return (
            <Modal show onHide={props.onClose} data-testid="member_exit_modal">
                <Modal.Header closeButton>
                    <Modal.Title>{t("header")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-center p-4">
                        <Spinner animation="border" role="status" />
                    </div>
                </Modal.Body>
            </Modal>
        );
    }

    const allMaterials = Object.values(materialMap).flat();
    return (
        <CadetReturnUniformModalForm
            {...props}
            uniformLabels={uniformLabels}
            allMaterials={allMaterials}
        />
    );
}

type InnerProps = Props & {
    uniformLabels: UniformLabel[];
    allMaterials: CadetMaterial[];
};

/**
 * Inner form component for the member exit modal.
 * Step 1: Confirm which uniform items and materials were returned.
 * Step 2 (if returnProcessEnabled and templates available): Configure the exit process.
 */
function CadetReturnUniformModalForm({
    cadetId,
    returnProcessEnabled,
    templates,
    onClose,
    uniformLabels,
    allMaterials,
}: InnerProps) {
    const t = useScopedI18n('cadetDetailPage.memberExit.modal');
    const tGlobal = useI18n();
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showProcessStep = returnProcessEnabled && templates.length > 0;

    const defaultTemplate = useMemo(
        () => templates.find((tmpl) => tmpl.defaultProcess) ?? templates[0],
        [templates]
    );
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplate?.id ?? "");
    const selectedTemplate = useMemo(
        () => templates.find((tmpl) => tmpl.id === selectedTemplateId) ?? defaultTemplate,
        [templates, selectedTemplateId, defaultTemplate]
    );
    const sortedItems = useMemo(
        () => [...(selectedTemplate?.checklistItems ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
        [selectedTemplate]
    );

    const initialUniformItems = useMemo(
        () => Object.fromEntries(uniformLabels.map((l) => [l.id, true])),
        [uniformLabels]
    );
    const initialMaterialItems = useMemo(
        () => Object.fromEntries(allMaterials.map((m) => [m.id, true])),
        [allMaterials]
    );

    const form = useForm<ReturnProcessModalFormType>({
        resolver: zodResolver(returnProcessModalFormSchema),
        defaultValues: {
            templateId: defaultTemplate?.id ?? "",
            items: {},
            uniformItems: initialUniformItems,
            materialItems: initialMaterialItems,
            notes: "",
        },
    });

    const watchedItems = useWatch({ control: form.control, name: "items" });
    const allChecklistItemsChecked = useMemo(
        () => sortedItems.length > 0 && sortedItems.every((item) => watchedItems?.[item.id] === true),
        [sortedItems, watchedItems]
    );

    async function submitProcess(data: ReturnProcessModalFormType, finished: boolean) {
        if (!selectedTemplate) return;
        setIsSubmitting(true);
        try {
            const preCheckedItemIds = sortedItems
                .filter((item) => data.items[item.id])
                .map((item) => item.id);
            const selectedUniformIds = Object.entries(data.uniformItems)
                .filter(([, checked]) => checked)
                .map(([id]) => id);
            const selectedMaterialIds = Object.entries(data.materialItems)
                .filter(([, checked]) => checked)
                .map(([id]) => id);
            await createReturnProcess({
                cadetId,
                returnProcessTemplateId: selectedTemplate.id,
                preCheckedItemIds,
                inspectorComment: data.notes || undefined,
                finished,
                selectedUniformIds,
                selectedMaterialIds,
            });
            toast.success(
                finished
                    ? t("successFinished")
                    : t("success")
            );
            onClose();
            router.refresh();
        } catch {
            toast.error(t("error"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function submitDirect() {
        setIsSubmitting(true);
        try {
            const uniformItemsValues = form.getValues('uniformItems');
            const materialItemsValues = form.getValues('materialItems');
            const selectedUniformIds = Object.entries(uniformItemsValues)
                .filter(([, checked]) => checked)
                .map(([id]) => id);
            const selectedMaterialIds = Object.entries(materialItemsValues)
                .filter(([, checked]) => checked)
                .map(([id]) => id);
            await returnCadetDirectly({ cadetId, selectedUniformIds, selectedMaterialIds });
            toast.success(t("successDirect"));
            onClose();
            router.refresh();
        } catch {
            toast.error(t("error"));
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleStartProcess() {
        form.handleSubmit((data) => submitProcess(data, false))();
    }

    function handleSaveFinished() {
        form.handleSubmit((data) => submitProcess(data, true))();
    }

    function handleDirectSave() {
        void submitDirect();
    }

    return (
        <FormProvider {...form}>
            <FormContext.Provider value={{ disabled: isSubmitting, plaintext: false, formName: "member-exit-form" }}>
                <Modal show onHide={onClose} data-testid="member_exit_modal">
                    <Modal.Header closeButton>
                        <Modal.Title>{t("header")}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {step === 1 && (
                            <div>
                                <h2 className="fs-5 fw-bold text-center mb-3">
                                    {t("step1.header")}
                                </h2>
                                {uniformLabels.length > 0 && (
                                    <>
                                        <h3 className="fs-6 fw-bold text-start">
                                            {t("step1.uniformItems")}
                                        </h3>
                                        <div className="d-flex flex-row flex-wrap mt-2">
                                            {uniformLabels.map((label) => (
                                                <CheckboxFormField<ReturnProcessModalFormType>
                                                    key={label.id}
                                                    name={`uniformItems.${label.id}` as Path<ReturnProcessModalFormType>}
                                                    label={label.description}
                                                    className="me-3"
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                                {allMaterials.length > 0 && (
                                    <>
                                        <h3 className="fs-6 fw-bold text-start mt-3">
                                            {t("step1.materialItems")}
                                        </h3>
                                        <div className="d-flex flex-row flex-wrap mt-2">
                                            {allMaterials.map((material) => (
                                                <CheckboxFormField<ReturnProcessModalFormType>
                                                    key={material.id}
                                                    name={`materialItems.${material.id}` as Path<ReturnProcessModalFormType>}
                                                    label={`${material.issued}x ${material.groupName} (${material.typename})`}
                                                    className="me-3"
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        {step === 2 && showProcessStep && (
                            <div>
                                <h2 className="fs-5 fw-bold text-center mb-3">
                                    {t("step2.header")}
                                </h2>
                                {templates.length > 1 && (
                                    <div className="d-flex justify-content-center mb-3">
                                        <SelectFormField<ReturnProcessModalFormType>
                                            name="templateId"
                                            label={t("step2.templateLabel")}
                                            labelClassName="visually-hidden"
                                            options={templates.map((tmpl) => ({ value: tmpl.id, label: tmpl.name }))}
                                            onValueChange={(value) => setSelectedTemplateId(value as string)}
                                            selectClassName="fw-bold"
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
                                <div className="mt-3">
                                    <TextareaFormField<ReturnProcessModalFormType>
                                        name="notes"
                                        label={t("step2.notesLabel")}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        {step === 1 && (
                            <>
                                <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                                    {tGlobal("common.actions.cancel")}
                                </Button>
                                {showProcessStep ? (
                                    <Button
                                        variant="primary"
                                        onClick={() => setStep(2)}
                                        disabled={isSubmitting}
                                    >
                                        {t("actions.next")}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        onClick={handleDirectSave}
                                        disabled={isSubmitting}
                                    >
                                        {t("actions.save")}
                                    </Button>
                                )}
                            </>
                        )}
                        {step === 2 && showProcessStep && (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={isSubmitting}
                                >
                                    {t("actions.back")}
                                </Button>
                                {allChecklistItemsChecked ? (
                                    <SplitButton
                                        variant="primary"
                                        title={t("actions.saveFinished")}
                                        onClick={handleSaveFinished}
                                        disabled={isSubmitting}
                                        id="member-exit-split-btn"
                                    >
                                        <Dropdown.Item onClick={handleStartProcess} disabled={isSubmitting}>
                                            {t("actions.startProcess")}
                                        </Dropdown.Item>
                                    </SplitButton>
                                ) : (
                                    <SplitButton
                                        variant="primary"
                                        title={t("actions.startProcess")}
                                        onClick={handleStartProcess}
                                        disabled={isSubmitting}
                                        id="member-exit-split-btn"
                                    >
                                        <Dropdown.Item onClick={handleSaveFinished} disabled={isSubmitting}>
                                            {t("actions.saveFinished")}
                                        </Dropdown.Item>
                                    </SplitButton>
                                )}
                            </>
                        )}
                    </Modal.Footer>
                </Modal>
            </FormContext.Provider>
        </FormProvider>
    );
}
