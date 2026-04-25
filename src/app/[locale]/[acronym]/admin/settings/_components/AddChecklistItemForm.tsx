import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { useI18n } from "@/lib/locales/client";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "react-bootstrap";
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
        <div >
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
                            maxLength={100}
                        />
                    </div>
                    <Button type="submit" variant="outline-primary" size="sm" className="mt-4 pt-1">
                        <FontAwesomeIcon icon={faPlus} />
                    </Button>
                </div>
            </Form>
        </div>
    );
};
