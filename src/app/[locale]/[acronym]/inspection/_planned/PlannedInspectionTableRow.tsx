"use client"

import DatePicker from "@/components/datePicker/datePicker";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { createInspection, deleteInspection, startInspection, stopInspection, updatePlannedInspection } from "@/dal/inspection";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import dayjs from "@/lib/dayjs";
import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Col, FormControl, Row } from "react-bootstrap";
import { Controller, FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { InspectionBadge } from "./InspectionBadge";
import { InspectionButtonColumn } from "./InspectionButtonColumn";
import { InspectionDeregistrationColumn } from "./InspectionDeregistrationColumn";

export function PlannedInspectionTableRow({
    inspection,
    closeNewLine,
    openDeregistrationOffcanvas,
}: {
    inspection: PlannedInspectionType | null;
    closeNewLine?: () => void;
    openDeregistrationOffcanvas?: (id: string) => void;
}) {
    const t = useScopedI18n('inspection.planned');
    const tError = useScopedI18n('common.error');
    const modal = useModal();
    const form = useForm<PlannedInspectionFormShema>({
        resolver: zodResolver(plannedInspectionFormShema),
        mode: "onChange",
    });
    const { handleSubmit, reset } = form;
    const [editable, setEditable] = useState(!inspection);
    const { mutate, inspectionList } = usePlannedInspectionList();

    function handleEdit() {
        reset({
            name: inspection?.name ?? "",
            date: inspection?.date ?? new Date(),
        });
        setEditable(true);
    }
    function handleCancel() {
        if (inspection) {
            setEditable(false);
        } else {
            closeNewLine!();
        }
    }
    function handleSave(data: PlannedInspectionFormShema) {
        if (inspection) {
            setEditable(false);
            mutate(updatePlannedInspection({ data, id: inspection.id }))
                .catch(() => {
                    toast.error(tError('actions.save'));
                });
        } else {
            mutate(createInspection(data))
                .then(() => {
                    closeNewLine!();
                }).catch(() => {
                    toast.error(tError('actions.create'))
                });
        }
    }
    function handleDelete() {
        if (!inspection) return;
        mutate(
            deleteInspection(inspection?.id)
        ).catch(() => {
            toast.error(tError('actions.delete'));
        });
    }

    function handleStart() {
        if (!inspection) return;

        if (inspectionList?.find(i => i.timeStart && !i.timeEnd)) {
            return modal?.simpleErrorModal({
                header: t('errors.unfinished.header'),
                message: t('errors.unfinished.message'),
            });
        }

        startInspection()
            .then(() => mutate())
            .catch(() => toast.error(t('errors.start')));
    }

    function handleFinish() {
        if (!inspection) return;
        const startTime = dayjs.utc(inspection.timeStart).format('HH:mm');
        const compareTime = (value: string) => (startTime < value);

        modal?.simpleFormModal({
            header: t('label.finishInspection'),
            elementLabel: t('label.time.finished'),
            elementValidation: {
                validate: (value) => compareTime(value) || t('errors.endBeforStart', { startTime }),
            },
            defaultValue: {
                input: dayjs().isSame(inspection?.date, "day") ? dayjs().format('HH:mm') : ''
            },
            type: "time",
            async save({ input }) {
                stopInspection({
                    time: input,
                    id: inspection.id,
                }).then(() => mutate()).catch((e) => {
                    console.error(e);
                })
            },
            abort() { },
        });
    }

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <FormProvider {...form}>
                <Row
                    role={"row"}
                    aria-label={inspection?.name ?? "newInspection"}
                    data-testid={`div_inspection_${inspection?.id ?? "new"}`}
                    className="bg-white p-2 border-bottom border-1 position-relative"
                >
                    <Col xs={12} md={2} className="my-1">
                        <InspectionBadge inspection={inspection} />
                    </Col>
                    <DateColumn editable={editable} inspection={inspection} />
                    <NameColumn editable={editable} inspection={inspection} />
                    {(!editable && inspection) &&
                        <InspectionDeregistrationColumn inspection={inspection} openOffcanvas={() => openDeregistrationOffcanvas!(inspection.id)} />
                    }
                    <Col xs={editable ? 12 : 6} md={0} className="position-md-absolute end-0 w-auto text-md-end my-1" role={"cell"} aria-label="actions">
                        <InspectionButtonColumn
                            editable={editable}
                            handleCancel={handleCancel}
                            handleDelete={handleDelete}
                            handleEdit={handleEdit}
                            handleStart={handleStart}
                            handleFinish={handleFinish}
                            inspection={inspection}
                        />
                    </Col>
                </Row>
            </FormProvider>
        </form>
    )
}

type NameColumnProps = {
    editable: boolean;
    inspection: PlannedInspectionType | null;
}
const NameColumn = ({ editable, inspection }: NameColumnProps) => {
    const t = useScopedI18n('inspection.planned');
    const name = useWatch({ name: 'name' });

    const { register, formState, setError, clearErrors } = useFormContext<PlannedInspectionFormShema>();
    const { inspectionList } = usePlannedInspectionList();

    useEffect(() => {
        if (editable) {
            if (name && inspectionList?.find(i => (i.name === name) && (i.id !== inspection?.id))) {
                setTimeout(() => {
                    setError('name', {
                        type: 'validation',
                        message: 'custom.inspection.nameDuplication',
                    })
                }, 0);
            }
        } else {
            clearErrors('name');
        }
    }, [name, editable, inspectionList, inspection]);

    return (
        <Col
            xs={editable ? 12 : 6} md={3} xl={editable ? 4 : 3}
            className="my-1"
            role="cell"
            aria-label={t('label.name')}
        >
            {(!editable && inspection)
                ? <span data-testid="div_name">{inspection.name}</span>
                : <FormControl
                    aria-label={t('label.name')}
                    isInvalid={!!formState.errors.name}
                    {...register('name')} />
            }
            <ErrorMessage error={formState.errors.name?.message} testId="err_name" />
        </Col>
    )
}

type DateColumnProps = {
    editable: boolean;
    inspection: PlannedInspectionType | null;
}
const DateColumn = ({ editable, inspection }: DateColumnProps) => {
    const t = useScopedI18n('inspection.planned');
    const { inspectionList } = usePlannedInspectionList();

    const { control, formState, setError, clearErrors } = useFormContext<PlannedInspectionFormShema>();
    const date = useWatch({ name: 'date' });

    useEffect(() => {
        if (editable) {
            if (date && inspectionList?.find(i => (
                (dayjs(date).isSame(i.date, "day"))
                && ((i.id !== inspection?.id) || !inspection)
            ))) {
                console.log("🚀 ~ useEffect ~ setError: date",)
                setTimeout(() => {
                    setError('date', {
                        type: 'validation',
                        message: 'custom.inspection.dateDuplication',
                    });
                }, 0);
            }
        } else {
            clearErrors('date');
        }
    }, [date, inspectionList, editable, inspection]);

    return (
        <Col xs={editable ? 12 : 6} md={3} className="my-1" role="cell" aria-label={t('label.date')}>
            {(!editable && inspection)
                ? <span data-testid="div_date">{dayjs(inspection.date).locale('de').format("dd DD.MM.YYYY")}</span>
                : <Controller
                    name="date"
                    control={control}
                    render={({ field: { onChange, value } }) =>
                        <DatePicker
                            onChange={onChange}
                            value={value}
                            error={formState.errors.date?.message}
                            ariaLabel={t('label.date')}
                        />
                    }
                />
            }
        </Col>
    );
}