
import { useI18n } from "@/lib/locales/client"
import { useEffect, useState } from "react"
import { Row } from "react-bootstrap"
import { toast } from "react-toastify"
import NewUniformConfigurator from "./../configurator"
import NumberInput from "./NumberInput"
import { createUniformItems } from "@/dal/uniform/item/_index"

type ConfiguratorData = {
    typeId: string,
    generationId?: string,
    sizeId?: string,
    active: boolean,
    comment: string
}
export type AvaiabilityNumbers = {
    value: number;
    used: boolean;
}
const KnownIdsWorkflow = ({
    stepState: [step, setStep],
}: {
    stepState: [number, (b: number) => void]
}) => {
    const t = useI18n();
    const [uniformConfiguration, setUniformConfiguration] = useState<ConfiguratorData>();

    function handleConfiguratorSubmit(data: ConfiguratorData) {
        if (data.generationId === "null") delete data.generationId;

        if (step === 0) {
            setUniformConfiguration(data);
            setStep(1);
        }
    }

    async function handleCreate(numbers: number[]) {
        if (!uniformConfiguration) return;

        const sizeId: string = (uniformConfiguration.sizeId && uniformConfiguration?.sizeId === "null") ? "amount" : uniformConfiguration.sizeId as string;
        await createUniformItems({
            numberMap: [{ sizeId, numbers }],
            data: {
                uniformTypeId: uniformConfiguration.typeId,
                generationId: uniformConfiguration.generationId,
                comment: uniformConfiguration.comment,
                active: uniformConfiguration.active,
            }
        }).then((result) => {
            toast.success(t('createUniform.create.success', { count: result }));
            setStep(0);
        }).catch((error) => {
            console.error(error);
            toast.error(t('createUniform.create.failed', { count: numbers.length }));
        });
    }

    useEffect(() => {
        let element: HTMLElement | null = null;
        switch (step) {
            case 0:
                element = document.getElementById("uniformConfigurator");
                break;
            case 1:
                element = document.getElementById("numberInput");
                break;
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
                    withSizes={true}
                    onSubmit={handleConfiguratorSubmit} />
            </Row>
            {(step == 1) && uniformConfiguration &&
                <Row className="mt-4">
                    <NumberInput
                        stepBack={() => setStep(0)}
                        handleCreate={handleCreate}
                        uniformTypeId={uniformConfiguration.typeId}
                    />
                </Row>
            }
        </div>
    )
}

export default KnownIdsWorkflow;
