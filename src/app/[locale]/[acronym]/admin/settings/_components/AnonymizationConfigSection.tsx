"use client";

import { Form } from "@/components/fields/Form";
import { FormConditional } from "@/components/fields/form/FormConditional";
import { NumberInputFormField } from "@/components/fields/NumberInputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { updateAssosiationAnonymizationConfig } from "@/dal/assosiation";
import { useI18n } from "@/lib/locales/client";
import { UpdateAnonymizationConfigInput, updateAnonymizationConfigSchema } from "@/zod/assosiation";
import { useRouter } from "next/navigation";
import { Button } from "react-bootstrap";
import { FormStateSubscribe, UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";

type AnonymizationConfig = {
    anonymizationMode: "MANUAL" | "AFTER_DAYS" | "IMMEDIATELY";
    anonymizationDelayDays: number | null;
};

type Props = {
    /** Current anonymisation config fetched server-side. */
    initialConfig: AnonymizationConfig;
};

/**
 * Form section for configuring the anonymisation policy.
 * Calls updateAnonymizationConfig on submit and refreshes server data.
 */
export const AnonymizationConfigSection = ({ initialConfig }: Props) => {
    const t = useI18n();
    const router = useRouter();

    const modeOptions = [
        { value: "MANUAL", label: t("admin.settings.anonymization.modes.MANUAL") },
        { value: "AFTER_DAYS", label: t("admin.settings.anonymization.modes.AFTER_DAYS") },
        { value: "IMMEDIATELY", label: t("admin.settings.anonymization.modes.IMMEDIATELY") },
    ];

    const handleSubmit = async (data: UpdateAnonymizationConfigInput, form: UseFormReturn<UpdateAnonymizationConfigInput>) => {
        const delayDays = data.anonymizationMode === "AFTER_DAYS" ? (data.anonymizationDelayDays ?? undefined) : undefined;
        await updateAssosiationAnonymizationConfig({
            anonymizationMode: data.anonymizationMode,
            anonymizationDelayDays: delayDays,
        }).then(() => {
            toast.success(t("admin.settings.anonymization.success"));
            form.reset({ anonymizationMode: data.anonymizationMode, anonymizationDelayDays: delayDays });
            router.refresh();
        }).catch(() => {
            toast.error(t("admin.settings.anonymization.error"));
        });
    };

    return (
        <div style={{ minWidth: "400px" }}>
            <h2>{t("admin.settings.anonymization.header")}</h2>
            <hr />
            <Form<UpdateAnonymizationConfigInput>
                formName="anonymizationConfig"
                aria-label={t("admin.settings.anonymization.header")}
                onSubmit={handleSubmit}
                defaultValues={{
                    anonymizationMode: initialConfig.anonymizationMode,
                    anonymizationDelayDays: initialConfig.anonymizationDelayDays ?? 1,
                }}
                zodSchema={updateAnonymizationConfigSchema}
            >
                <div className="mt-3">
                    <SelectFormField
                        name="anonymizationMode"
                        label={t("admin.settings.anonymization.anonymizationMode")}
                        options={modeOptions}
                        formName="anonymizationConfig"
                        selectClassName="w-auto"
                    />
                </div>
                <FormConditional
                    name="anonymizationMode"
                    condition={(value) => value === "AFTER_DAYS"}
                >
                    <div className="mt-3">
                        <NumberInputFormField
                            name="anonymizationDelayDays"
                            label={t("admin.settings.anonymization.anonymizationDelayDays")}
                            formName="anonymizationConfig"
                            className="w-auto"
                        />
                    </div>
                </FormConditional>
                <FormStateSubscribe
                    render={({ isDirty, isSubmitting }) => (
                        <Button type="submit" variant="primary" className="mt-3" disabled={!isDirty || isSubmitting}>
                            {t("common.actions.save")}
                        </Button>
                    )}
                />
            </Form>
        </div >
    );
};
