"use client";

import { TooltipActionButton } from "@/components/Buttons/TooltipIconButton";
import { Form } from "@/components/fields/Form";
import { createDeficiency } from "@/dal/inspection/deficiency";
import { useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { swrKeys } from "@/dataFetcher/swrKeys";
import { useI18n } from "@/lib/locales/client";
import { CreateDeficiencyInput, createDeficiencySchema } from "@/zod/deficiency";
import { useParams } from "next/navigation";
import { Row } from "react-bootstrap";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { DeficiencyFormFields } from "../_sharedComponents/DeficiencyFormFields";

/**
 * Standalone form for creating a new cadet deficiency.
 *
 * @param onSaved - Called after a deficiency is successfully created.
 * @param onCancel - Called when the user cancels the form.
 */
export function CreateDeficiencyForm({
    onSaved,
    onCancel,
}: {
    onSaved: () => void;
    onCancel: () => void;
}) {
    const t = useI18n();
    const { cadetId } = useParams<{ cadetId: string }>();
    const { deficiencyTypeList } = useDeficiencyTypes();

    const handleSubmit = async (data: CreateDeficiencyInput) => {
        try {
            await createDeficiency(data);
            await mutate(swrKeys.unresolvedDeficienciesByCadet(cadetId));
            onSaved();
            toast.success(t('cadetDetailPage.inspection.message.deficiencyCreated'));
        } catch {
            toast.error(t('common.error.actions.save'));
        }
    };


    return (
        <Form<CreateDeficiencyInput>
            zodSchema={createDeficiencySchema(deficiencyTypeList ?? [])}
            onSubmit={handleSubmit}
            defaultValues={{
                typeId: "",
                comment: "",
                description: "",
                uniformId: null,
                cadetId,
            }}
        >
            <div className="border rounded p-2 mt-2 bg-light">
                <Row>
                    <DeficiencyFormFields namePrefix="" cadetId={cadetId} />
                </Row>
                <div className="d-flex gap-2 mt-2">
                    <TooltipActionButton
                        variantKey="save"
                        buttonType="submit"
                        testId="btn_save_new_deficiency"
                        onClick={() => { }}
                    />
                    <TooltipActionButton
                        variantKey="cancel"
                        testId="btn_cancel_new_deficiency"
                        onClick={onCancel}
                    />
                </div>
            </div>
        </Form>
    );
}
