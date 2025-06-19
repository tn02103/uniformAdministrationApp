import type { StorageUnitWithUniformItems } from "@/dal/storageUnit/_index";

import { Form } from "@/components/fields/Form";
import { InputFormField } from "@/components/fields/InputFormField";
import { NumberInputFormField } from "@/components/fields/NumberInputFormField";
import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { createStorageUnit, updateStorageUnit } from "@/dal/storageUnit/_index";
import { useStorageUnitsWithUniformItemList } from "@/dataFetcher/storage";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { storageUnitFormSchema, StorageUnitFormType } from "@/zod/storage";
import { Button, Col, Row } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import z from "zod";


type Props = {
    editable?: boolean;
    storageUnit?: StorageUnitWithUniformItems;
    setEditable: (editable: boolean) => void;
    setSelectedStorageUnitId: (id: string | null) => void;
    onHide: () => void;
}

export function StorageunitOCDetailForm({ editable, storageUnit, setEditable, setSelectedStorageUnitId, onHide }: Props) {
    const t = useI18n();
    const { mutate, storageUnits } = useStorageUnitsWithUniformItemList();

    let formSchema;
    if (!storageUnit) {
        formSchema = storageUnitFormSchema.refine((schema) => storageUnits?.every(s => s.name !== schema.name), {
            message: t('storageUnit.error.nameDuplication'),
            path: ['name'],
        });
    } else {
        formSchema = storageUnitFormSchema.omit({ name: storageUnit ? true : undefined })
    }
    type FormType = z.infer<typeof formSchema>;

    let defaultValue: FormType | undefined = undefined;
    if (storageUnit) {
        const zodData = formSchema.safeParse(storageUnit);
        if (zodData.success) {
            defaultValue = zodData.data;
        }
    }

    const handleSave = async (data: FormType) => {
        if (!storageUnit) {
            await SAFormHandler(
                createStorageUnit(data as StorageUnitFormType),
                null,
                (returnData) => {
                    if (Array.isArray(returnData)) {
                        mutate(returnData);
                        setEditable(false);
                        setSelectedStorageUnitId(returnData.find(u => u.name === (data as StorageUnitFormType).name)?.id ?? null);
                    }
                },
                t('common.error.actions.create'),
            );
        }
        else {
            await SAFormHandler(
                updateStorageUnit({ id: storageUnit.id, data }),
                null,
                (returnData) => {
                    mutate(returnData);
                    setEditable(false);
                },
                t('common.error.actions.save'),
            );
        }
    }
    const handleCancel = () => {
        if (storageUnit) {
            setEditable(false);
        } else {
            onHide();
        }
    }
    return (
        <Form<FormType>
            onSubmit={handleSave}
            formName="storageUnitForm"
            disabled={!editable}
            plaintext={!editable}
            defaultValues={defaultValue}
            zodSchema={formSchema}
        >
            <Row>
                {!storageUnit && (
                    <Col xs={12} className="mb-3">
                        <InputFormField name="name" label={t('storageUnit.label.details.name')} required />
                    </Col>
                )}
                <Col xs={12} className="mb-3">
                    <TextareaFormField name="description" label={t('storageUnit.label.details.description')} />
                </Col>
                <Col xs={4} className="mb-3">
                    <NumberInputFormField name="capacity" label={t('storageUnit.label.details.capacity')} className="" />
                </Col>
                <Col xs={7} className="mb-3">
                    <ToggleFormField
                        name="isReserve"
                        label={t('storageUnit.label.details.forReserves')}
                        toggleText={t('storageUnit.label.details.forReservesText')}
                    />
                </Col>
            </Row>
            {editable && (
                <Row>
                    <Col>
                        <CancelButton onClick={handleCancel} />
                    </Col>
                    <Col>
                        <Button type="submit" size="sm" variant="outline-primary" className="m-1">
                            {t('common.actions.save')}
                        </Button>
                    </Col>
                </Row>
            )}
        </Form>
    );
}

const CancelButton = ({ onClick }: { onClick: () => void }) => {
    const { reset } = useFormContext();
    const t = useScopedI18n('common.actions');

    const handleCancel = () => {
        reset();
        onClick();
    }

    return (
        <Button type="button" size="sm" variant="outline-secondary" className="m-1" onClick={handleCancel}>
            {t('cancel')}
        </Button>
    )
};
