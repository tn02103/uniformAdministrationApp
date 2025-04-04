import { LabelIconButton } from "@/components/Buttons/LabelIconButton";
import { InputFormField } from "@/components/fields/InputFormField";
import { NumberInputFormField } from "@/components/fields/NumberInputFormField";
import { SelectFormField } from "@/components/fields/SelectFormField";
import { ToggleFormField } from "@/components/fields/ToggleFormField";
import { useModal } from "@/components/modals/modalProvider";
import { getUniformItemCountByType } from "@/dal/uniform/item/_index";
import { createUniformType, deleteUniformType, updateUniformType } from "@/dal/uniform/type/_index";
import { useUniformSizelists, useUniformTypeList } from "@/dataFetcher/uniformAdmin";
import { useI18n } from "@/lib/locales/client";
import { SAFormHandler } from "@/lib/SAFormHandler";
import { UniformType } from "@/types/globalUniformTypes";
import { uniformTypeFormSchema, UniformTypeFormType } from "@/zod/uniformConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Button, Col, Offcanvas, Row } from "react-bootstrap";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { UniformGenerationTable } from "./UniformGenerationTable";

type Props = {
    uniformType: UniformType | null;
    editable: boolean;
    setEditable: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedTypeId: (id: string | null) => void;
}

export const UniformTypeOffcanvas = ({ uniformType, setSelectedTypeId, editable, setEditable }: Props) => {
    const form = useForm<UniformTypeFormType>({
        mode: "onChange",
        defaultValues: uniformType ?? undefined,
        resolver: zodResolver(uniformTypeFormSchema),
    });

    const t = useI18n();
    const modal = useModal();
    const { sizelistList } = useUniformSizelists();
    const { mutate, typeList } = useUniformTypeList();
    const sizelistOptions = sizelistList?.map(sl => ({ value: sl.id, label: sl.name })) ?? [];

    useEffect(() => {
        if (!editable) {
            form.reset(uniformType ?? undefined);
            if (!uniformType) {
                setEditable(true);
            }
        }
    }, [uniformType]);

    const handleSave = async (data: UniformTypeFormType) => {
        if (!uniformType) {
            handleCreate(data);
            return;
        }
        SAFormHandler(
            updateUniformType({ data, id: uniformType.id }),
            form.setError,
            (data) => {
                setEditable(false);
                mutate(data);
            },
            t('common.error.actions.save'),
        );
    }
    const handleCreate = async (data: UniformTypeFormType) => {
        SAFormHandler(
            createUniformType(data),
            form.setError,
            (data) => {
                setEditable(false);
                setSelectedTypeId(data.id);
                mutate();
            },
            t('common.error.actions.create'),
        );
    }
    const handleCancel = () => {
        if (!uniformType) {
            setSelectedTypeId(null);
            setEditable(false);
        } else {
            setEditable(false);
            form.reset(uniformType ?? undefined);
        }
    }
    const handleDelete = async () => {
        if (!uniformType) return;

        const deleteMutation = () => {
            setSelectedTypeId(null);
            mutate(
                deleteUniformType(uniformType.id),
                {
                    optimisticData: typeList?.filter(t => t.id !== uniformType.id)
                }
            ).catch((e) => {
                console.error(e);
                toast.error(t('common.error.actions.delete'));
            });
        }

        await getUniformItemCountByType(uniformType.id).then(count =>
            modal?.dangerConfirmationModal({
                header: t('admin.uniform.type.deleteModal.header', { type: uniformType.name }),
                message: <span>
                    {t('admin.uniform.type.deleteModal.message.part1', { type: uniformType.name })}<br />
                    {t('admin.uniform.type.deleteModal.message.part2')}
                    <span className="fw-bold">{t('admin.uniform.type.deleteModal.message.part3', { count })}</span>
                    {t('admin.uniform.type.deleteModal.message.part4')}
                </span>,
                confirmationText: t('admin.uniform.type.deleteModal.confirmationText', { type: uniformType.name }),
                dangerOption: {
                    option: t('common.actions.delete'),
                    function: deleteMutation,
                }
            })
        );
    }

    return (
        <Offcanvas show={true} onHide={() => setSelectedTypeId(null)} placement="end" backdrop={false} style={{ width: "500px" }}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    <h2>{uniformType?.name ?? "Neu erstellen"}</h2>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h3 className="text-center">Details</h3>
                <hr className="my-0" />
                {uniformType && (
                    <Row className="mb-4 justify-content-evenly">
                        <LabelIconButton
                            variantKey="edit"
                            disabled={editable}
                            onClick={() => setEditable(!editable)}
                        />
                        <LabelIconButton
                            variantKey="delete"
                            disabled={editable}
                            onClick={() => handleDelete()}
                        />
                    </Row>
                )}
                <form noValidate autoComplete="off" onSubmit={form.handleSubmit(handleSave)}>
                    <FormProvider {...form}>
                        <Row>
                            <Col xs={6}>
                                <InputFormField<UniformTypeFormType> name="name" label="Name" required plaintext={!editable} disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                <InputFormField<UniformTypeFormType> name="acronym" label="Kürzel" placeholder="XX" required plaintext={!editable} disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                <NumberInputFormField<UniformTypeFormType> name="issuedDefault" label="Anz. ausgegeben" plaintext={!editable} disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                {form.watch("usingSizes") === true && (
                                    <SelectFormField<UniformTypeFormType> name="fk_defaultSizelist" label="Standard Größenliste" options={sizelistOptions} plaintext={!editable} />
                                )}
                            </Col>
                            <Col xs={6}>
                                <ToggleFormField<UniformTypeFormType> name="usingSizes" label="Nutzt Größen" disabled={!editable} />
                            </Col>
                            <Col xs={6}>
                                <ToggleFormField<UniformTypeFormType> name="usingGenerations" label="Nutzt Generationen" disabled={!editable} />
                            </Col>
                        </Row>
                        {editable && (
                            <Row className="justify-content-evenly mt-2 mb-4">
                                <Button className="col-auto" type="submit" variant="outline-primary">Speichern</Button>
                                <Button className="col-auto" variant="outline-secondary" onClick={handleCancel}>Abbrechen</Button>
                            </Row>
                        )}
                    </FormProvider>
                </form>
                {uniformType && uniformType.usingGenerations && (
                    <UniformGenerationTable
                        uniformType={uniformType}
                    />
                )}
            </Offcanvas.Body>
        </Offcanvas>
    )
}

