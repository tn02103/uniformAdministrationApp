"use client"

import { PlannedInspectionType } from "@/actions/controllers/InspectionController"
import { TooltipActionButton } from "@/components/TooltipIconButton"
import { faCalendar } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import moment from "moment"
import { ReactNode, useEffect, useRef, useState } from "react"
import { Badge, Button, Col, FormControl, OverlayTrigger, Row } from "react-bootstrap"
import { Controller, useForm } from "react-hook-form"

import Calendar from 'react-calendar'


export default function PlannedInspectionTableRow({
    inspection,
    closeNewLine,
}: {
    inspection: PlannedInspectionType | null;
    closeNewLine?: () => void;
}) {
    const { register, handleSubmit, control, reset } = useForm<{name: string}>();
    const [editable, setEditable] = useState(!inspection);


    function handleEdit() {
        reset(inspection);
    }
    function handleCancel() {
        if (inspection) {
            setEditable(false);
        } else {
            closeNewLine!();
        }
    }

    return (
        <form>
            <Row className="bg-white p-2 border-buttom border-1">
                {(!editable && inspection) &&
                    <Col>
                        {moment().isSame(inspection?.date, "day") && inspection?.timeStart &&
                            <Badge bg="success">Aktiv</Badge>
                        }
                    </Col>
                }
                <Col> {(!editable && inspection)
                    ? moment(inspection.date).format("dd.MM.yyyy")
                    : <div>
                        <Controller
                            name="date"
                            control={control}
                            render={({ field: { onChange, value } }) =>
                                <DatePicker onChange={onChange} value={value} />
                            }
                        />
                    </div>
                }
                </Col>
                <Col>
                    {(!editable && inspection)
                        ? inspection.name
                        : <FormControl />
                    }
                </Col>
                {(!editable && inspection) &&
                    <DeragistrationCol inspection={inspection} />
                }
                {(!editable && inspection)
                    ? <Col>
                        <TooltipActionButton variantKey="edit" onClick={() => { }} />
                        <TooltipActionButton variantKey="delete" onClick={() => { }} />
                    </Col>
                    : <Col>
                        <Button type="submit" variant="outline-primary" className="mx-2">
                            Speichern
                        </Button>
                        <Button type="button" variant="outline-danger" onClick={() => setEditable(false)}>
                            Abbrechen
                        </Button>
                    </Col>
                }
            </Row>
        </form>
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

function DatePicker({ onChange, value }: any) {
    const [showCalendar, setShowCalendar] = useState(false);
    const refCalendar = useRef();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            console.log(refCalendar);
            if (refCalendar.current && !(refCalendar.current as any).contains(e.target)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
        }
    });

    return (
        <div className="position-relativ">
            <div className="input-group flex">
                <input type="string" name={"date"} className="form-control" onChange={onChange} value={moment(value).format('DD.MM.yyyy')} />
                <button type="button" className="input-group-text" onClick={() => setShowCalendar(prev => !prev)}>
                    <FontAwesomeIcon icon={faCalendar} />
                </button>
            </div>
            <div style={{ display: "contents" }} >
                <div className="position-absolute" ref={refCalendar as any} >
                    {showCalendar &&
                        <Calendar
                            minDate={new Date()}
                            onChange={(v, e) => { setShowCalendar(false); onChange(v, e) }}
                            value={value} />
                    }
                </div>
            </div>
        </div>
    )
}
