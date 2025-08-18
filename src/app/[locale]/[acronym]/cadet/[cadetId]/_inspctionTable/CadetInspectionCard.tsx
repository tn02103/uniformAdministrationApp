/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
"use client";

import { getCadetInspectionFormData, saveCadetInspection } from "@/dal/inspection";
import { useUnresolvedDeficienciesByCadet } from "@/dataFetcher/cadetInspection";
import { useParams } from "next/navigation";
import CadetInspectionCardHeader from "./CadetInspectionCardHeader";
import { useState } from "react";
import { cadetInspectionFormSchema, CadetInspectionFormSchema } from "@/zod/deficiency";
import { useI18n } from "@/lib/locales/client";
import { FormProvider, useForm } from "react-hook-form";
import OldDeficiencyRow from "./OldDeficiencyRow2";
import CadetInspectionStep1 from "./CadetInspectionStep1";
import CadetInspectionStep2 from "./CadetInspectionStep2";
import { mutate } from "swr";
import { toast } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";


export const CadetInspectionCard = () => {
    const t = useI18n();
    const form = useForm<CadetInspectionFormSchema>({
        mode: "onTouched",
        resolver: zodResolver(cadetInspectionFormSchema),
    });

    const { cadetId } = useParams<{ cadetId: string }>();
    const [step, setStep] = useState<number>(0);

    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);

    const handleStartCadetInspection = async () => {
        const data = await getCadetInspectionFormData(cadetId);
        form.reset(data);
        setStep(1);
    }

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
        console.log("🚀 ~ handleSaveInspection ~ data:", data)
        
        saveCadetInspection(data).then(() => {
            mutate(
                (key: string | object) => (typeof key === "string") && (key === `cadet.${cadetId}.inspection` || key === `cadet.${cadetId}.deficiencies.unresolved`),
                undefined,
                { populateCache: false }
            );
            setStep(0);
            console.log("🚀 ~ handleSaveInspection ~ success:")
            toast.success(t('cadetDetailPage.inspection.saved'));
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
            <form onSubmit={form.handleSubmit(handleSaveInspection, console.warn)} className="p-3">
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
                                <div data-testid="div_step0_noDeficiencies" className="fw-bold p-2">{t('cadetDetailPage.inspection.noDeficiencies')}</div>
                            }
                        </div>
                    }
                    {step === 1 && (
                        <CadetInspectionStep1
                            stepState={[step, setStep]}
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