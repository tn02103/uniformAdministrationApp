/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
"use client";

import { getCadetInspectionFormData } from "@/dal/inspection";
import { useUnresolvedDeficienciesByCadet } from "@/dataFetcher/cadetInspection";
import { useParams } from "next/navigation";
import CadetInspectionCardHeader from "./header";
import { useState } from "react";
import { CadetInspectionFormSchema } from "@/zod/deficiency";
import { useI18n } from "@/lib/locales/client";
import { FormProvider, useForm } from "react-hook-form";
import OldDeficiencyRow from "./oldDeficiencyRow";
import CadetInspectionStep1 from "./step1";
import CadetInspectionStep2 from "./step2";


export const CadetInspectionCard = () => {
    const t = useI18n();
    const form = useForm<CadetInspectionFormSchema>({ mode: "onTouched" });

    const { cadetId } = useParams<{ cadetId: string }>();
    const [step, setStep] = useState<number>(0);

    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);

    const handleStartCadetInspection = async () => {
        const d = await getCadetInspectionFormData(cadetId);
        console.log("🚀 ~ handleStartCadetInspection ~ d:", d)
        form.reset(d);
        setStep(1);
    }

    const handleSaveInspection = async (data: CadetInspectionFormSchema) => {
        console.log("🚀 ~ handleSaveInspection ~ data:", data)
    }

    return (
        <div data-testid="div_cadetInspection" className="container border border-2 rounded">
            <CadetInspectionCardHeader
                step={step}
                startInspecting={handleStartCadetInspection}
            />
            <form onSubmit={form.handleSubmit(handleSaveInspection)} className="p-3">
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
                            cancel={() =>  setStep(0)} />
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