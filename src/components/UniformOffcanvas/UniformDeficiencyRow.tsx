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
import { ExpandableDividerArea } from "../ExpandableArea/ExpandableArea";

export const UniformDeficiencyRow = ({ uniformId }: { uniformId: string }) => {
    const t = useI18n();
    const [showResolved, setShowResolved] = useState(false);
    const [showCreateCard, setShowCreateCard] = useState(false);
    const { deficiencies } = useDeficienciesByUniformId(uniformId, showResolved);

    return (
        <>
            <Row className="m-0 mb-2 justify-content-between">
                <Col xs="5" sm="auto">
                    <LabelIconButton
                        variantKey="create"
                        className="mb-2 border-0"
                        onClick={() => setShowCreateCard(true)}
                    />
                </Col>
                <Col xs="6" sm="auto" className="text-start m-2">
                    <Form.Switch
                        name="showResolved"
                        aria-label={t('uniformOffcanvas.deficiency.includeResolved')}
                        onChange={(e) => setShowResolved(e.target.checked)}
                        label={t('uniformOffcanvas.deficiency.includeResolved')}
                    />
                </Col>
            </Row>
            <Row className="m-0" role="list" aria-label="Deficiency list">
                {showCreateCard && (
                    <DeficiencyCard
                        index={-1}
                        deficiency={null}
                        uniformId={uniformId}
                        hideCreateCard={() => setShowCreateCard(false)}
                    />
                )}
                {deficiencies?.map((deficiency, index) => (
                    <DeficiencyCard
                        index={index}
                        key={deficiency.id}
                        deficiency={deficiency}
                        uniformId={uniformId}
                    />
                ))}
                {(!deficiencies || deficiencies?.length === 0) && (
                    <Col className="text-center text-secondary">
                        {t('uniformOffcanvas.deficiency.noDeficiencies')}
                    </Col>
                )}
            </Row>
        </>
    )
}

