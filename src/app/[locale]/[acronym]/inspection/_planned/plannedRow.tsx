"use client"

import DatePicker from "@/components/datePicker/datePicker";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { createInspection } from "@/dal/inspection/planned/create";
import { deleteInspection } from "@/dal/inspection/planned/delete";
import { updatePlannedInspection } from "@/dal/inspection/planned/update";
import { startInspection } from "@/dal/inspection/start";
import { stopInspection } from "@/dal/inspection/stop";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import dayjs from "@/lib/dayjs";
import { useScopedI18n } from "@/lib/locales/client";
import { PlannedInspectionType } from "@/types/inspectionTypes";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Col, FormControl, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { InspectionBadge } from "./ColBadge";
import { ButtonColumn } from "./ColButtons";
import { DeragistrationCol } from "./ColDeregistrations";

export default function PlannedInspectionTableRow({
    inspection,
    closeNewLine,
    openDeregistrationModal,
}: {
    inspection: PlannedInspectionType | null;
    closeNewLine?: () => void;
    openDeregistrationModal?: (id: string) => void;
}) {
    const t = useScopedI18n('inspection.planned');
    const tError = useScopedI18n('common.error');
    const modal = useModal();
    const { register, handleSubmit, control, reset, formState, watch } = useForm<PlannedInspectionFormShema>({
        resolver: zodResolver(plannedInspectionFormShema),
        mode: "onChange",
    });

    const [editable, setEditable] = useState(!inspection);
    const [nameDuplicationError, setNameDuplicationError] = useState(false);
    const { mutate, inspectionList } = usePlannedInspectionList();

    useEffect(() => {
        if (editable) {
            const name = watch('name')
            if (inspectionList?.find(i => (i.name === name) && (i.id !== inspection?.id))) {
                setNameDuplicationError(true);
            } else {
                setNameDuplicationError(false);
            }
        } else {
            setNameDuplicationError(false);
        }
    }, [watch('name'), editable]);

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
            <Row className="bg-white p-2 border-buttom border-1" data-testid={`div_inspection_${inspection?.id ?? "new"}`}>
                <Col xs={2}>
                    <InspectionBadge inspection={inspection} />
                </Col>
                <Col> {(!editable && inspection)
                    ? <span data-testid="div_date">{dayjs(inspection.date).locale('de').format("dd DD.MM.YYYY")}</span>
                    : <div>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field: { onChange, value } }) =>
                                <DatePicker onChange={onChange} value={value} error={formState.errors.date?.message} />
                            }
                        />
                    </div>
                }
                </Col>
                <Col>
                    {(!editable && inspection)
                        ? <span data-testid="div_name">{inspection.name}</span>
                        : <FormControl
                            isInvalid={!!formState.errors.name || nameDuplicationError}
                            {...register('name', {
                                validate: (value) => {
                                    if (!inspectionList?.find(i => (i.name === value) && (i.id !== inspection?.id)))
                                        return t('errors.nameDuplication');
                                }
                            })} />
                    }
                    <ErrorMessage error={formState.errors.name?.message} testId="err_name" />
                    {nameDuplicationError &&
                        <div className="fs-7 text-danger" data-testid="err_name_duplication">
                            {t('errors.nameDuplication')}
                        </div>
                    }
                </Col>
                {(!editable && inspection) &&
                    <DeragistrationCol inspection={inspection} openDeregistrationModal={() => openDeregistrationModal!(inspection.id)} />
                }
                <ButtonColumn editable={editable}
                    handleCancel={handleCancel}
                    handleDelete={handleDelete}
                    handleEdit={handleEdit}
                    handleStart={handleStart}
                    handleFinish={handleFinish}
                    inspection={inspection}
                    nameDuplicationError={!!nameDuplicationError}
                />
            </Row>
        </form>
    )
}
