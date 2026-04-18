"use client";

import { getCadetInspectionFormData, saveCadetInspection } from "@/dal/inspection";
import { createDeficiency } from "@/dal/inspection/deficiency";
import { useInspectionState, useUnresolvedDeficienciesByCadet } from "@/dataFetcher/inspection";
import { swrKeys } from "@/dataFetcher/swrKeys";
import { useI18n } from "@/lib/locales/client";
import { cadetInspectionFormSchema, CadetInspectionFormSchema, createDeficiencySchema, CreateDeficiencyInput } from "@/zod/deficiency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, Row } from "react-bootstrap";
import { Control, FieldValues } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";
import CadetInspectionCardHeader from "./CadetInspectionCardHeader";
import { CadetInspectionStep1 } from "./CadetInspectionStep1";
import { CadetInspectionStep2 } from "./CadetInspectionStep2";
import { DeficiencyFormFields } from "./DeficiencyFormFields";
import { OldDeficiencyRow } from "./OldDeficiencyRow";


/** Main inspection card for a cadet. Handles both active-inspection flow and standalone deficiency management. */
export const CadetInspectionCard = () => {
    const t = useI18n();
    const form = useForm<CadetInspectionFormSchema>({
        mode: "onTouched",
        resolver: zodResolver(cadetInspectionFormSchema),
    });

    const { cadetId } = useParams<{ cadetId: string }>();
    const [step, setStep] = useState<number>(0);
    const [showCreateCard, setShowCreateCard] = useState(false);

    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);
    const { inspectionState } = useInspectionState();
    const inspectionActive = !!inspectionState?.active;

    const createForm = useForm<CreateDeficiencyInput>({
        resolver: zodResolver(createDeficiencySchema),
        defaultValues: {
            typeId: "",
            comment: "",
            description: "",
            uniformId: null,
            cadetId,
        },
    });

    const handleStartCadetInspection = async () => getCadetInspectionFormData(cadetId).then((data) => {
        form.reset(data);
        if (data.oldDeficiencyList.length > 0) {
            setStep(1);
        } else {
            setStep(2);
        }
    }).catch(() => {
        toast.error(t('cadetDetailPage.inspection.error.startInspection'));
    })

    const handleSaveInspection = async (data: CadetInspectionFormSchema) => {
        data.newDeficiencyList.forEach((def) => {
            if (def.uniformId === "") def.uniformId = null;
            if (def.materialId === "") def.materialId = null;
            if (def.otherMaterialId === "") def.otherMaterialId = null;
            if (def.otherMaterialGroupId === "") def.otherMaterialGroupId = null;
        });

        saveCadetInspection(data).then(() => {
            mutate(
                swrKeys.unresolvedDeficienciesByCadet(cadetId),
                undefined,
                { populateCache: false }
            );
            setStep(0);
            toast.success(t('cadetDetailPage.inspection.message.saved'));
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }

    const handleCreateDeficiency = async (data: CreateDeficiencyInput) => {
        try {
            await createDeficiency(data);
            await mutate(
                swrKeys.unresolvedDeficienciesByCadet(cadetId),
                undefined,
                { populateCache: false }
            );
            createForm.reset({ typeId: "", comment: "", description: "", uniformId: null, cadetId });
            setShowCreateCard(false);
            toast.success(t('cadetDetailPage.inspection.message.deficiencyCreated'));
        } catch {
            toast.error(t('common.error.actions.save'));
        }
    };

    return (
        <div data-testid="div_cadetInspection" className="container border border-2 rounded">
            <CadetInspectionCardHeader
                step={step}
                startInspecting={handleStartCadetInspection}
            />
            <form onSubmit={form.handleSubmit(handleSaveInspection)}>
                <FormProvider {...form}>
                    {step === 0 &&
                        <div className="row p-0 bg-white border-top border-1 border-dark">
                            {unresolvedDeficiencies?.map((deficiency, index) => (
                                <OldDeficiencyRow
                                    key={deficiency.id}
                                    step={step}
                                    deficiency={deficiency}
                                    index={index}
                                    inspectionActive={inspectionActive}
                                />
                            ))}
                            {(unresolvedDeficiencies?.length === 0) &&
                                <div data-testid="div_step0_noDeficiencies" className="fw-bold p-2">{t('cadetDetailPage.inspection.label.noDeficiencies')}</div>
                            }
                            {(step === 0 && !inspectionActive) && (
                                <div className="p-2 border-top border-1 border-dark">
                                    <Button
                                        type="button"
                                        variant="outline-success"
                                        size="sm"
                                        data-testid="btn_new_deficiency"
                                        onClick={() => setShowCreateCard((v) => !v)}
                                    >
                                        {t('cadetDetailPage.inspection.button.newDeficiency')}
                                    </Button>
                                    {showCreateCard && (
                                        <FormProvider {...createForm}>
                                            <div className="border rounded p-2 mt-2 bg-light">
                                                <Row>
                                                    <DeficiencyFormFields
                                                        control={createForm.control as unknown as Control<FieldValues>}
                                                        namePrefix=""
                                                        cadetId={cadetId}
                                                    />
                                                </Row>
                                                <div className="d-flex gap-2 mt-2">
                                                    <Button
                                                        type="button"
                                                        variant="success"
                                                        size="sm"
                                                        data-testid="btn_save_new_deficiency"
                                                        onClick={createForm.handleSubmit(handleCreateDeficiency)}
                                                    >
                                                        {t('common.actions.save')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        data-testid="btn_cancel_new_deficiency"
                                                        onClick={() => setShowCreateCard(false)}
                                                    >
                                                        {t('common.actions.cancel')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </FormProvider>
                                    )}
                                </div>
                            )}
                        </div>
                    }
                    {step === 1 && (
                        <CadetInspectionStep1
                            setNextStep={() => setStep(2)}
                            cancel={() => setStep(0)} />
                    )}
                    {step === 2 && (
                        <CadetInspectionStep2
                            setStep={setStep}
                        />
                    )}
                </FormProvider>
            </form>
        </div>
    )
}