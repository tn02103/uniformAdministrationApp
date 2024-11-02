"use client"

import { closeInspection, startInspection } from "@/actions/controllers/InspectionController";
import DatePicker from "@/components/datePicker/datePicker";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import dayjs from "@/lib/dayjs";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Button, Col, FormControl, OverlayTrigger, Row } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { InspectionBadge } from "./badgeCol";
import { updatePlannedInspection } from "@/dal/inspection/planned/update";
import { createInspection } from "@/dal/inspection/planned/create";
import { deleteInspection } from "@/dal/inspection/planned/delete";
import { PlannedInspectionType } from "@/types/inspectionTypes";


export default function PlannedInspectionTableRow({
    inspection,
    closeNewLine,
    openDeregistrationModal,
}: {
    inspection: PlannedInspectionType | null;
    closeNewLine?: () => void;
    openDeregistrationModal?: (id: string) => void;
}) {
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
                    toast.error('Beim Speichern ist ein Unbekannter Fehler aufgetreten');
                });
        } else {
            mutate(createInspection(data))
                .then(() => {
                    closeNewLine!();
                }).catch(() => {
                    toast.error('Die Inspektion konnte nicht erstellt werden. Bitte versuchen Sie es erneut.')
                });
        }
    }
    function handleDelete() {
        if (!inspection) return;
        mutate(
            deleteInspection(inspection?.id)
        ).catch(() => {
            toast.error('Die Inspektion konnte nicht gelöscht werden');
        });
    }

    function handleStart() {
        if (!inspection) return;

        if (inspectionList?.find(i => i.timeStart && !i.timeEnd)) {
            return modal?.simpleErrorModal({
                header: 'Alte Kontrolle akiv',
                message: 'Es ist noch eine alte Uniformkontrolle aktiv. Bitte Beenden Sie zuerst die Alte Kontrolle bevor sie eine neue Starten!',
            });
        }

        startInspection()
            .then(() => mutate())
            .catch(() => toast.error('Die Kontrolle konnte nicht gestartet werden.'));
    }

    function handleFinish() {
        if (!inspection) return;

        modal?.simpleFormModal({
            header: 'Uniformkontrolle Beenden',
            elementLabel: 'Endzeit:',
            elementValidation: {},
            defaultValue: {
                input: dayjs().isSame(inspection?.date, "day") ? dayjs().format('HH:mm') : ''
            },
            type: "time",
            async save({ input }) {
                closeInspection({
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
                    <InspectionBadge inspection={inspection}/>
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
                                        return "Der Name ist bereits vergeben"
                                }
                            })} />
                    }
                    <ErrorMessage error={formState.errors.name?.message} testId="err_name" />
                    {nameDuplicationError &&
                        <div className="fs-7 text-danger" data-testid="err_name_duplication">
                            Der Name ist bereits vergeben.
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



function DeragistrationCol({ inspection, openDeregistrationModal }: { inspection: PlannedInspectionType, openDeregistrationModal: () => void }) {

    return (
        <OverlayTrigger
            placement="bottom-start"
            delay={{ show: 1000, hide: 150 }}
            overlay={
                <span className="bg-white p-2 border border-1 border-gray">
                    {inspection.deregistrations.map(c => <React.Fragment key={c.fk_cadet}>{c.cadet.firstname} {c.cadet.lastname} <br /></React.Fragment>)}
                </span>
            }
        >
            <Col>
                <a className="link-opacity-100 text-primary link-opacity-25-hover" onClick={openDeregistrationModal}>
                    {inspection.deregistrations.length} VK
                </a>
            </Col>
        </OverlayTrigger>
    )
}


type ButtonColumnPropType = {
    handleCancel: () => void;
    handleEdit: () => void;
    handleDelete: () => void;
    handleStart: () => void;
    handleFinish: () => void;
    editable: boolean;
    inspection: PlannedInspectionType | null;
    nameDuplicationError: boolean
};
function ButtonColumn({ editable, inspection, nameDuplicationError, handleCancel, handleEdit, handleDelete, handleStart, handleFinish }: ButtonColumnPropType) {
    if (editable || !inspection) {
        return (
            <Col>
                <Button type="submit" variant="outline-primary" className="mx-2" disabled={nameDuplicationError}>
                    Speichern
                </Button>
                <Button type="button" variant="outline-danger" onClick={handleCancel}>
                    Abbrechen
                </Button>
            </Col>
        );
    }

    const isToday = dayjs().isSame(inspection.date, "day");
    if (inspection.timeStart) {
        if (inspection.timeEnd) {
            return (
                <Col>
                    <Button data-testid="btn_restart">Wieder Starten</Button>
                </Col>
            );
        } else {
            return (
                <Col>
                    <Button variant={isToday ? "success" : "warning"} size="sm" data-testid="btn_complete" onClick={handleFinish}>Kontrolle Beenden</Button>
                </Col>
            );
        }
    }
    return (
        <Col>
            <TooltipActionButton variantKey="edit" onClick={handleEdit} />
            <TooltipActionButton variantKey="delete" onClick={handleDelete} />
            {isToday &&
                <TooltipActionButton variantKey="startInspection" onClick={handleStart} iconClass="fs-6" />
            }
        </Col>
    )
}
