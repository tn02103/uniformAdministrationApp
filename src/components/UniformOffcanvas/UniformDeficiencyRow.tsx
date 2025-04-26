import { getUniformItemDeficiencies } from "@/dal/uniform/item/_index"
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDate } from "date-fns";
import { useState } from "react";
import { Badge, Button, Card, Col, Form, FormControl, Row } from "react-bootstrap";
import useSWR from "swr";
import styles from "./UniformDeficiencyRow.module.css";
import { LabelIconButton } from "../Buttons/LabelIconButton";
import { TooltipActionButton } from "../Buttons/TooltipIconButton";
import { Deficiency } from "@/types/deficiencyTypes";
import { TextareaFormField } from "../fields/TextareaFormField";
import { useForm } from "react-hook-form";

export const UniformDeficiencyRow = ({ uniformId }: { uniformId: string }) => {
    const [showResolved, setShowResolved] = useState(false);



    const { data: deficiencies } = useSWR(
        `uniform.${uniformId}.deficiencies.${JSON.stringify(showResolved)}`,
        () => getUniformItemDeficiencies({ uniformId, includeResolved: showResolved }),
    );

    console.log(deficiencies, showResolved, JSON.stringify(showResolved));

    return (
        <>
            <Row className="m-0 mb-2">
                <Col>
                    <LabelIconButton
                        variantKey="create"
                        className="mb-2 border-0"
                        onClick={() => { }}
                    />
                </Col>
            </Row>
            <Row className="m-0 mb-2 justify-content-end">
                <Col xs="auto" className="text-end">
                    <Form.Switch
                        onChange={(e) => setShowResolved(e.target.checked)}
                        label="gelöste Mängel anzeigen"
                    />
                </Col>
            </Row>
            <Row className="m-0">
                {deficiencies?.map((deficiency) => (
                    <DeficiencyCard
                        deficiency={deficiency}
                        key={deficiency.id}
                    />
                ))}
            </Row>
        </>
    )
}

type DeficiencyCardProps = {
    deficiency: Deficiency;
}
const DeficiencyCard = ({ deficiency }: DeficiencyCardProps) => {
    const form = useForm({
        mode: "onTouched",
        defaultValues: {
            comment: deficiency.comment,
        },
    })
    const [editable, setEditable] = useState(false);

    const handleSave = (data: { comment: string }) => {
        

    }
    return (
        <Card className={`m-1 p-0 ${deficiency.dateResolved ? "text-secondary" : ""}`}>
            <Card.Body className="position-relative">
                <Card.Title className="fs-6 fw-bold">{deficiency.typeName} {deficiency.dateResolved && <Badge bg="success" className="ms-2">Gelöst</Badge>}</Card.Title>
                <div className="position-absolute top-0 end-0">
                    {!editable && (
                        <TooltipActionButton
                            variantKey="edit"
                            onClick={() => {
                                form.reset({ comment: deficiency.comment });
                                setEditable(true);
                            }} />
                    )}
                </div>
                {editable ? (
                    <form onSubmit={form.handleSubmit(handleSave)} noValidate autoComplete="off" className="mb-4">
                        <FormControl
                            as="textarea"
                            rows={2}
                            placeholder="Kommentar"
                            className="mb-2"
                            {...form.register('comment')} />
                        <Row>
                            <Col xs="auto" className="text-end">
                                <Button
                                    variant="outline-secondary"
                                    type="button"
                                    onClick={() => setEditable(false)}
                                >
                                    Abbrechen
                                </Button>
                            </Col>
                            <Col xs="auto" className="text-end">
                                <Button
                                    variant="outline-primary"
                                    type="submit"
                                    onClick={() => { }}
                                >
                                    Speichern
                                </Button>
                            </Col>
                        </Row>
                    </form>
                ) : (
                    <Card.Text>
                        {deficiency.comment}
                    </Card.Text>
                )}
                <ExpandableArea>
                    <Col xs={6}>
                        <div className="fw-bold">Erstellt am:</div>
                        {formatDate(deficiency.dateCreated!, "dd.MM.yyyy")}
                    </Col>
                    <Col xs={6} className="mb-2">
                        <div className="fw-bold">Erstellt von:</div>
                        <div>{deficiency.userCreated}</div>
                    </Col>
                    <Col xs={6}>
                        <div className="fw-bold">Zuletzt bearbeitet am:</div>
                        {deficiency.dateUpdated && formatDate(deficiency.dateUpdated, "dd.MM.yyyy")}
                    </Col>
                    <Col xs={6} className="mb-2">
                        <div className="fw-bold">Zuletzt bearbeitet von:</div>
                        <div>{deficiency.userUpdated}</div>
                    </Col>
                    {deficiency.dateResolved && (
                        <>
                            <Col xs={6}>
                                <div className="fw-bold">Behoben am:</div>
                                {formatDate(deficiency.dateResolved, "dd.MM.yyyy")}
                            </Col>
                            <Col xs={6} className="mb-2">
                                <div className="fw-bold">Behoben von:</div>
                                <div>{deficiency.userResolved}</div>
                            </Col>
                        </>
                    )}
                </ExpandableArea>
            </Card.Body>
        </Card >
    );
}

const ExpandableArea = ({ children }: { children: React.ReactNode }) => {

    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <Row style={{ height: "2rem" }} className="align-items-center justify-content-center">
                <div className="position-relative">
                    <hr className="" />
                    <div
                        className="w-auto bg-white align-center position-absolute top-50 start-50 translate-middle"
                    >
                        <Button
                            size="sm"
                            variant="light"
                            className="border-0"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <FontAwesomeIcon icon={faChevronDown} className={"text-dark me-2 " + (expanded && styles.open)} />
                            {expanded ? "Weniger Anzeigen" : "Mehr Anzeigen"}
                        </Button>
                    </div>
                </div>
            </Row>
            {expanded && (
                <Row>
                    {children}
                </Row>
            )}
        </>
    )
}
