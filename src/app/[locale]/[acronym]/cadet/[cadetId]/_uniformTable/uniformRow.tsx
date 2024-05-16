"use client"

import { returnUniformItem } from "@/actions/controllers/CadetUniformController";
import { saveUniformItem } from "@/actions/controllers/UniformController";
import TooltipIconButton from "@/components/TooltipIconButton";
import { useGlobalData } from "@/components/globalDataProvider";
import { useModal } from "@/components/modals/modalProvider";
import { AuthRole } from "@/lib/AuthRoles";
import { useI18n, useScopedI18n } from "@/lib/locales/client";
import { getUniformSizeList } from "@/lib/uniformHelper";
import { Uniform, UniformFormData, UniformSizeList, UniformType } from "@/types/globalUniformTypes";
import { faArrowUpRightFromSquare, faBars, faCheck, faPencil, faRightLeft, faRightToBracket, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Col, Dropdown, Form, FormControl, Row } from "react-bootstrap";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { useSWRConfig } from "swr";

type PropType = {
    uniform: Uniform;
    uniformType: UniformType;
    replaceItem: () => void;
}
const UniformRow = (props: PropType) => {
    const form = useForm<UniformFormData>();
    const { reset } = form
    const t = useI18n();
    const modalT = useScopedI18n('modals.messageModal.uniform')
    const modal = useModal();
    const { mutate } = useSWRConfig();

    const { cadetId, locale }: { cadetId: string; locale: string } = useParams();
    const { userRole } = useGlobalData();

    const { uniform, uniformType } = props;
    const [selected, setSelected] = useState<boolean>(false);
    const [editable, setEditable] = useState<boolean>(false);


    function editUniform() {
        reset({
            id: uniform.id,
            number: uniform.number,
            size: uniform.size?.id,
            generation: uniform.generation?.id,
            comment: uniform.comment ?? undefined,
            active: uniform.active,
        });
        setEditable(true);
    }

    function onLineClick(event: any) {
        if (editable) return;
        if (event.target.tagName !== "BUTTON"
            && event.target.parentNode?.tagName !== "BUTTON"
            && event.target.parentNode?.parentNode?.tagName !== "BUTTON") {
            setSelected(!selected);
        }
    }

    async function saveUniform(data: UniformFormData) {
        if (data.size === "") delete data.size;
        if (data.generation === "") delete data.generation;
        await saveUniformItem(data).then(async () => {
            setEditable(false);
            await mutate(`cadet.${cadetId}.uniform`)
        }).catch((e) => {
            console.error(e);
            toast.error(t('common.error.save.unknown'));
        });
    }

    function withdraw(uniform: Uniform) {
        const returnItem = () => mutate(
            `cadet.${cadetId}.uniform`,
            returnUniformItem(uniform.id, cadetId),
        ).catch((e) => {
            console.error(e);
            toast.error(t('cadetDetailPage.returnUniform.error'))
        });

        modal?.simpleWarningModal({
            header: modalT('return.header'),
            message: modalT('return.message', { type: props.uniformType.name, number: uniform.number }),
            primaryFunction: returnItem,
            primaryOption: t('common.actions.return')
        });
    }

    useEffect(() => {
        const handleSizeChange = () => {
            if (window.innerWidth < 992) {
                setEditable(false);
            }
        }

        window.addEventListener('resize', handleSizeChange);
        return () => window.removeEventListener('resize', handleSizeChange);
    }, []);

    return (
        <div data-testid={`div_uitem_${uniform.id}`} className={`row border-top border-1 white m-0`}>
            <form id={`uniform_${uniform.id}`} onSubmit={form.handleSubmit(saveUniform)} className="p-0">
                <FormProvider {...form}>
                    <div className="col-12">
                        <div className={`row pb-2 pt-1 m-0 ${selected ? "bg-primary-subtle" : "bg-white"}`} onClick={onLineClick}>
                            {(userRole >= AuthRole.inspector) &&
                                <div className={`d-none d-sm-block col-auto pt-1`}>
                                    {!editable && <>
                                        <TooltipIconButton
                                            variant="outline-danger"
                                            buttonSize="sm"
                                            buttonType="button"
                                            tooltipText={t('common.actions.return')}
                                            icon={faRightToBracket}
                                            iconClass="fa-flip-horizontal"
                                            onClick={() => withdraw(uniform)}
                                            testId={"btn_withdraw"}
                                        />
                                        <TooltipIconButton
                                            variant="outline-primary"
                                            buttonSize="sm"
                                            buttonType="button"
                                            tooltipText={t('common.actions.replace')}
                                            icon={faRightLeft}
                                            onClick={props.replaceItem}
                                            testId={"btn_switch"}
                                        />
                                    </>
                                    }
                                </div>
                            }
                            <Col xs={10} sm={9} md={9} lg={editable ? 10 : 9} xxl={10} className="ps-2 pe-0">
                                <Row>
                                    <Col xs={3} md={2} lg={1}>
                                        <Row className="fs-8 fw-bold fst-italic">
                                            {t('common.uniform.number')}
                                        </Row>
                                        <Row data-testid={"div_number"} className={`fw-bold ${uniform.active ? "" : "text-danger "} ${editable ? "pt-1" : ""}`}>
                                            {uniform.number}
                                        </Row>
                                    </Col>
                                    <Col xs={uniformType.usingGenerations ? 6 : 0} sm={6} md={4} lg={3} xxl={editable ? 3 : 2}>
                                        <Row className="fs-8 fw-bold fst-italic">
                                            {uniformType.usingGenerations ? t('common.uniform.generation.label', { count: 1 }) : ""}
                                        </Row>
                                        <GenerationRow
                                            uniform={uniform}
                                            uniformType={uniformType}
                                            editable={editable} />
                                    </Col>
                                    <Col xs={uniformType.usingSizes ? 3 : 0} sm={2} md={2} xxl={editable ? 2 : 1}>
                                        <Row className="fs-8 fw-bold fst-italic">
                                            {uniformType.usingSizes ? t('common.uniform.size') : ""}
                                        </Row>
                                        <SizeRow uniform={uniform}
                                            uniformType={uniformType}
                                            editable={editable} />
                                    </Col>
                                    <Col md={4} lg={6} xl={6} xxl={editable ? 6 : 8} className="d-none d-md-inline">
                                        <Row className="fs-8 fw-bold fst-italic">
                                            {t('common.comment')}
                                        </Row>
                                        <Row data-testid={"div_comment"} className="text-wrap">
                                            {editable
                                                ? <FormControl as={"textarea"}  {...form.register('comment')} />
                                                : <p className="p-0 m-0 text-truncate">
                                                    {uniform.comment}
                                                </p>
                                            }
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            {(userRole >= AuthRole.inspector) &&
                                <div className="col-1 col-sm-auto d-sm-none align-self-center">
                                    <Dropdown drop="start">
                                        <Dropdown.Toggle variant="outline-primary" className="border-0" id={uniform.id + "-dropdown"} data-testid={"btn_menu"}>
                                            <FontAwesomeIcon icon={faBars} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={props.replaceItem} data-testid={"btn_menu_switch"}>
                                                {t('common.actions.replace')}
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => withdraw(uniform)} data-testid={"btn_menu_withdraw"}>
                                                {t('common.actions.return')}
                                            </Dropdown.Item>
                                            <Link prefetch={false} href={'/[locale]/app/uniform/[uniformId]'} as={`/${locale}/app/uniform/${uniform.id}`}>
                                                <Dropdown.Item onClick={() => { modal?.uniformItemDetailModal(uniform.id, uniformType, cadetId) }} data-testid={"btn_menu_open"}>
                                                    {t('common.actions.open')}
                                                </Dropdown.Item>
                                            </Link>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            }
                            <Col sx="auto" className={`d-none d-sm-block col-auto ${editable ? "pt-3" : "pt-1"}`}>
                                {editable ?
                                    <>
                                        <TooltipIconButton
                                            icon={faCheck}
                                            variant="outline-success"
                                            tooltipText="Speichern"
                                            testId="btn_save"
                                            buttonType="submit"
                                            onClick={() => { }}
                                            buttonSize="sm"
                                            iconClass="fa-xl"
                                            disabled={form.formState.isSubmitting}
                                            key={"btn_submit"}
                                        />
                                        <TooltipIconButton
                                            icon={faXmark}
                                            variant="outline-danger"
                                            tooltipText="abbrechen"
                                            testId="btn_cancel"
                                            onClick={() => setEditable(false)}
                                            buttonSize="sm"
                                            buttonType="button"
                                            iconClass="fa-xl"
                                            disabled={form.formState.isSubmitting}
                                            key={"btn_cancel"}
                                        />
                                    </>
                                    : <>
                                        {(userRole >= AuthRole.inspector) &&
                                            <TooltipIconButton
                                                icon={faPencil}
                                                variant="outline-primary"
                                                tooltipText="Bearbeiten"
                                                testId="btn_edit"
                                                onClick={editUniform}
                                                buttonSize="sm"
                                                buttonClass="d-sm-none d-lg-inline"
                                                buttonType="button"
                                                key={"btn_edit"}
                                            />
                                        }
                                        <TooltipIconButton
                                            icon={faArrowUpRightFromSquare}
                                            variant="outline-secondary"
                                            tooltipText="Detailansicht öffnen"
                                            testId="btn_open"
                                            onClick={() => { modal?.uniformItemDetailModal(uniform.id, uniformType, cadetId) }}
                                            buttonSize="sm"
                                            buttonType="button"
                                            key={"btn_open"}
                                        />
                                    </>}
                            </Col>
                        </div>
                    </div>
                </FormProvider>
            </form>
        </div >
    )
}

