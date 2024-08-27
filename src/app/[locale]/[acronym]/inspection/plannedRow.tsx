"use client"

import { closeInspection, startInspection } from "@/actions/controllers/InspectionController";
import { createInspection, deleteInspection, PlannedInspectionType, updatePlannedInspection } from "@/actions/controllers/PlannedInspectionController";
import ErrorMessage from "@/components/errorMessage";
import { useModal } from "@/components/modals/modalProvider";
import { TooltipActionButton } from "@/components/TooltipIconButton";
import { usePlannedInspectionList } from "@/dataFetcher/inspection";
import { PlannedInspectionFormShema, plannedInspectionFormShema } from "@/zod/inspection";
import { faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import moment from 'moment/min/moment-with-locales';
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Col, FormControl, OverlayTrigger, Row } from "react-bootstrap";
import Calendar from 'react-calendar';
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";


export default function PlannedInspectionTableRow({
    inspection,
    closeNewLine,
}: {
    inspection: PlannedInspectionType | null;
    closeNewLine?: () => void;
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
                input: moment().isSame(inspection?.date, "day") ? moment().format('HH:mm') : ''
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
        <form onSubmit={handleSubmit(handleSave, (e) => console.log(e))}>
            <Row className="bg-white p-2 border-buttom border-1" data-testid={`div_inspection_${inspection?.id ?? "new"}`}>
                <Col xs={2}>
                    <InspectionBadge inspection={inspection} handleStart={handleStart} />
                </Col>
                <Col> {(!editable && inspection)
                    ? <span data-testid="div_date">{moment(inspection.date).locale('de').format("dd DD.MM.yyyy")}</span>
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
                    <DeragistrationCol inspection={inspection} />
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


function InspectionBadge({ inspection, handleStart }: { inspection: PlannedInspectionType | null, handleStart: () => void }) {
    if (!inspection) {
        return <Badge pill bg="success" data-testid="lbl_new">Neu</Badge>
    }

    if (inspection.timeStart) {
        if (inspection.timeEnd) {
            return <Badge pill bg="success" data-testid="lbl_completed">Abgeschlossen</Badge>
        }
        if (moment().isSame(inspection?.date, "day")) {
            return <Badge pill bg="success" data-testid="lbl_active">Aktiv</Badge>
        } else {
            return <Badge pill bg="warning" data-testid="lbl_notCompleted">Nicht abgeschlossen</Badge>
        }
    } else if (moment().isAfter(inspection?.date, "day")) {
        return <Badge pill bg="danger" data-testid="lbl_expired">Abgelaufen</Badge>
    }
    /*if (moment().isSame(inspection.date, "day")) {
        return (
            <Button size="sm" className="rounded" variant="outline-primary" onClick={handleStart}>
                Starten
            </Button>
        );
    }*/

    return (
        <Badge pill bg="secondary" data-testid="lbl_planned">Geplannt</Badge>
    )
}

function DeragistrationCol({ inspection }: { inspection: PlannedInspectionType }) {

    return (
        <OverlayTrigger
            placement="bottom-start"
            delay={{ show: 1000, hide: 150 }}
            overlay={
                <span className="bg-white p-2 border border-1 border-gray">
                    Dario Meysing<br />Joline Becker<br />Jan Wieger<br />Lars Wieger
                </span>
            }
        >
            <Col>
                <a className="link-opacity-100 text-primary link-opacity-25-hover" onClick={() => { console.log("test") }}>
                    12 VK
                </a>
            </Col>
        </OverlayTrigger>
    )
}

function DatePicker({ onChange, value, error }: { onChange: any, value: string | Date, error?: string }) {
    const [showCalendar, setShowCalendar] = useState(false);
    const refCalendar = useRef();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (refCalendar.current && !(refCalendar.current as any).contains(e.target)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        }
    });

    function handleOnChangeCalendar(value: any, event: React.MouseEvent) {
        setShowCalendar(false);
        const date = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
        onChange(moment.utc(date).toDate());
    }
    function handleInputOnChange(val: any) {
        if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(val)) {
            const mom = moment.utc(val, ["DD.MM.yyyy", "D.M.yyyy",], true);
            if (mom.isValid()) {
                return onChange(mom.toDate());
            }
        }
        return onChange(val);
    }

    return (
        <div className="position-relativ">
            <div className="input-group flex">
                <input
                    type="string"
                    name={"date"}
                    className={`form-control ${error ? "isInvaild" : ""}`}
                    onChange={(e) => handleInputOnChange(e.target.value)}
                    value={(typeof value === "string") ? value : moment(value).format('DD.MM.yyyy')}
                />
                <button type="button" className="input-group-text" onClick={() => setShowCalendar(prev => !prev)}>
                    <FontAwesomeIcon icon={faCalendar} />
                </button>
            </div>
            {error &&
                <div className="text-danger fs-7">
                    {error}
                </div>
            }
            <div style={{ display: "contents" }} >
                <div className="position-absolute" ref={refCalendar as any} >
                    {showCalendar &&
                        <Calendar
                            minDate={moment().toDate()}
                            onChange={handleOnChangeCalendar}
                            value={value} />
                    }
                </div>
            </div>
        </div>
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

    const isToday = moment().isSame(inspection.date, "day");
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