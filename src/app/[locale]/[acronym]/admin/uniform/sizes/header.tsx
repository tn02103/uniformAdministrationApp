"use client";

import { createSize } from "@/actions/controllers/UniformSizeController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { CardHeader } from "@/components/card";
import { useModal } from "@/components/modals/modalProvider";
import { useI18n } from "@/lib/locales/client";
import { t } from "@/lib/test";
import { nameValidationPattern } from "@/lib/validations";
import { UniformSize } from "@/types/globalUniformTypes";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";


export default function UniformsizeConfigurationHeader({ sizes }: { sizes: UniformSize[] }) {
    const t = useI18n();
    const modal = useModal();

    function handleCreate() {
        modal?.simpleFormModal({
            header: t('admin.uniform.size.createModal.header'),
            elementLabel: t('admin.uniform.size.createModal.label'),
            elementValidation: {
                required: {
                    value: true,
                    message: t('common.error.string.required'),
                },
                pattern: {
                    value: nameValidationPattern,
                    message: t('common.error.string.noSpecialChars'),
                },
                maxLength: {
                    value: 10,
                    message: t('common.error.string.maxLength', { value: 10 }),
                },
                validate: (value) => !sizes.find(s => s.name === value) || t('admin.uniform.size.createModal.nameDuplicationError'),
            },
            save: async ({ input }) =>
                createSize(input).catch(e => {
                    console.error(e);
                    toast.error(t('common.error.actions.save'));
                }),
            abort: () => { }
        })
    }
    return (
        <CardHeader
            title={t('common.uniform.size_other')}
            tooltipIconButton={
                <TooltipIconButton
                    icon={faPlus}
                    variant="outline-success"
                    tooltipText={t('common.actions.create')}
                    onClick={handleCreate}
                    testId="btn_create"
                />
            } />
    )
}