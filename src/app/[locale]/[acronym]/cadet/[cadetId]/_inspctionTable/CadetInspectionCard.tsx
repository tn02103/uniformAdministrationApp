"use client";

import { getCadetInspectionFormData, saveCadetInspection } from "@/dal/inspection";
import { useUnresolvedDeficienciesByCadet } from "@/dataFetcher/inspection";
import { useI18n } from "@/lib/locales/client";
import { cadetInspectionFormSchema, CadetInspectionFormSchema } from "@/zod/deficiency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";
import CadetInspectionCardHeader from "./CadetInspectionCardHeader";
import { CadetInspectionStep1 } from "./CadetInspectionStep1";
import { CadetInspectionStep2 } from "./CadetInspectionStep2";
import { OldDeficiencyRow } from "./OldDeficiencyRow";


export const CadetInspectionCard = () => {
    const t = useI18n();
    const form = useForm<CadetInspectionFormSchema>({
        mode: "onTouched",
        resolver: zodResolver(cadetInspectionFormSchema),
    });

    const { cadetId } = useParams<{ cadetId: string }>();
    const [step, setStep] = useState<number>(0);

    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);

    const handleStartCadetInspection = async () => getCadetInspectionFormData(cadetId).then((data) => {
        form.reset(data);
        setStep(1);
    }).catch(() => {
        toast.error(t('cadetDetailPage.inspection.error.startInspection'));
    })

    const handleSaveInspection = async (data: CadetInspectionFormSchema) => {
        data.newDeficiencyList.forEach((def, index) => {
            if (def.materialId) {
                if (def.materialId === "others") {
                    data.newDeficiencyList[index].materialId = def.otherMaterialId;
                }
            }

            if (def.uniformId === "") def.uniformId = null;
            if (def.materialId === "") def.materialId = null;
            if (def.otherMaterialId === "") def.otherMaterialId = null;
            if (def.otherMaterialGroupId === "") def.otherMaterialGroupId = null;
        });

        saveCadetInspection(data).then(() => {
            mutate(
                (key: string | object) => (typeof key === "string") && (key === `cadet.${cadetId}.inspection` || key === `cadet.${cadetId}.deficiencies.unresolved`),
                undefined,
                { populateCache: false }
            );
            setStep(0);
            toast.success(t('cadetDetailPage.inspection.message.saved'));
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }

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
                                />
                            ))}
                            {(unresolvedDeficiencies?.length === 0) &&
                                <div data-testid="div_step0_noDeficiencies" className="fw-bold p-2">{t('cadetDetailPage.inspection.label.noDeficiencies')}</div>
                            }
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