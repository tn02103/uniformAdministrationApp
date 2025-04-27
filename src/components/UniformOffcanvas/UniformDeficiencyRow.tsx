import { createUniformDeficiency, resolveDeficiency, updateUniformDeficiency } from "@/dal/inspection/deficiency";
import { useDeficienciesByUniformId, useDeficiencyTypes } from "@/dataFetcher/deficiency";
import { useI18n } from "@/lib/locales/client";
import { Deficiency } from "@/types/deficiencyTypes";
import { UpdateUniformDeficiencySchema, updateUniformDeficiencySchema } from "@/zod/deficiency";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDate } from "date-fns";
import { useState } from "react";
import { Badge, Button, Card, Col, Dropdown, Form, FormControl, FormSelect, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Arguments, mutate } from "swr";
import { LabelIconButton } from "../Buttons/LabelIconButton";
import { ExpandableArea } from "../ExpandableArea/ExpandableArea";

export const UniformDeficiencyRow = ({ uniformId }: { uniformId: string }) => {
    const t = useI18n();
    const [showResolved, setShowResolved] = useState(false);
    const [showCreateCard, setShowCreateCard] = useState(false);
    const { deficiencies } = useDeficienciesByUniformId(uniformId, showResolved);

    return (
        <>
            <Row className="m-0 mb-2">
                <Col>
                    <LabelIconButton
                        variantKey="create"
                        className="mb-2 border-0"
                        onClick={() => setShowCreateCard(true)}
                    />
                </Col>
                <Col xs="auto" className="text-end m-2">
                    <Form.Switch
                        onChange={(e) => setShowResolved(e.target.checked)}
                        label={t('uniformOffcanvas.deficiency.includeResolved')}
                    />
                </Col>
            </Row>
            <Row className="m-0" role="list" aria-label="Deficiency list">
                {showCreateCard && (
                    <DeficiencyCard
                        deficiency={null}
                        uniformId={uniformId}
                        hideCreateCard={() => setShowCreateCard(false)}
                    />
                )}
                {deficiencies?.map((deficiency) => (
                    <DeficiencyCard
                        key={deficiency.id}
                        deficiency={deficiency}
                        uniformId={uniformId}
                    />
                ))}
            </Row>
        </>
    )
}

type DeficiencyCardProps = {
    deficiency: Deficiency | null;
    uniformId: string;
    hideCreateCard?: () => void;
}
const DeficiencyCard = ({ deficiency, uniformId, hideCreateCard }: DeficiencyCardProps) => {
    const t = useI18n();
    const form = useForm<UpdateUniformDeficiencySchema>({
        mode: "onTouched",
        defaultValues: {
            comment: deficiency?.comment,
            typeId: deficiency?.typeId,
        },
        resolver: zodResolver(updateUniformDeficiencySchema),
    });

    const [editable, setEditable] = useState(!deficiency);
    const { deficiencyTypeList } = useDeficiencyTypes();
    const filteredTypes = deficiencyTypeList?.filter((type) => type.dependent === "uniform");

    const handleSave = (data: UpdateUniformDeficiencySchema) => {
        if (!deficiency) return handleCreate(data);
        updateUniformDeficiency({
            id: deficiency.id!,
            data: {
                comment: data.comment,
                typeId: data.typeId,
            },
        }).then(() => {
            mutate((key: Arguments) => (typeof key === "string") && key.startsWith("uniform." + uniformId + ".deficiencies."));
            setEditable(false);
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }
    const handleCreate = (data: UpdateUniformDeficiencySchema) => {
        createUniformDeficiency({
            uniformId,
            data
        }).then(() => {
            mutate((key: Arguments) => (typeof key === "string") && key.startsWith("uniform." + uniformId + ".deficiencies."));
            hideCreateCard?.();
        }).catch(() => {
            toast.error(t('common.error.actions.create'));
        });
    }

    const handleResolve = () => {
        if (!deficiency) return;
        resolveDeficiency(deficiency.id!).then(() => {
            mutate((key: Arguments) => (typeof key === "string") && key.startsWith("uniform." + uniformId + ".deficiencies."));
            setEditable(false);
        }).catch(() => {
            toast.error(t('common.error.unknown'));
        })
    }

    return (
        <Card role="listitem" aria-roledescription={deficiency ? deficiency.typeName : "new Deficiency"} className={`m-1 p-0 ${deficiency?.dateResolved ? "text-secondary" : ""}`}>
            <Card.Body className="position-relative">
                <form onSubmit={form.handleSubmit(handleSave)} noValidate autoComplete="off" className="mb-4">
                    {editable ?
                        <>
                            <Card.Title className="fs-6 fw-bold">
                                <FormSelect
                                    className="mb-2"
                                    {...form.register('typeId')}
                                    aria-label="Select deficiency type"
                                >
                                    {filteredTypes?.map((type) => (
                                        <option
                                            key={type.id}
                                            value={type.id}
                                        >
                                            {type.name}
                                        </option>
                                    ))}
                                </FormSelect>
                            </Card.Title>
                        </>
                        : <Card.Title className="fs-6 fw-bold">
                            {deficiency?.typeName} {deficiency?.dateResolved && <Badge bg="success" className="ms-2">Gelöst</Badge>}
                        </Card.Title>
                    }
                    {(!editable && deficiency) && (
                        <div className="position-absolute top-0 end-0">
                            <Dropdown drop="start">
                                <Dropdown.Toggle
                                    variant="outline-secondary"
                                    className="border-0"
                                    id={"Cadetdropdown"}
                                    aria-label="Deficiency actions menu"
                                >
                                    <FontAwesomeIcon icon={faEllipsisV} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {!deficiency.dateResolved &&
                                        <Dropdown.Item
                                            onClick={() => {
                                                form.reset({
                                                    typeId: deficiency.typeId,
                                                    comment: deficiency.comment,
                                                });
                                                setEditable(true);
                                            }}
                                            aria-label="Edit deficiency"
                                        >
                                            {t('common.actions.edit')}
                                        </Dropdown.Item>
                                    }
                                    {!deficiency.dateResolved &&
                                        <Dropdown.Item
                                            onClick={handleResolve}
                                            aria-label="Resolve deficiency"
                                        >
                                            {t('common.actions.resolve')}
                                        </Dropdown.Item>
                                    }
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    )}
                    {editable ? (
                        <>
                            <FormControl
                                as="textarea"
                                rows={2}
                                placeholder="Kommentar"
                                className="mb-2"
                                {...form.register('comment')}
                                aria-label="Deficiency comment"
                            />
                            <Row>
                                <Col xs="auto" className="text-end">
                                    <Button
                                        variant="outline-secondary"
                                        type="button"
                                        onClick={() => setEditable(false)}
                                        aria-label="Cancel editing"
                                    >
                                        {t('common.actions.cancel')}
                                    </Button>
                                </Col>
                                <Col xs="auto" className="text-end">
                                    <Button
                                        variant="outline-primary"
                                        type="submit"
                                        onClick={() => { }}
                                        aria-label={deficiency ? "Save deficiency changes" : "Create deficiency"}
                                    >
                                        {deficiency ? t('common.actions.save') : t('common.actions.create')}
                                    </Button>
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <Card.Text>
                            {deficiency?.comment}
                        </Card.Text>
                    )}
                    {deficiency &&
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
                    }
                </form>
            </Card.Body>
        </Card >
    );
}
export const exportForTesting = {
    DeficiencyCard
}
