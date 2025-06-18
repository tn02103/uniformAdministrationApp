import { InlineEditInputFormField } from "@/components/fields/InlineEditInputFormField";
import { StorageUnitWithUniformItems, updateStorageUnit } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { storageUnitFormSchema } from "@/zod/storage";
import { Offcanvas } from "react-bootstrap";


type UnitsliderHeaderProps = {
    storageUnit?: StorageUnitWithUniformItems | null;
}
export const StorageunitOCHeader = ({ storageUnit }: UnitsliderHeaderProps) => {
    const t = useI18n();
    const { mutate, storageUnits } = useStorageUnitsWithUniformItemList();
    const formSchema = storageUnitFormSchema
        .pick({ name: true })
        .refine((data) => storageUnits?.every(unit => unit.name !== data.name || unit.id === storageUnit?.id), {
            message: t('storageUnit.error.nameDuplication'),
            path: ['name'],
        });

    const handleSaveTitle = (name: string) => {
        if (!storageUnit) return;

        SAFormHandler(
            updateStorageUnit({ id: storageUnit.id, data: { name } }),
            null,
            (returnData) => {
                mutate(returnData);
            },
            t('common.error.actions.save'),
        );
    }

    return (
        <Offcanvas.Header closeButton>
            {storageUnit ? (
                <h3>
                    <InlineEditInputFormField
                        name="name"
                        value={storageUnit?.name}
                        onSave={handleSaveTitle}
                        zodSchema={formSchema}
                        textClassName="fw-bold fs-4"
                        inputClassName="fs-5"
                        ariaLabel={t('storageUnit.label.editName')}
                    />
                </h3>
            ) : (
                <Offcanvas.Title>
                    <h3>
                        {t('storageUnit.label.header.create')}
                    </h3>
                </Offcanvas.Title>
            )}
        </Offcanvas.Header>
    );
}
