import { ActionButton } from "@/components/Buttons/ActionButton";
import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { useI18n } from "@/lib/locales/client";
import { UseFormReturn } from "react-hook-form";

type AddChecklistItemFormProps = {
    templateId: string;
    onSave: (templateId: string, label: string) => Promise<void>;
};

type AddChecklistItemFormValues = { label: string };

/** Inline form to add a new checklist item to a template. */
export const AddChecklistItemForm = ({ templateId, onSave }: AddChecklistItemFormProps) => {
    const t = useI18n();

    const handleSubmit = async ({ label }: AddChecklistItemFormValues, form: UseFormReturn<AddChecklistItemFormValues>) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        await onSave(templateId, trimmed);
        form.reset({ label: "" });
    };

    return (
        <div>
            <Form<AddChecklistItemFormValues>
                onSubmit={handleSubmit}
                aria-label={t("admin.settings.returnProcess.addChecklistItem")}
            >
                <div
                    className="d-flex gap-2 align-items-start flex-wrap"
                >
                    <div style={{ flexGrow: 1, minWidth: "160px" }}>
                        <InputFormField
                            name="label"
                            label={t("admin.settings.returnProcess.addItemLabel")}
                            formName={`addChecklist_${templateId}`}
                        />
                    </div>
                    <ActionButton
                        variantKey="add"
                        type="submit"
                        size="md"
                        buttonClass="mt-4 pt-1"
                    />
                </div>
            </Form>
        </div>
    );
};
