import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { useI18n } from "@/lib/locales/client";
import { CreateReturnProcessTemplateInput, createReturnProcessTemplateSchema } from "@/zod/returnProcess";
import { Button } from "react-bootstrap";

type CreateTemplateFormProps = {
    onSave: (data: CreateReturnProcessTemplateInput) => Promise<void>;
    onCancel: () => void;
};

/** Small inline form to create a new return process template. */
export const CreateTemplateForm = ({ onSave, onCancel }: CreateTemplateFormProps) => {
    const t = useI18n();

    return (
        <div
            className="d-flex align-items-start gap-2 mt-3 flex-wrap"
            aria-label={t("admin.settings.returnProcess.addTemplate")}
        >
            <Form
                formName="create-process-template"
                aria-label={t("admin.settings.returnProcess.addTemplate")}
                mode="onSubmit"
                onSubmit={onSave}
                zodSchema={createReturnProcessTemplateSchema}
                defaultValues={{ name: "", defaultProcess: false }}
            >
                <div style={{ minWidth: "220px", flexGrow: 1 }}>
                    <InputFormField
                        name="name"
                        label={t("admin.settings.returnProcess.templateName")}
                        required
                        hookFormValidation
                        maxLength={100}
                    />
                </div>
                <div className="d-flex gap-2 mt-4 pt-1">
                    <Button type="submit" variant="primary" size="sm">
                        {t("common.actions.create")}
                    </Button>
                    <Button type="button" variant="outline-secondary" size="sm" onClick={onCancel}>
                        {t("common.actions.cancel")}
                    </Button>
                </div>
            </Form>
        </div>
    );
};
