
import { generateUniformNumbers } from "@/actions/controllers/UniformIdController";
import { useI18n } from "@/lib/locales/client";
import { UniformNumbersSizeMap, UniformSizelist } from "@/types/globalUniformTypes";
import { useEffect, useState } from "react";
import { Row } from "react-bootstrap";
import { toast } from "react-toastify";
import NewUniformConfigurator, { ConfiguratorFormType } from "../configurator";
import Step1, { Step1FormType } from "./Step1";
import Step2 from "./Step2";
import { createUniformItems } from "@/dal/uniform/item/create";

type FormDataType = {
    configurator?: {
        typeId: string;
        generationId?: string;
        active: boolean;
        comment: string;
    },
    step1Data: Step1FormType;
    uniformNumberMap: UniformNumbersSizeMap;
}

const GeneratedWorkflow = ({
    stepState: [step, setStep],
}: {
    stepState: [number, (b: number) => void];
}) => {
    const t = useI18n();
    const [formData, setFormData] = useState<FormDataType>({ uniformNumberMap: [], step1Data: { continuous: false, values: {} } });
    const [usedSizelist, setUsedSizelist] = useState<UniformSizelist>();

    function handleConfiguratorSubmit(data: ConfiguratorFormType, sizelist?: UniformSizelist) {
        if (data.generationId === "null") delete data.generationId;

        if (step === 0) {
            setFormData({ configurator: data, uniformNumberMap: [], step1Data: { continuous: false, values: {} } });
            setStep(1);
            setUsedSizelist(sizelist);
        }
    }
    function handleGenerateNumbers(data: Step1FormType) {
        if (step !== 1 || !formData.configurator?.typeId)
            return;

        const numberCount: { sizeId: string, value: number }[] = Object
            .entries(data.values)
            .filter(([, value]) => (value as number) > 0)
            .map(([key, value]) => {
                return {
                    sizeId: key,
                    value: +value,
                }
            });

        if (numberCount.length === 0) {
            toast.error(t('createUniform.errors.minNumber'));
            return;
        }

        generateUniformNumbers(formData.configurator?.typeId, numberCount, data.continuous)
            .then(result => {
                setFormData(prevState => ({
                    ...prevState,
                    uniformNumberMap: result,
                    step1Data: data
                }));
                setStep(2);
            })
            .catch(error => {
                console.error(error);
                toast.error(t('common.error.unknown'));
            });
    }
    function handleCreate(uniformNumberMap: UniformNumbersSizeMap) {
        if (!formData.configurator) return;

        createUniformItems({
            numberMap: uniformNumberMap,
            data: {
                uniformTypeId: formData.configurator.typeId,
                generationId: formData.configurator.generationId,
                comment: formData.configurator.comment,
                active: formData.configurator.active,
            }
        }).then((result) => {
            toast.success(t('createUniform.create.success', { count: result }));
            setFormData({ uniformNumberMap: [], step1Data: { continuous: false, values: {} } });
            setStep(0);
        }).catch(error => {
            console.error(error);
            toast.error(t('createUniform.create.failed', { count: uniformNumberMap.length }));
        });
    }

    useEffect(() => {
        let element: HTMLElement | null = null;
        switch (step) {
            case 0:
                element = document.getElementById("uniformConfigurator");
                break;
            case 1:
                element = document.getElementById("step1");
                break;
            case 2:
                element = document.getElementById("step2");
        }

        if (element) {
            element.scrollIntoView(true);
        }
    }, [step]);

    return (
        <div>
            <Row>
                <NewUniformConfigurator
                    step={step}
                    withSizes={false}
                    onSubmit={handleConfiguratorSubmit}
                />
            </Row>
            {(step === 1) &&
                <Row className="mt-4">
                    <Step1
                        usedSizelist={usedSizelist}
                        initialMap={formData.step1Data}
                        onSubmit={handleGenerateNumbers}
                        stepBack={() => setStep(0)}
                    />
                </Row>
            }
            {(step === 2) &&
                <Row className="mt-4">
                    <Step2
                        uniformNumberMap={formData.uniformNumberMap}
                        usedSizelist={usedSizelist}
                        stepBack={() => setStep(1)}
                        onCreate={handleCreate}
                    />
                </Row>
            }
        </div>
    )
}

export default GeneratedWorkflow;