type DeficiencyCardProps = {
    index: number;
    deficiency: Deficiency | null;
    uniformId: string;
    hideCreateCard?: () => void;
}
const DeficiencyCard = ({ index, deficiency, uniformId, hideCreateCard }: DeficiencyCardProps) => {
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
    const cardLabel = deficiency ? t('uniformOffcanvas.deficiency.cardLabel', { index }) : t('uniformOffcanvas.deficiency.createCardLabel');

    const handleSave = async (data: UpdateUniformDeficiencySchema) => {
        if (!deficiency) return handleCreate(data);

        await updateUniformDeficiency({
            id: deficiency.id!,
            data: {
                comment: data.comment,
                typeId: data.typeId,
            },
        }).then(async () => {
            setEditable(false);
            await mutate((key: Arguments) => (typeof key === "string") && key.startsWith("uniform." + uniformId + ".deficiencies."));
        }).catch(() => {
            toast.error(t('common.error.actions.save'));
        });
    }
    const handleCreate = async (data: UpdateUniformDeficiencySchema) => {
        await createUniformDeficiency({
            uniformId,
            data
        }).then(async () => {
            hideCreateCard?.();
            await mutate((key: Arguments) => (typeof key === "string") && key.startsWith("uniform." + uniformId + ".deficiencies."));
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
        <Card role="listitem"
            aria-label={cardLabel}
            className={`m-1 p-0 ${deficiency?.dateResolved ? "text-secondary" : ""}`}
        >
            <Card.Body className="position-relative">
                <form onSubmit={form.handleSubmit(handleSave)} noValidate autoComplete="off" className="mb-4">
                    {editable ?
                        <>
                            <Card.Title className="fs-6 fw-bold">
                                <FormSelect
                                    className="mb-2"
                                    {...form.register('typeId')}
                                    aria-label={t('uniformOffcanvas.deficiency.label.deficiencyType')}
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
                        : <Card.Title className="fs-6 fw-bold"  aria-label={t('uniformOffcanvas.deficiency.label.deficiencyType')}>
                            {deficiency?.typeName} {deficiency?.dateResolved && <Badge bg="success" className="ms-2">Gelöst</Badge>}
                        </Card.Title>
                    }
                    {(!editable && deficiency && !deficiency.dateResolved) && (
                        <div className="position-absolute top-0 end-0">
                            <Dropdown drop="start">
                                <Dropdown.Toggle
                                    variant="outline-secondary"
                                    className="border-0"
                                    id={"Cadetdropdown"}
                                    aria-label={t('uniformOffcanvas.deficiency.label.actions', { index })}
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
                                        >
                                            {t('common.actions.edit')}
                                        </Dropdown.Item>
                                    }
                                    {!deficiency.dateResolved &&
                                        <Dropdown.Item
                                            onClick={handleResolve}
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
                                aria-label={t('uniformOffcanvas.deficiency.label.comment')}
                                {...form.register('comment')}
                            />
                            <Row>
                                <Col xs="auto" className="text-end">
                                    <Button
                                        variant="outline-secondary"
                                        type="button"
                                        onClick={() => deficiency ? setEditable(false) : hideCreateCard?.()}
                                    >
                                        {t('common.actions.cancel')}
                                    </Button>
                                </Col>
                                <Col xs="auto" className="text-end">
                                    <Button
                                        variant="outline-primary"
                                        type="submit"
                                        onClick={() => { }}
                                    >
                                        {deficiency ? t('common.actions.save') : t('common.actions.create')}
                                    </Button>
                                </Col>
                            </Row>
                        </>
                    ) : (
                        <Card.Text aria-label={t('uniformOffcanvas.deficiency.label.comment')}>
                            {deficiency?.comment}
                        </Card.Text>
                    )}
                    {deficiency &&
                        <ExpandableDividerArea>
                            <Col xs={6} className="mt-2">
                                <div className="fw-bold" id={`def-${deficiency.id}-dateCreated`}>
                                    {t('uniformOffcanvas.deficiency.label.date.created')}
                                </div>
                                <div aria-labelledby={`def-${deficiency.id}-dateCreated`}>
                                    {formatDate(deficiency.dateCreated!, "dd.MM.yyyy")}
                                </div>
                            </Col>
                            <Col xs={6} className="mt-2">
                                <div className="fw-bold" id={`def-${deficiency.id}-userCreated`}>
                                    {t('uniformOffcanvas.deficiency.label.user.created')}
                                </div>
                                <div aria-labelledby={`def-${deficiency.id}-userCreated`}>
                                    {deficiency.userCreated}</div>
                            </Col>
                            <Col xs={6} className="mt-2">
                                <div className="fw-bold" id={`def-${deficiency.id}-dateUpdated`}>
                                    {t('uniformOffcanvas.deficiency.label.date.updated')}
                                </div>
                                <div aria-labelledby={`def-${deficiency.id}-dateUpdated`}>
                                    {deficiency.dateUpdated && formatDate(deficiency.dateUpdated, "dd.MM.yyyy")}
                                </div>
                            </Col>
                            <Col xs={6} className="mt-2">
                                <div className="fw-bold" id={`def-${deficiency.id}-userUpdated`}>
                                    {t('uniformOffcanvas.deficiency.label.user.updated')}
                                </div>
                                <div aria-labelledby={`def-${deficiency.id}-userUpdated`}>
                                    {deficiency.userUpdated}
                                </div>
                            </Col>
                            {deficiency.dateResolved && (
                                <>
                                    <Col xs={6} className="mt-2">
                                        <div className="fw-bold" id={`def-${deficiency.id}-dateResolved`}>
                                            {t('uniformOffcanvas.deficiency.label.date.resolved')}
                                        </div>
                                        <div aria-labelledby={`def-${deficiency.id}-dateResolved`}>
                                            {formatDate(deficiency.dateResolved, "dd.MM.yyyy")}
                                        </div>
                                    </Col>
                                    <Col xs={6} className="mt-2">
                                        <div className="fw-bold" id={`def-${deficiency.id}-userResolved`}>
                                            {t('uniformOffcanvas.deficiency.label.user.resolved')}
                                        </div>
                                        <div aria-labelledby={`def-${deficiency.id}-userResolved`}>
                                            {deficiency.userResolved}
                                        </div>
                                    </Col>
                                </>
                            )}
                        </ExpandableDividerArea>
                    }
                </form>
            </Card.Body>
        </Card >
    );
}