const GenerationRow = ({
    uniformType, editable, uniform
}: {
    uniformType: UniformType,
    editable: boolean,
    uniform: Uniform,
}) => {
    const { register, watch } = useFormContext<UniformFormData>();

    if (!uniformType.usingGenerations) return (
        <Row data-testid={"div_generation"} className="text-secondary">
            ---
        </Row>
    );

    if (!editable) return (
        <Row data-testid={"div_generation"} className={`text-truncate pe-2 ${!uniform.generation ? "text-danger" : uniform.generation.outdated ? "text-warning" : ""}`}>
            <p className="text-truncate p-0 m-0">
                {uniform.generation ? uniform.generation.name : "K.A."}
            </p>
        </Row>
    )

    const selectedGeneration = uniformType.uniformGenerationList.find((gen) => gen.id === watch('generation'));

    return (
        <Row data-testid={"div_generation"} className="pe-3">
            <Form.Select autoFocus {...register('generation')} className={!selectedGeneration ? "text-danger" : selectedGeneration.outdated ? "text-warning" : ""}>
                <option value="" className="text-danger">K.A.</option>
                {uniformType.uniformGenerationList.map((gen) =>
                    <option key={gen.id} value={gen.id} className={gen.outdated ? "text-warning tests" : "text-black"}>
                        {gen.name}
                    </option>
                )}
            </Form.Select>
        </Row>
    )
}

