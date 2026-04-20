"use client";

import { Form } from "@/components/fields/Form";
import { getCadetInspectionFormData, saveCadetInspection } from "@/dal/inspection";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useInspectionState, useUnresolvedDeficienciesByCadet } from "@/dataFetcher/inspection";
import { swrKeys } from "@/dataFetcher/swrKeys";
import { useI18n } from "@/lib/locales/client";
import { CadetInspectionFormSchema, getCadetInspectionFormSchema } from "@/zod/deficiency";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { mutate } from "swr";
import CadetInspectionCardHeader from "./CadetInspectionCardHeader";
import { CadetInspectionStep1 } from "./CadetInspectionStep1";
import { CadetInspectionStep2 } from "./CadetInspectionStep2";
import { CreateDeficiencyForm } from "./CreateDeficiencyForm";
import { OldDeficiencyRow } from "./OldDeficiencyRow";


/** Main inspection card for a cadet. Handles both active-inspection flow and standalone deficiency management. */
export const CadetInspectionCard = () => {
    const t = useI18n();

    const { cadetId } = useParams<{ cadetId: string }>();
    const [step, setStep] = useState<number>(0);
    const [showCreateCard, setShowCreateCard] = useState(false);
    const [inspectionData, setInspectionData] = useState<CadetInspectionFormSchema | null>(null);

    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);
    const { deficiencyTypeList } = useDeficiencyTypes();
    const { inspectionState } = useInspectionState();
    const inspectionActive = !!inspectionState?.active;

    const handleStartCadetInspection = async () => getCadetInspectionFormData(cadetId).then((data) => {
        setInspectionData(data);
        if (data.oldDeficiencyList.length > 0) {
            setStep(1);
        } else {
            setStep(2);
        }
    }).catch(() => {
        toast.error(t('cadetDetailPage.inspection.error.startInspection'));
    });

    const handleSaveInspection = async (data: CadetInspectionFormSchema) => {
        data.newDeficiencyList.forEach((def) => {
            if (def.uniformId === "") def.uniformId = null;
            if (def.materialId === "") def.materialId = null;
        });

        saveCadetInspection(data).then(() => {
            mutate(swrKeys.unresolvedDeficienciesByCadet(cadetId));
            setStep(0);
            toast.success(t('cadetDetailPage.inspection.message.saved'));
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    };

    return (
        <div data-testid="div_cadetInspection" className="container border border-2 rounded">
            <CadetInspectionCardHeader
                step={step}
                startInspecting={handleStartCadetInspection}
                showCreateCard={showCreateCard}
                onNewDeficiency={!inspectionActive ? () => setShowCreateCard(true) : undefined}
            />
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
                    {showCreateCard && (
                        <div className="p-2 border-top border-1 border-dark">
                            <CreateDeficiencyForm
                                onSaved={() => setShowCreateCard(false)}
                                onCancel={() => setShowCreateCard(false)}
                            />
                        </div>
                    )}
                </div>
            }
            {(step === 1 || step === 2) && (
                <Form<CadetInspectionFormSchema>
                    zodSchema={getCadetInspectionFormSchema(deficiencyTypeList ?? [], [])}
                    onSubmit={handleSaveInspection}
                    defaultValues={inspectionData ?? undefined}
                >
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
                </Form>
            )}
        </div>
    );
};