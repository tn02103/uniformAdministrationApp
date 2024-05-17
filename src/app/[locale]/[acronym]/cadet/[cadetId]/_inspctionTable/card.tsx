"use client"

import { saveCadetInspection } from "@/actions/controllers/CadetInspectionController";
import { getCadetMaterialList } from "@/actions/controllers/CadetMaterialController";
import { getDeficiencyTypeList } from "@/actions/controllers/InspectionController";
import { getMaterialGroupIdByTypeId } from "@/actions/material";
import { useCadetMaterialDescriptionList, useCadetUniformComplete } from "@/dataFetcher/cadet";
import { useCadetInspection, useUnresolvedDeficienciesByCadet } from "@/dataFetcher/cadetInspection";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useInspectionState } from "@/dataFetcher/inspection";
import { Deficiency, UniformDeficiency } from "@/types/deficiencyTypes";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DeficiencyCadet } from "@prisma/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";
import CadetInspectionCardHeader from "./header";
import OldDeficiencyRow from "./oldDeficiencyRow";
import CadetInspectionStep1 from "./step1";
import CadetInspectionStep2 from "./step2";
import { useI18n } from "@/lib/locales/client";

export type NewDeficiencyFormType = Deficiency & {
    fk_uniform?: string;
    fk_material?: string;
    materialId?: string;
    materialGroup?: string;
    materialType?: string;
}
export type FormType = {
    newDeficiencyList: NewDeficiencyFormType[],
    oldDeficiencyList: {
        [key in string]: boolean
    }
}
export default function CadetInspectionCard() {
    const t = useI18n();
    const form = useForm<FormType>();
    const { cadetId }: { cadetId: string } = useParams();


    const { inspectionState } = useInspectionState();
    const { cadetInspection } = useCadetInspection(cadetId);
    const { unresolvedDeficiencies } = useUnresolvedDeficienciesByCadet(cadetId);
    const { deficiencyTypeList } = useDeficiencyTypes();
    const { materialList } = useCadetMaterialDescriptionList(cadetId);
    const uniformComplete = useCadetUniformComplete(cadetId);
    const stepState = useState<number>(0);
    const [step, setStep] = stepState;


    function aboardInspection() {
        resetForm();
        setStep(0);
    }

    const submit = async (data: FormType) => new Promise<FormType>((resolve) => {
        data.newDeficiencyList.forEach((def, index) => {
            if (def.materialId) {
                if (def.materialId === "others") {
                    data.newDeficiencyList[index].fk_material = def.materialType;
                } else {
                    data.newDeficiencyList[index].fk_material = def.materialId;
                }
            }
        });
        resolve(data);
    }).then(async (data) => mutate(
        (key: any) => (typeof key === "string") && (key === `cadet.${cadetId}.inspection` || key === `cadet.${cadetId}.deficiencies.unresolved`),
        saveCadetInspection(data, cadetId, uniformComplete),
        { populateCache: false }
    )).then(() => {
        setStep(0);
        toast.success(t('cadetDetailPage.inspection.saved'));
    }).catch((e) => {
        console.error(e);
        toast.error(t('common.error.actions.save'));
    });

    const resetForm = async () => {
        if (!cadetInspection) return;

        const typeList = deficiencyTypeList ?? await getDeficiencyTypeList();
        const matList = materialList ?? await getCadetMaterialList(cadetId);
        const formatNewDeficiencies = async () => Promise.all(
            cadetInspection.newCadetDeficiencies.map(async (def) => {
                const type = typeList?.find(t => t.id === def.typeId);
                if (!type) throw Error("Type not found");

                const deficiency: NewDeficiencyFormType = {
                    ...def,
                }

                if (type.dependend === "uniform" || type.relation === "uniform") {
                    deficiency.fk_uniform = (def as UniformDeficiency).fk_uniform;
                }

                if (type.relation === "material") {
                    const matId: string = (def as unknown as DeficiencyCadet).fk_material!;
                    if (matId) {
                        const m = matList.find(m => m.id === matId);
                        if (m) {
                            deficiency.materialId = m.id;
                        } else {
                            deficiency.materialGroup = await getMaterialGroupIdByTypeId(matId);
                            deficiency.materialType = matId;
                            deficiency.materialId = "others";
                        }
                    }
                }

                return deficiency
            })
        )
        const formatOldDeficiencies = () => cadetInspection.oldCadetDeficiencies.reduce(
            (oldMap: { [key in string]: boolean }, def) => {
                oldMap[def.id!] = !!def.dateResolved;
                return oldMap
            },
            {}
        );

        try {
            const newFormData: FormType = {
                newDeficiencyList: await formatNewDeficiencies(),
                oldDeficiencyList: formatOldDeficiencies(),
            }
            form.reset(newFormData);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        resetForm();
    }, [cadetInspection]);

    return (
        <div data-testid="div_cadetInspection" className="container border border-2 rounded">
            <CadetInspectionCardHeader
                stepState={stepState}
                disabled={!form.getValues('newDeficiencyList')}
            />
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(submit)}>
                    {((step === 0) || !inspectionState?.active) &&
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
                                <div data-testid="div_step0_noDeficiencies" className="fw-bold p-2">{t('cadetDetailPage.inspection.noDeficiencies')}</div>
                            }
                        </div>
                    }
                    {((step === 1) && inspectionState?.active && cadetInspection) &&
                        <CadetInspectionStep1
                            stepState={stepState}
                            cancel={aboardInspection} />
                    }
                    {((step === 2) && inspectionState?.active && cadetInspection) &&
                        <CadetInspectionStep2
                            prevStep={() => { (cadetInspection!.oldCadetDeficiencies.length > 0) ? setStep(1) : aboardInspection() }}
                        />
                    }
                </form>
            </FormProvider>
        </div>
    )
}
