import { createUniformItems } from "@/actions/controllers/UniformController"
import { t } from "@/lib/test"
import { useEffect, useState } from "react"
import { Row } from "react-bootstrap"
import { toast } from "react-toastify"
import NewUniformConfigurator from "./../configurator"
import NumberInput from "./NumberInput"

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
    const [uniformConfiguration, setUniformConfiguration] = useState<ConfiguratorData>();

    function onConfiguratorSubmit(data: ConfiguratorData) {
        if (data.generationId === "null") delete data.generationId;

        if (step === 0) {
            setUniformConfiguration(data);
            setStep(1);
        }
    }

    async function handleCreate(numbers: number[]) {
        if (!uniformConfiguration) return;

        const sizeId: string = (uniformConfiguration.sizeId && uniformConfiguration?.sizeId === "null") ? "amount" : uniformConfiguration.sizeId as string;
        await createUniformItems(
            [{ sizeId, numbers }],
            {
                uniformTypeId: uniformConfiguration.typeId,
                generationId: uniformConfiguration.generationId,
                comment: uniformConfiguration.comment,
                active: uniformConfiguration.active,
            }
        ).then((result) => {
            toast.success(t('label.uniform.create.success', { count: result }));
            setStep(0);
        }).catch((error) => {
            console.error(error);
            toast.error(t('error.uniform.create.failed'));
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
                    onSubmit={onConfiguratorSubmit} />
            </Row>
            {(step == 1) && uniformConfiguration &&
                <Row className="mt-4">
                    <NumberInput
                        stepBack={() => setStep(0)}
                        createItems={handleCreate}
                        uniformTypeId={uniformConfiguration.typeId}
                    />
                </Row>
            }
        </div>
    )
}

export default KnownIdsWorkflow;
