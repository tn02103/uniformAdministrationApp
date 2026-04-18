import { TextareaFormField } from "@/components/fields/TextareaFormField";
import { InputFormField } from "@/components/fields/InputFormField";
import { resolveDeficiency, updateDeficiency } from "@/dal/inspection/deficiency";
import { swrKeys } from "@/dataFetcher/swrKeys";
import dayjs from "@/lib/dayjs";
import { useScopedI18n } from "@/lib/locales/client";
import { CadetDeficiency, Deficiency } from "@/types/deficiencyTypes";
import { updateDeficiencySchema, UpdateDeficiencyInput, CadetInspectionFormSchema } from "@/zod/deficiency";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { mutate } from "swr";

/**
 * Displays a single unresolved deficiency row.
 *
 * In step 0 without an active inspection, shows inline Edit and Resolve actions.
 * In step 1, shows the resolve toggle switch.
 * In step 2, shows a compact read-only summary.
 *
 * @param inspectionActive - When false (and step === 0), enables standalone edit/resolve actions.
 */
export function OldDeficiencyRow({
    index,
    step,
    deficiency,
    inspectionActive,
}: {
    index: number;
    step: number;
    deficiency: Deficiency;
    inspectionActive?: boolean;
}) {
    const tDef = useScopedI18n('common.deficiency');
    const tCom = useScopedI18n('common');
    const tInspection = useScopedI18n('cadetDetailPage.inspection');

    const checked = useWatch({ name: `oldDeficiencyList.${index}.resolved` });
    const { register } = useFormContext<CadetInspectionFormSchema>();

    const [showEditForm, setShowEditForm] = useState(false);
    const { cadetId } = useParams<{ cadetId: string }>();

    const isUniformLinked = !!(deficiency as CadetDeficiency).fk_uniform;

    const editForm = useForm<UpdateDeficiencyInput>({
        resolver: zodResolver(updateDeficiencySchema),
        defaultValues: {
            description: deficiency.description,
            comment: deficiency.comment,
        },
    });

    const handleSaveEdit = async (data: UpdateDeficiencyInput) => {
        try {
            await updateDeficiency({ id: deficiency.id!, data });
            await mutate(swrKeys.unresolvedDeficienciesByCadet(cadetId));
            setShowEditForm(false);
            toast.success(tInspection('message.deficiencyUpdated'));
        } catch {
            toast.error(tCom('error.actions.save'));
        }
    };

    const handleResolve = async () => {
        try {
            await resolveDeficiency(deficiency.id!);
            await mutate(swrKeys.unresolvedDeficienciesByCadet(cadetId));
            toast.success(tInspection('message.deficiencyResolved'));
        } catch {
            toast.error(tCom('error.actions.save'));
        }
    };

    return (
        <Row
            className={`p-1 m-0 border-bottom border-1 ${(step == 2) ? "py-1" : "py-3"}`}
            key={`oldDefRow-${deficiency.id}`}
            data-testid={`div_olddef_${deficiency.id}`}
        >
            {(step == 1) &&
                <Col xs={12}
                    xl={12}
                    className={"justify-content-center"}
                >
                    <Form.Check
                        type="switch"
                        id={`chk_resolved_${index}`}
                        label={checked ? tDef('resolved.true') : tDef('resolved.false')}
                        {...register(`oldDeficiencyList.${index}.resolved`)}
                        data-testid={`chk_resolved`}
                        className={checked ? "text-success" : "text-danger"}
                    />
                </Col>
            }
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic align-bottom">
                        {tCom('description')}
                    </Col>
                </Row>
                <Row className="align-top">
                    <Col data-testid={`div_description`} className="align-text-top">
                        {deficiency.description}
                    </Col>
                </Row>
            </Col>
            <Col xs={6} sm={4} className="pt-1">
                <Row>
                    <Col className="fs-8 fw-bold fst-italic">
                        {tCom('type')}
                    </Col>
                </Row>
                <Row>
                    <Col data-testid={`div_type`}>
                        {deficiency.typeName}
                    </Col>
                </Row>
            </Col>
            {(step < 2) &&
                <Col xs={6} sm={4} className="pt-1">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('dates.created')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid={`div_created`}>
                            {dayjs(deficiency.dateCreated).format('DD.MM.YYYY')}
                        </Col>
                    </Row>
                </Col>
            }
            {(step < 2) &&
                <Col xs={"12"} className="pt-2">
                    <Row>
                        <Col className="fs-8 fw-bold fst-italic">
                            {tCom('comment')}
                        </Col>
                    </Row>
                    <Row>
                        <Col data-testid={`div_comment`}>
                            {deficiency.comment}
                        </Col>
                    </Row>
                </Col>
            }
            {(step === 0 && !inspectionActive) && (
                <Col xs={12} className="pt-2">
                    <div className="d-flex gap-2 mb-2">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            data-testid={`btn_edit_${deficiency.id}`}
                            onClick={() => setShowEditForm((v) => !v)}
                        >
                            {tCom('actions.edit')}
                        </Button>
                        <Button
                            variant="outline-warning"
                            size="sm"
                            data-testid={`btn_resolve_${deficiency.id}`}
                            onClick={handleResolve}
                        >
                            {tCom('actions.resolve')}
                        </Button>
                    </div>
                    {showEditForm && (
                        <FormProvider {...editForm}>
                            <div className="border rounded p-2 bg-light">
                                {!isUniformLinked && (
                                    <InputFormField<UpdateDeficiencyInput>
                                        name="description"
                                        label={tCom('description')}
                                        maxLength={30}
                                        hookFormValidation
                                    />
                                )}
                                {isUniformLinked && (
                                    <div className="mb-2">
                                        <small className="text-muted fw-bold">{tCom('description')}</small>
                                        <p className="mb-0">{deficiency.description}</p>
                                    </div>
                                )}
                                <TextareaFormField<UpdateDeficiencyInput>
                                    name="comment"
                                    label={tCom('comment')}
                                    rows={2}
                                    maxLength={300}
                                    hookFormValidation
                                />
                                <div className="d-flex gap-2 mt-2">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        data-testid={`btn_save_edit_${deficiency.id}`}
                                        onClick={editForm.handleSubmit(handleSaveEdit)}
                                    >
                                        {tCom('actions.save')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        size="sm"
                                        data-testid={`btn_cancel_edit_${deficiency.id}`}
                                        onClick={() => setShowEditForm(false)}
                                    >
                                        {tCom('actions.cancel')}
                                    </Button>
                                </div>
                            </div>
                        </FormProvider>
                    )}
                </Col>
            )}
        </Row>
    );
}
