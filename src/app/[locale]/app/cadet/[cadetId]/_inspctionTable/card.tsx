"use client"

import { getUnresolvedDeficienciesByCadet } from "@/actions/cadet/inspection";
import { useGlobalData } from "@/components/globalDataProvider";
import { useCadetInspection } from "@/dataFetcher/cadetInspection";
import { t } from "@/lib/test";
import { Deficiency } from "@/types/deficiencyTypes";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import useSWR from "swr";
import CadetInspectionCardHeader from "./header";
import OldDeficiencyRow from "./oldDeficiencyRow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";


export type FormType = {
    newDeficiencyList: (Deficiency & { uniformId?: string; })[],
    oldDeficiencyList: {
        [key in string]: boolean
    }
}
export default function CadetInspectionCard() {
    const form = useForm<FormType>();
    const { cadetId }: { cadetId: string } = useParams();


    const { inspectionState } = useGlobalData();
    const { cadetInspection } = useCadetInspection(cadetId);
    const { data: unresolvedDeficiencies } = useSWR(`cadet.${cadetId}.deficiencies.unresolved`, () => getUnresolvedDeficienciesByCadet(cadetId));
    const stepState = useState<number>(0);
    const [step, setStep] = stepState;


    function saveCadetInspection(data: FormType) {

    }

    return (
        <div data-testid="div_cadetInspection" className="container border border-2 rounded">
            <CadetInspectionCardHeader
                stepState={stepState}
            />
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(saveCadetInspection)}>
                    {((step === 0) || !inspectionState.active) &&
                        <div className="row p-0 bg-white border-top border-1 border-dark">
                            {!unresolvedDeficiencies &&
                                <div data-testid="div_step0_loading" className="text-center p-2">
                                    <FontAwesomeIcon icon={faSpinner} size="lg" className="mx-5 fa-spin-pulse" />
                                </div>
                            }
                            {unresolvedDeficiencies?.map((def: any) =>
                                <OldDeficiencyRow deficiency={def} step={step} key={def.id} />
                            )}
                            {(unresolvedDeficiencies?.length === 0) &&
                                <div data-testid="div_step0_noDeficiencies" className="fw-bold p-2">{t('msg.cadet.noDeficiencies')}</div>
                            }
                        </div>
                    }
                </form>
            </FormProvider>
        </div>
    )
}