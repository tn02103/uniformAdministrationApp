"use client";

import { createCadet, getCadetData, getCadetLastInspectionDate, saveCadetData } from "@/actions/cadet/data";
import { useGlobalData } from "@/components/globalDataProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n } from "@/lib/locales/client";
import { Cadet } from "@/types/globalCadetTypes";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dayjs from "@/lib/dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useSWR from "swr";

const defaultValue: Cadet = {
    id: "",
    lastname: "",
    firstname: "",
    active: true,
    comment: "",
}

type PropType = {
    initialData?: Cadet;
}
const CadetDataTableForm = ({ initialData }: PropType) => {
    const { register, watch, handleSubmit, formState: { errors }, reset } = useForm<Cadet>({ defaultValues: initialData })
    const t = useI18n();
    const router = useRouter();

    const { userRole } = useGlobalData();
    const { cadetId, locale }: { cadetId: string, locale: string } = useParams();
    const [submitting, setSubmitting] = useState(false);
    const [editable, setEditable] = useState(!initialData);
    const { data: lastInspectionDate } = useSWR(
        `cadet/inspection/lastInspection`,
        (!initialData || userRole < AuthRole.inspector)
            ? null : () => getCadetLastInspectionDate(cadetId).catch(),
    )

    // handle cadetIdChange
    useEffect(() => {
        if (!initialData) {
            reset(defaultValue);
            setEditable(true);
        } else {
            reset(initialData);
            setEditable(false);
        }
    }, [cadetId, initialData, reset]);

    async function updateCadet(data: Cadet) {
        setSubmitting(true);

        if (!initialData) {
            await createCadet(data).then((result) => {
                router.push(`/${locale}/app/cadet/${result.id}`)
            }).catch(error => {
                console.error(error);
                toast.error(t('common.error.actions.save'));
                setSubmitting(false);
            });
        } else {
            await saveCadetData(data).then((result) => {
                reset(result);
                setEditable(false);
            }).catch(error => {
                console.error(error);
                toast.error(t('common.error.actions.save'));
            }).finally(() => {
                setSubmitting(false);
            });
        }
    }

    async function changeEditable() {
        if (editable) {
            if (!initialData) {
                router.back();
            } else {
                setEditable(false);
                reset(await getCadetData(cadetId));
            }
        } else {
            reset(await getCadetData(cadetId));
            setEditable(true);
        }
    }

    return (
        <div data-testid="div_personalData" className="container border border-2 rounded">
            <div className="fs-5 fw-bold p-0 row">
                <Col xs={2}></Col>
                <Col data-testid="div_header" xs={7} className="text-center p-0">
                    {t('cadetDetailPage.header.cadetTable')}
                </Col>
                <Col xs={2}>
                    {(!editable && userRole >= AuthRole.inspector) &&
                        <Button
                            data-testid="btn_edit"
                            size="sm"
                            variant="outline-primary"
                            className="d-inline-block float-right border-0"
                            onClick={changeEditable}>
                            <FontAwesomeIcon icon={faPenToSquare} />
                        </Button>
                    }
                </Col>
            </div>
            <div className="bg-white border-top border-1 border-dark p-2 row">
                <Form onSubmit={handleSubmit(updateCadet)}>
                    <Row>
                        <Col xs={editable ? 12 : 6}
                            sm={editable ? 6 : 4}
                            lg={4}
                            xl={editable ? 12 : 6}>
                            <Row>
                                <p className="fs-8 fw-bold fst-italic m-0">{t('common.cadet.lastname')}:</p>
                            </Row>
                            <Row>
                                <Col className="pb-2">
                                    <Form.Control
                                        isInvalid={!!errors.lastname}
                                        className={editable ? "" : " text-truncate"}
                                        disabled={!editable}
                                        plaintext={!editable}
                                        {...register(
                                            "lastname",
                                            {
                                                required: {
                                                    value: true,
                                                    message: t('common.error.string.required'),
                                                },
                                                pattern: {
                                                    value: /^[\w \xC0-\xFF]+$/,
                                                    message: t('common.error.string.noSpecialChars'),
                                                },
                                                maxLength: {
                                                    value: 20,
                                                    message: t('common.error.string.maxLength', { value: 20 }),
                                                }
                                            }
                                        )} />
                                    <p data-testid="err_lastname" className="text-danger fs-7">
                                        {errors.lastname?.message}
                                    </p>
                                </Col>
                            </Row>
                        </Col>
                        <Col xs={editable ? 12 : 6}
                            sm={editable ? 6 : 4}
                            lg={4}
                            xl={editable ? 12 : 6}>
                            <Row>
                                <p className="fs-8 fw-bold fst-italic m-0">{t('common.cadet.firstname')}:</p>
                            </Row>
                            <Row>
                                <Col className="pb-2">
                                    <Form.Control
                                        type="text"
                                        isInvalid={!!errors.firstname}
                                        className={editable ? "" : " text-truncate"}
                                        disabled={!editable}
                                        plaintext={!editable}
                                        {...register(
                                            "firstname",
                                            {
                                                required: {
                                                    value: true,
                                                    message: t('common.error.string.required'),
                                                },
                                                pattern: {
                                                    value: /^[\w \xC0-\xFF]+$/,
                                                    message: t('common.error.string.noSpecialChars'),
                                                },
                                                maxLength: {
                                                    value: 20,
                                                    message: t('common.error.string.maxLength', { value: 20 }),
                                                }
                                            }
                                        )} />
                                    <div data-testid="err_firstname" className="text-danger fs-7">
                                        {errors.firstname?.message}
                                    </div>
                                </Col>
                            </Row >
                        </Col >
                        <Col xs={editable ? 12 : 6}
                            sm={editable ? 6 : 4}
                            lg={4}
                            xl={editable ? 12 : 6}>
                            <Row>
                                <p className="fs-8 fw-bold fst-italic m-0">{t('common.cadet.status')}:</p>
                            </Row>
                            <Row>
                                <Col data-testid="div_active" className="pb-2">
                                    {editable
                                        ? <Form.Check
                                            type="switch"
                                            label={t(`common.active.${watch("active") ? "true" : "false"}`)}
                                            {...register("active")} />
                                        : t(`common.active.${watch("active") ? "true" : "false"}`)}
                                </Col >
                            </Row >
                        </Col >
                        {(userRole >= AuthRole.inspector) && (!!initialData) &&
                            <Col>
                                <Row>
                                    <p className="fs-8 fw-bold fst-italic m-0">{t('common.cadet.lastInspection')}</p>
                                </Row>
                                <Row>
                                    <Col data-testid="div_lastInspection" className="pb-2">
                                        {lastInspectionDate?.date
                                            ? dayjs(lastInspectionDate.date).format("DD.MM.YYYY")
                                            : t('common.cadet.notInspected')}
                                    </Col>
                                </Row>
                            </Col>
                        }
                        {
                            (userRole >= AuthRole.inspector) &&
                            <Col xs={12}>
                                <Row>
                                    <p className="fs-8 fw-bold fst-italic m-0">{t('common.comment')}:</p>
                                </Row>
                                <Row>
                                    <Col className="pb-2 text-wrap">
                                        <Form.Control
                                            as="textarea"
                                            rows={5}
                                            disabled={!editable}
                                            plaintext={!editable}
                                            {...register("comment")} />
                                    </Col>
                                </Row>
                            </Col>
                        }
                        {
                            editable &&
                            <>
                                <Col xs={"auto"} xl={6}>
                                    <Button data-testid="btn_cancel" variant="outline-danger" onClick={changeEditable}>
                                        {t('common.actions.cancel')}
                                    </Button>
                                </Col >
                                <Col xs={"auto"} xl={6}>
                                    <Button
                                        data-testid="btn_save"
                                        disabled={submitting}
                                        variant="outline-primary"
                                        type="submit"
                                    >
                                        {(cadetId === "new") ? t('common.actions.create') : t('common.actions.save')}
                                    </Button>
                                </Col>
                            </>
                        }
                    </Row>
                </Form>
            </div>
        </div>
    )
}

export default CadetDataTableForm;