const SizeRow = ({
    editable, uniform, uniformType
}: {
    editable: boolean;
    uniform: Uniform;
    uniformType: UniformType;
}) => {
    const { sizeLists } = useGlobalData();
    const { watch, setValue, getValues, register } = useFormContext<UniformFormData>();

    const [usedSizeList, setUsedSizeList] = useState<UniformSizeList>();


    const generationChanged = async (generationId?: string) => {
        const newSizeList = getUniformSizeList({
            generationId,
            type: uniformType,
            sizeLists: sizeLists,
        });
        // no sizeList
        if (!newSizeList) {
            setUsedSizeList(undefined);
            setValue("size", "", { shouldValidate: true });
            return;
        }
        // same sizeList
        if (usedSizeList && newSizeList.id === usedSizeList.id) {
            return;
        }

        // different sizeList
        await setUsedSizeList(newSizeList);
    }

    useEffect(() => {
        const generationId = watch("generation");
        generationChanged(generationId);

    }, [watch("generation")]);

    useEffect(() => {
        if (usedSizeList) {
            const oldSize = getValues("size");

            if (usedSizeList.uniformSizes.find(s => s.id == oldSize)) {
                setValue("size", oldSize, { shouldValidate: true });
            } else {
                setValue("size", "", { shouldValidate: true });
            }
        }
    }, [usedSizeList])


    if (!uniformType.usingSizes) return (
        <Row data-testid={"div_size"} className={"text-secondary"}>
            ---
        </Row>
    )

    if (!editable) return (
        <Row data-testid={"div_size"} className={!uniform.size ? "text-danger" : ""}>
            <p className="d-none d-md-block p-0 m-0 text-truncate">
                {uniform.size ? uniform.size.name : "K.A."}
            </p>
            <p className="d-md-none p-0 m-0">
                {uniform.size ? uniform.size.name : "K.A."}
            </p>
        </Row>
    )

    const selectedSize = usedSizeList?.uniformSizes.find(s => s.id === watch("size"));

    return (
        <Row data-testid={"div_size"} className="pe-3">
            <Form.Select {...register('size')} className={!selectedSize ? "text-danger" : ""}>
                <option value={""} className="text-danger">K.A.</option>
                {usedSizeList?.uniformSizes.map((size) =>
                    <option key={size.id} value={size.id} className="text-black">
                        {size.name}
                    </option>
                )}
            </Form.Select>
        </Row>
    )
}

export default UniformRow;
